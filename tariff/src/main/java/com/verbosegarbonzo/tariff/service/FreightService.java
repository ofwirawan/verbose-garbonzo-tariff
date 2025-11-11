package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.exception.FreightCalculationException;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
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
     * Holds freight cost details including min, average, max and transit time.
     * Implements Serializable to support caching in Redis and distributed caches.
     */
    public static class FreightDetails implements java.io.Serializable {
        private static final long serialVersionUID = 1L;

        public Double costMin;
        public Double costAverage;
        public Double costMax;
        public Integer transitDays;

        public FreightDetails(Double costMin, Double costAverage, Double costMax, Integer transitDays) {
            this.costMin = costMin;
            this.costAverage = costAverage;
            this.costMax = costMax;
            this.transitDays = transitDays;
        }

        public Double getCostMin() { return costMin; }
        public Double getCostAverage() { return costAverage; }
        public Double getCostMax() { return costMax; }
        public Integer getTransitDays() { return transitDays; }
    }

    /**
     * Extracts transit days from the API response based on freight mode
     */
    private Integer extractTransitDays(JsonNode modeNode, String mode) {
        if (modeNode == null || modeNode.isMissingNode()) {
            return null;
        }

        // Common transit day values by mode
        Integer defaultTransitDays = null;
        if ("air".equalsIgnoreCase(mode)) {
            defaultTransitDays = 5; // Average air freight transit time
        } else if ("ocean".equalsIgnoreCase(mode)) {
            defaultTransitDays = 30; // Average ocean freight transit time
        } else if ("express".equalsIgnoreCase(mode)) {
            defaultTransitDays = 2; // Express delivery transit time
        }

        // Try to extract from API response if available
        JsonNode transitNode = modeNode.path("transitTime");
        if (transitNode != null && !transitNode.isMissingNode()) {
            int apiTransitDays = transitNode.asInt(0);
            if (apiTransitDays > 0) {
                return apiTransitDays;
            }
        }

        return defaultTransitDays;
    }

    /**
     * Calculates freight cost using Freightos GET API (JSON mode).
     * Returns freight details including min, average, max costs and transit days.
     * Uses city names stored in the Country entity.
     *
     * Results are cached by freight mode, country codes, and weight to avoid
     * redundant API calls for identical routes.
     */
    @Cacheable(value = "freightData", key = "#mode + '-' + #importerCode + '-' + #exporterCode + '-' + #weight")
    public FreightDetails calculateFreight(String mode, String importerCode, String exporterCode, double weight) {
        Country importer = countryRepository.findById(importerCode)
                .orElseThrow(() -> new IllegalArgumentException("Importer not found: " + importerCode));
        Country exporter = countryRepository.findById(exporterCode)
                .orElseThrow(() -> new IllegalArgumentException("Exporter not found: " + exporterCode));

        if (importer.getCity() == null || exporter.getCity() == null) {
            throw new IllegalStateException("City missing for importer or exporter in database");
        }

        String origin = exporter.getCity();      // already formatted as "City,Country"
        String destination = importer.getCity(); // already formatted as "City,Country"

        try {
            // Build query URL
            String url = UriComponentsBuilder.fromUriString(freightApiUrl)
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
            double average = (min + max) / 2.0;
            Integer transitDays = extractTransitDays(modeNode, mode);

            return new FreightDetails(min, average, max, transitDays);

        } catch (Exception e) {
            throw new FreightCalculationException("Freight API call failed: " + e.getMessage(), e);
        }
    }
}
