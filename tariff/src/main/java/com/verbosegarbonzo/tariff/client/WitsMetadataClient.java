package com.verbosegarbonzo.tariff.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.verbosegarbonzo.tariff.config.WitsProperties;
import com.verbosegarbonzo.tariff.model.CountryRef;
import com.verbosegarbonzo.tariff.model.ProductRef;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class WitsMetadataClient {
//Calls WITS metadata endpoints (countries/products), parses XML, caches in memory, provides search methods

    private final WebClient webClient;
    private final WitsProperties props;

    private final Map<String, CountryRef> countriesByIso3 = new ConcurrentHashMap<>();
    private final List<ProductRef> products = new ArrayList<>();

    public WitsMetadataClient(WebClient witsWebClient, WitsProperties props) {
        this.webClient = witsWebClient;
        this.props = props;
    }

    @PostConstruct
    public void loadMetadata() {
        loadCountries();
        //loadProducts();
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
    
            //System.out.println("RAW XML: " + xml.substring(0, Math.min(500, xml.length())));
    
            XmlMapper xmlMapper = new XmlMapper();
            JsonNode root = xmlMapper.readTree(xml);
    
            List<CountryRef> refs = new ArrayList<>();
    
            JsonNode countries = root.path("countries");
            for (JsonNode country : countries.withArray("country")) {
                String iso3 = country.path("iso3Code").asText();
                String name = country.path("name").asText();
                String numeric = country.path("countrycode").asText(); //from attribute
    
                if (!iso3.isEmpty() && !name.isEmpty() && numeric.matches("\\d+")) { //to eliminate groups with no numeric code
                    refs.add(new CountryRef(name, iso3, numeric));
                }
            }
    
            refs.forEach(c -> countriesByIso3.put(c.getIso3(), c));
    
            System.out.println("Loaded " + countriesByIso3.size() + " countries into cache.");
        } catch (Exception e) {
            e.printStackTrace();
        }

        //Parse XML into CountryRef list (using Jackson XML)
        //Fill countriesByIso3 map and list
    }

    private void loadProducts() {
        String xml = webClient.get()
                .uri(props.getMetadata().getProduct() + "/ALL")
                .retrieve()
                .bodyToMono(String.class)
                .block();

        //Parse XML into ProductRef list (using Jackson XML)
        //Fill products list
    }

    public List<CountryRef> searchCountries(String query) {
        if (query == null || query.length() < 2) return Collections.emptyList();
    
        return countriesByIso3.values().stream()
                .filter(c -> c.getName().toLowerCase().contains(query.toLowerCase())
                          || c.getIso3().toLowerCase().contains(query.toLowerCase())) //can search based on ISO3 code
                .sorted(Comparator.comparing(CountryRef::getName)) //sorted for better UX
                .limit(10) //limit to only 10 results
                .collect(Collectors.toList());
    }

    public List<ProductRef> searchProducts(String query) {
        if (query == null || query.length() < 2) return Collections.emptyList();
        return products.stream()
                .filter(p -> p.getName().toLowerCase().contains(query.toLowerCase()))
                .limit(10) //limit to only 10 results
                .collect(Collectors.toList());
    }
}
