package com.verbosegarbonzo.tariff.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.verbosegarbonzo.tariff.config.WitsProperties;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.ProductRepository;

import jakarta.annotation.PostConstruct;
import reactor.core.publisher.Flux;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.data.domain.Sort;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;

@Component
public class WitsMetadataClient {
    // Calls WITS metadata endpoints (countries/products), parses XML, caches in
    // memory, provides search methods

    private final WebClient webClient;
    private final WitsProperties props;
    private final ProductRepository productRepository;

    private final Map<String, Country> countriesByIso3 = new ConcurrentHashMap<>();

    public WitsMetadataClient(@Qualifier("metadataWebClient") WebClient metadataWebClient, WitsProperties props,
            ProductRepository productRepository) {
        this.webClient = metadataWebClient;
        this.props = props;
        this.productRepository = productRepository;
    }

    @PostConstruct
    public void loadMetadata() {
        loadCountries();
    }

    private void loadCountries() {
        try {
            String xml = webClient.get()
                    .uri(props.getMetadata().getCountry() + "/ALL")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (xml == null || xml.isEmpty()) {
                System.err.println("No XML received from WITS countries endpoint.");
                return;
            }

            // System.out.println("RAW XML: " + xml.substring(0, Math.min(500,
            // xml.length())));

            XmlMapper xmlMapper = new XmlMapper();
            JsonNode root = xmlMapper.readTree(xml);

            List<Country> s = new ArrayList<>();

            JsonNode countries = root.path("countries");
            for (JsonNode country : countries.withArray("country")) {
                String iso3 = country.path("iso3Code").asText();
                String name = country.path("name").asText();
                String numeric = country.path("countrycode").asText(); // from attribute

                if (!iso3.isEmpty() && !name.isEmpty() && numeric.matches("\\d+")) { // to eliminate groups with no
                                                                                     // numeric code
                    refs.add(new Country(name, iso3, numeric));
                }
            }

            countriesByIso3.clear();
            s.forEach(c -> countriesByIso3.put(c.getIso3(), c));

            System.out.println("Loaded " + countriesByIso3.size() + " countries into cache.");
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Parse XML into Country list (using Jackson XML)
        // Fill countriesByIso3 map and list
    }

    @Transactional
    public void loadProducts() {
        final int BATCH = 500;

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

        long seen = 0, queued = 0;
        //seen: how many elements encountered
        //queued: how many rows prepared for DB

        final java.util.List<String[]> batch = new java.util.ArrayList<>(BATCH);

        try (InputStream in = is) {
            XMLInputFactory f = XMLInputFactory.newFactory();
            f.setProperty(XMLInputFactory.IS_NAMESPACE_AWARE, true);
            XMLStreamReader r = f.createXMLStreamReader(in);

            //per-product scratch
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

                            //HS6
                            if (n.equals("productcode") || n.equals("hs6code") || n.equals("code") || n.equals("id")) {
                                hs6 = v;
                            }
                            //Description
                            if (n.equals("productdesc") || n.equals("productdescription")
                                    || n.equals("description") || n.equals("name")
                                    || n.equals("title") || n.equals("label") || n.equals("desc")) {
                                desc = v;
                            }
                        }
                    }

                    //WITS description is usually a child element:
                    //<productdescription>…</productdescription>
                    if ("productdescription".equalsIgnoreCase(tag)) {
                        String t = r.getElementText(); //consume text & END_ELEMENT for productdescription
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

                            //clean leading "HS6 -- " if present
                            String cleaned = desc.replaceFirst("^\\s*"
                                    + java.util.regex.Pattern.quote(hs6)
                                    + "\\s*[-–—]*\\s*", "");

                            batch.add(new String[] { hs6, cleaned });
                            queued++;

                            if (batch.size() >= BATCH) {
                                flushBatch(batch);
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
                flushBatch(batch);
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

    private void flushBatch(java.util.List<String[]> batch) {
        //upsert each row using the repository method
        for (String[] arr : batch) {
            productRepository.upsert(arr[0], arr[1]); // hs6, desc
        }
    }

    public List<Country> searchCountries(String query) {
        if (query == null || query.length() < 2)
            return Collections.emptyList();

        return countriesByIso3.values().stream()
                .filter(c -> c.getName().toLowerCase().contains(query.toLowerCase())
                        || c.getIso3().toLowerCase().contains(query.toLowerCase())) // can search based on ISO3 code
                .sorted(Comparator.comparing(Country::getName)) // sorted for better UX
                .limit(10) // limit to only 10 results
                .collect(Collectors.toList());
    }

    public List<Product> searchProducts(String query) {
        if (query == null || (query = query.trim()).length() < 2) {
        return Collections.emptyList();
    }
    var page = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "description"));
    return productRepository.searchProducts(query, page); //sorted by description, asc
}
}
