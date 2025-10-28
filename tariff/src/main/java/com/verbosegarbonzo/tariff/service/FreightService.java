package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import java.io.StringReader;

@Service
public class FreightService {

    @Value("${freight.api.url}")
    private String freightApiUrl;

    private final CountryRepository countryRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public FreightService(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    /**
     * Calculates freight using Freightos city-based API.
     * Throws exceptions if data is missing or the API fails.
     */

    public Double calculateFreight(String mode, String importerCode, String exporterCode, double weight) {
        // Look up importer/exporter countries
        Country importer = countryRepository.findById(importerCode)
                .orElseThrow(() -> new IllegalArgumentException("Importer not found: " + importerCode));
        Country exporter = countryRepository.findById(exporterCode)
                .orElseThrow(() -> new IllegalArgumentException("Exporter not found: " + exporterCode));

        String originCity = exporter.getCity();
        String destinationCity = importer.getCity();

        if (originCity == null || destinationCity == null) {
            throw new IllegalStateException("Missing city for exporter/importer in database");
        }

        // Build XML payload
        String xmlPayload = """
            <?xml version="1.0" encoding="UTF-8"?>
            <shippingCalculatorRequest>
                <origin>%s</origin>
                <destination>%s</destination>
                <mode>%s</mode>
                <weight>%.2f</weight>
                <weightUnit>kg</weightUnit>
            </shippingCalculatorRequest>
            """.formatted(originCity, destinationCity, mode, weight);

        try {
            // Send request to Freightos
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            headers.setAccept(java.util.List.of(MediaType.APPLICATION_XML));
            HttpEntity<String> request = new HttpEntity<>(xmlPayload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(freightApiUrl, request, String.class);

            String body = response.getBody();
            if (body == null) {
                throw new RuntimeException("Empty response from Freight API");
            }

            // Extract <price> safely using XML parser
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new StringReader(body)));
            var priceNode = doc.getElementsByTagName("price").item(0);

            if (priceNode == null) {
                throw new RuntimeException("Freight API did not return a <price> element. Response: " + body);
            }

            return Double.parseDouble(priceNode.getTextContent());

        } catch (Exception e) {
            throw new RuntimeException("Freight service failed: " + e.getMessage(), e);
        }
    }
}
