package com.verbosegarbonzo.tariff.client;

import com.verbosegarbonzo.tariff.config.WitsProperties;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;

import reactor.core.publisher.Flux;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.InputStream;
import java.util.regex.Pattern;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;

@Component
public class WitsMetadataClient {
    // Calls WITS metadata endpoints (countries/products), parses XML, caches in
    // memory, provides search methods

    private static final Pattern LEAD_DASHES = Pattern.compile("^\\s*[-–—]+\\s*");
    private static final Pattern YEAR_NOTE = Pattern.compile("^\\s*\\((?:-?\\d{4}|\\d{4}-\\d{0,4})\\)\\s*[-–—]*\\s*");

    private static final java.util.Map<String,String> NAME_FIXUPS = java.util.Map.of(
        "YUG", "Yugoslavia, FR (Serbia/Montenegro)"
    ); //due to WITS naming oddities

    private final WebClient webClient;
    private final WitsProperties props;
    private final ProductRepository productRepository;
    private final CountryRepository countryRepository;

    public WitsMetadataClient(@Qualifier("metadataWebClient") WebClient metadataWebClient, WitsProperties props,
            ProductRepository productRepository, CountryRepository countryRepository) {
        this.webClient = metadataWebClient;
        this.props = props;
        this.productRepository = productRepository;
        this.countryRepository = countryRepository;
    }

    public void loadCountries() {
        final int BATCH = 100;
    
        // --- Removed deletion: keep admin-added city & valuation_basis ---
        System.out.println("Starting country sync without deleting existing records.");
    
        final String url = props.getBaseUrl() + props.getMetadata().getCountry() + "/ALL";
    
        final Flux<DataBuffer> body = webClient.get()
                .uri(url)
                .accept(org.springframework.http.MediaType.APPLICATION_XML)
                .retrieve()
                .bodyToFlux(DataBuffer.class);
    
        final InputStream is = DataBufferUtils.join(body).map(db -> db.asInputStream(true)).block();
        if (is == null) {
            System.err.println("No XML received from WITS countries endpoint.");
            return;
        }
    
        long seen = 0, queued = 0;
        final java.util.List<String[]> batch = new java.util.ArrayList<>(BATCH);
    
        try (InputStream in = is) {
            XMLInputFactory f = XMLInputFactory.newFactory();
            f.setProperty(XMLInputFactory.IS_NAMESPACE_AWARE, true);
            XMLStreamReader r = f.createXMLStreamReader(in);
    
            String iso3 = null;
            String name = null;
            String numeric = null;
    
            while (r.hasNext()) {
                int ev = r.next();
    
                if (ev == XMLStreamConstants.START_ELEMENT) {
                    String tag = r.getLocalName();
    
                    if ("country".equalsIgnoreCase(tag)) {
                        seen++;
    
                        for (int i = 0; i < r.getAttributeCount(); i++) {
                            String n = r.getAttributeLocalName(i);
                            String v = r.getAttributeValue(i);
                            if (n == null || v == null) continue;
                            n = n.toLowerCase();
                            v = v.trim();
                            if (v.isEmpty()) continue;
    
                            if (n.contains("iso3")) {
                                iso3 = v;
                            } else if (n.contains("name")) {
                                name = v;
                            } else if (n.equals("countrycode")) {
                                numeric = v;
                            }
                        }
                    }
    
                    // child elements handling
                    String lower = tag.toLowerCase();
                    if (lower.contains("iso3")) {
                        iso3 = safeReadElementText(r);
                        continue;
                    }
                    if (lower.contains("name")) {
                        name = safeReadElementText(r);
                        continue;
                    }
                    if (lower.equals("m49")) {
                        numeric = safeReadElementText(r);
                        continue;
                    }
                }
    
                if (numeric != null && iso3 != null && numeric.equalsIgnoreCase(iso3)) {
                    iso3 = name = numeric = null;
                    continue; // skip invalid group-of-country entries
                }
    
                if (ev == XMLStreamConstants.END_ELEMENT) {
                    String end = r.getLocalName();
    
                    if ("country".equalsIgnoreCase(end)) {
                        if (iso3 != null) {
                            iso3 = iso3.trim().toUpperCase();
                            if (iso3.length() > 3)
                                iso3 = iso3.substring(0, 3);
    
                            String fixed = NAME_FIXUPS.get(iso3);
                            if (fixed != null)
                                name = fixed;
                        }
    
                        if (name != null)
                            name = name.trim();
                        if (numeric != null)
                            numeric = numeric.trim();
    
                        if (iso3 != null && iso3.length() == 3 && name != null && !name.isBlank()) {
                            batch.add(new String[]{iso3, name,
                                    (numeric == null || numeric.isBlank()) ? null : numeric});
                            queued++;
    
                            if (batch.size() >= BATCH) {
                                flushCountryBatch(batch);
                                batch.clear();
                                System.out.println("Upserted countries so far: " + queued);
                            }
                        } else if (seen <= 5) {
                            System.out.println("DEBUG missing country fields at #" + seen +
                                    " -> iso3=" + iso3 + ", name=" + name + ", numeric=" + numeric);
                        }
    
                        iso3 = name = numeric = null;
                    }
                }
            }
    
            if (!batch.isEmpty()) {
                flushCountryBatch(batch);
                System.out.println("Final country batch upserted. Total rows: " + queued);
            }
    
            System.out.println("Seen <country>: " + seen + ", queued rows: " + queued);
            if (queued == 0)
                System.out.println("Parsed 0 country rows.");
    
        } catch (Exception e) {
            throw new RuntimeException("Failed to stream/parse countries XML", e);
        }
    }    

    private static String safeReadElementText(XMLStreamReader r) throws Exception {
        //consumes the element text and its END_ELEMENT
        String t = r.getElementText();
        return (t == null) ? null : t.trim();
    }

    private void flushCountryBatch(java.util.List<String[]> batch) {
        for (String[] arr : batch) {
            //arr[0]=iso3, arr[1]=name, arr[2]=numeric
            countryRepository.upsert(arr[0], arr[1], arr[2]);
        }
    }


    // remove HS6 prefix, WITS leading dashes, and year notes.
    private static String cleanDesc(String hs6, String desc) {
        if (desc == null)
            return null;
        String out = desc;

        // remove an initial HS code like "290531" plus separators/dashes
        String hs6fixed = hs6.substring(0, 6);
        out = out.replaceFirst("^\\s*" + Pattern.quote(hs6fixed) + "\\s*[:.;,/]*\\s*[-–—]*\\s*", "");

        // strip any leading hierarchy dashes (WITS uses --, ---)
        out = LEAD_DASHES.matcher(out).replaceFirst("");

        // drop leading year qualifier notes (may appear more than once)
        while (YEAR_NOTE.matcher(out).find()) {
            out = YEAR_NOTE.matcher(out).replaceFirst("");
        }

        // normalise whitespace and trim
        out = out.replaceAll("\\s{2,}", " ").trim();
        return out;
    }

    public void loadProducts() {
        final int BATCH = 100;

        try {
            int deleted = productRepository.deleteAllProduct();
            System.out.println("Deleted existing rows: " + deleted);
        } catch (Exception e) {
            System.err.println("Warning: failed to delete previous rows; continuing ingest");
            e.printStackTrace();
        }

        final String url = props.getBaseUrl() + props.getMetadata().getProduct() + "/ALL";
        final Flux<DataBuffer> body = webClient.get()
                .uri(url)
                .accept(org.springframework.http.MediaType.APPLICATION_XML)
                .retrieve()
                .bodyToFlux(DataBuffer.class);

        final InputStream is = DataBufferUtils.join(body).map(db -> db.asInputStream(true)).block();
        if (is == null) {
            System.err.println("No XML received from WITS products endpoint.");
            return;
        }

        // seen: how many elements encountered
        // queued: how many rows prepared for DB
        long seen = 0, queued = 0;
        
        final java.util.List<String[]> batch = new java.util.ArrayList<>(BATCH);

        try (InputStream in = is) {
            XMLInputFactory f = XMLInputFactory.newFactory();
            f.setProperty(XMLInputFactory.IS_NAMESPACE_AWARE, true);
            XMLStreamReader r = f.createXMLStreamReader(in);

            // per-product scratch
            String hs6 = null;
            String desc = null;

            while (r.hasNext()) {
                int ev = r.next();

                if (ev == XMLStreamConstants.START_ELEMENT) {
                    String tag = r.getLocalName();

                    if ("product".equalsIgnoreCase(tag)) {
                        seen++;

                        for (int i = 0; i < r.getAttributeCount(); i++) {
                            String n = r.getAttributeLocalName(i);
                            String v = r.getAttributeValue(i);
                            if (n == null || v == null)
                                continue;
                            n = n.toLowerCase();
                            v = v.trim();
                            if (v.isEmpty())
                                continue;

                            // HS6
                            if (n.equals("productcode")) {
                                hs6 = v;
                            }
                            // Description
                            if (n.equals("productdescription")) {
                                desc = v;
                            }
                        }
                    }

                    // WITS description is usually a child element:
                    // <productdescription>…</productdescription>
                    if ("productdescription".equalsIgnoreCase(tag)) {
                        String t = r.getElementText(); // consume text & END_ELEMENT for productdescription
                        if (t != null && !t.isBlank())
                            desc = t.trim();
                        continue;
                    }
                }

                if (ev == XMLStreamConstants.END_ELEMENT) {
                    String end = r.getLocalName();

                    if ("product".equalsIgnoreCase(end)) {
                        //finalize one product
                        if (hs6 != null && !hs6.isBlank() && desc != null && !desc.isBlank()) {
                            if (hs6.length() > 6)
                                hs6 = hs6.substring(0, 6);

                            //filter for Chapter 29
                            if (!hs6.startsWith("29")) {
                                hs6 = null;
                                desc = null;
                                continue; //skip products not in Chapter 29
                            }

                            // clean description and skip "Other"
                            String cleaned = cleanDesc(hs6, desc);
                            if (cleaned == null || cleaned.isBlank() || cleaned.equalsIgnoreCase("Other")) {
                                //skip basket codes and empties
                                hs6 = null;
                                desc = null;
                                continue;
                            }

                            batch.add(new String[] { hs6, cleaned });
                            queued++;

                            if (batch.size() >= BATCH) {
                                flushProductBatch(batch);
                                batch.clear();
                                System.out.println("Upserted rows so far: " + queued);
                            }
                        } else if (seen <= 5) {
                            System.out.println(
                                    "DEBUG missing fields at product #" + seen + " -> hs6=" + hs6 + ", desc=" + desc);
                        }

                        //reset for next product
                        hs6 = null;
                        desc = null;
                    }
                }
            }

            if (!batch.isEmpty()) {
                flushProductBatch(batch);
                System.out.println("Final batch upserted. Total rows: " + queued);
            }

            System.out.println("Seen <product>: " + seen + ", queued rows: " + queued);
            if (queued == 0) {
                System.out.println(
                        "Parsed 0 rows.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to stream/parse products XML", e);
        }
    }

    private void flushProductBatch(java.util.List<String[]> batch) {
        //upsert each row using the repository method
        for (String[] arr : batch) {
            productRepository.upsert(arr[0], arr[1]); // hs6, desc
        }
    }

}
