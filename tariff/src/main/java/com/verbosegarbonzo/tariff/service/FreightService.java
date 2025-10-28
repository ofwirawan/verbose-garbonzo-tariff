package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.exception.FreightCalculationException;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class FreightService {

    @Value("${freight.api.url}")
    private String freightApiUrl; // e.g. https://ship.freightos.com/api/shippingCalculator

    private final CountryRepository countryRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FreightService(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    /**
     * Calculates freight cost using Freightos GET API (JSON mode).
     * Uses city names stored in the Country entity.
     */
    public Double calculateFreight(String mode, String importerCode, String exporterCode, double weight) {
        Country importer = countryRepository.findById(importerCode)
                .orElseThrow(() -> new IllegalArgumentException("Importer not found: " + importerCode));
        Country exporter = countryRepository.findById(exporterCode)
                .orElseThrow(() -> new IllegalArgumentException("Exporter not found: " + exporterCode));

        if (importer.getCity() == null || exporter.getCity() == null) {
            throw new IllegalStateException("City missing for importer or exporter in database");
        }

        String origin = exporter.getCity();      // already formatted as “City,Country”
        String destination = importer.getCity(); // already formatted as “City,Country”

        try {
            // Build query URL
            String url = UriComponentsBuilder.fromHttpUrl(freightApiUrl)
                    .queryParam("loadtype", "boxes")
                    .queryParam("weight", weight)
                    .queryParam("width", 50)
                    .queryParam("length", 50)
                    .queryParam("height", 50)
                    .queryParam("quantity", 1)
                    .queryParam("origin", origin)
                    .queryParam("destination", destination)
                    .queryParam("mode", mode)
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, String.class);

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new RuntimeException("Freight API returned status: " + response.getStatusCode());
            }

            // Parse JSON response
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode estimated = root.path("response").path("estimatedFreightRates");

            if (estimated.path("numQuotes").asInt() == 0) {
                throw new RuntimeException("No freight quotes available for route: " + origin + " → " + destination);
            }

            JsonNode modeNode = estimated.path("mode");
            // handle array or object
            if (modeNode.isArray() && modeNode.size() > 0) {
                modeNode = modeNode.get(0);
            }

            JsonNode priceNode = modeNode.path("price");
            JsonNode minNode = priceNode.path("min").path("moneyAmount").path("amount");
            JsonNode maxNode = priceNode.path("max").path("moneyAmount").path("amount");

            if (minNode.isMissingNode() || maxNode.isMissingNode()) {
                throw new RuntimeException("Freight API response missing expected price fields");
            }

            double min = minNode.asDouble();
            double max = maxNode.asDouble();
            return (min + max) / 2.0; // average cost between min and max

        } catch (Exception e) {
            throw new FreightCalculationException("Freight API call failed: " + e.getMessage(), e);
        }
    }
}
