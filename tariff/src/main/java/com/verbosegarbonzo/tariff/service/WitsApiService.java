package com.verbosegarbonzo.tariff.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Map;
import java.util.Random;

@Service
@Slf4j
public class WitsApiService {

    private final WebClient webClient;
    private final String baseUrl;
    private final int timeoutMs;
    private final Random random = new Random();

    public WitsApiService(WebClient.Builder webClientBuilder,
                         @Value("${wits.api.base-url:https://wits.worldbank.org/api/v1}") String baseUrl,
                         @Value("${wits.api.timeout:30000}") int timeoutMs) {
        this.baseUrl = baseUrl;
        this.timeoutMs = timeoutMs;
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .build();
    }

    public Mono<BigDecimal> getTariffRate(String reporterCountry, String partnerCountry, 
                                        String hsCode, Integer year) {
        log.info("Fetching tariff rate for: reporter={}, partner={}, hsCode={}, year={}", 
                reporterCountry, partnerCountry, hsCode, year);

        // For demo purposes, we'll simulate API calls and return mock data
        // In a real implementation, you would make actual HTTP calls to the WITS API
        return simulateTariffApiCall(reporterCountry, partnerCountry, hsCode, year);
    }

    private Mono<BigDecimal> simulateTariffApiCall(String reporterCountry, String partnerCountry, 
                                                 String hsCode, Integer year) {
        // Simulate API call delay
        return Mono.delay(Duration.ofMillis(500 + random.nextInt(1000)))
                .map(delay -> {
                    // Generate realistic tariff rates based on country and product combinations
                    return generateMockTariffRate(reporterCountry, partnerCountry, hsCode);
                })
                .doOnSuccess(rate -> log.info("Retrieved tariff rate: {}% for {}->{} HS:{}", 
                        rate, partnerCountry, reporterCountry, hsCode))
                .doOnError(error -> log.error("Error fetching tariff rate", error));
    }

    private BigDecimal generateMockTariffRate(String reporterCountry, String partnerCountry, String hsCode) {
        // Generate realistic tariff rates based on various factors
        double baseRate = 5.0; // Base tariff rate
        
        // Adjust based on country pairs (simplified trade relationships)
        Map<String, Double> countryAdjustments = Map.of(
            "USA", 1.2,
            "CHN", 1.5,
            "DEU", 0.8,
            "JPN", 0.9,
            "GBR", 0.7,
            "FRA", 0.8,
            "IND", 1.3,
            "BRA", 1.1,
            "CAN", 0.6,
            "AUS", 0.9
        );
        
        double countryMultiplier = countryAdjustments.getOrDefault(reporterCountry, 1.0);
        
        // Adjust based on product category (HS code prefix)
        String hsPrefix = hsCode.substring(0, Math.min(2, hsCode.length()));
        Map<String, Double> productAdjustments = Map.of(
            "01", 0.5,  // Live animals
            "02", 0.7,  // Meat
            "84", 1.5,  // Machinery
            "85", 1.4,  // Electrical equipment
            "87", 2.0,  // Vehicles
            "64", 1.8,  // Footwear
            "62", 1.6,  // Clothing
            "27", 0.3   // Fuels
        );
        
        double productMultiplier = productAdjustments.getOrDefault(hsPrefix, 1.0);
        
        // Add some randomness
        double randomFactor = 0.8 + random.nextDouble() * 0.4; // 0.8 to 1.2
        
        double finalRate = baseRate * countryMultiplier * productMultiplier * randomFactor;
        
        // Ensure reasonable bounds (0.1% to 50%)
        finalRate = Math.max(0.1, Math.min(50.0, finalRate));
        
        return BigDecimal.valueOf(finalRate).setScale(4, RoundingMode.HALF_UP);
    }

    public Mono<String> getProductDescription(String hsCode) {
        log.info("Fetching product description for HS code: {}", hsCode);
        
        // Simulate product description lookup
        return Mono.delay(Duration.ofMillis(200 + random.nextInt(300)))
                .map(delay -> generateMockProductDescription(hsCode));
    }

    private String generateMockProductDescription(String hsCode) {
        if (hsCode.length() < 2) {
            return "Unknown Product";
        }
        
        String prefix = hsCode.substring(0, 2);
        Map<String, String> productDescriptions = Map.of(
            "01", "Live animals",
            "02", "Meat and edible meat offal",
            "03", "Fish and crustaceans",
            "04", "Dairy produce; birds' eggs; honey",
            "05", "Products of animal origin",
            "84", "Nuclear reactors, machinery",
            "85", "Electrical machinery and equipment",
            "87", "Vehicles other than railway",
            "64", "Footwear, gaiters and the like",
            "62", "Articles of apparel and clothing"
        );
        
        // Additional descriptions for other common HS codes
        if ("27".equals(prefix)) {
            return "Mineral fuels, mineral oils";
        }
        
        return productDescriptions.getOrDefault(prefix, "Product category HS" + prefix);
    }

    public Mono<BigDecimal> getGeneralTariffRate(String reporterCountry, String partnerCountry, 
                                               Integer year) {
        log.info("Fetching general tariff rate for: reporter={}, partner={}, year={}", 
                reporterCountry, partnerCountry, year);

        // For demo purposes, we'll simulate API calls and return mock data
        // This provides a general tariff rate based on country pairs without requiring HS codes
        return simulateGeneralTariffApiCall(reporterCountry, partnerCountry, year);
    }

    private Mono<BigDecimal> simulateGeneralTariffApiCall(String reporterCountry, String partnerCountry, 
                                                        Integer year) {
        // Simulate API call delay
        return Mono.delay(Duration.ofMillis(300 + random.nextInt(700)))
                .map(delay -> {
                    // Generate realistic general tariff rates based on country pairs
                    return generateGeneralTariffRate(reporterCountry, partnerCountry);
                })
                .doOnError(error -> log.error("Error simulating general tariff API call", error))
                .onErrorReturn(BigDecimal.valueOf(5.0)); // Default 5% tariff on error
    }

    private BigDecimal generateGeneralTariffRate(String reporterCountry, String partnerCountry) {
        // Generate general tariff rates based on common trade relationships
        // This is simplified logic for demo purposes
        
        // Trade within regions typically has lower tariffs
        if (areInSameRegion(reporterCountry, partnerCountry)) {
            // Within region: 0-5% tariff
            return BigDecimal.valueOf(random.nextDouble() * 5.0);
        }
        
        // Developed to developing country preferences
        if (isDevelopedCountry(reporterCountry) && !isDevelopedCountry(partnerCountry)) {
            // GSP preferences: 0-8% tariff
            return BigDecimal.valueOf(random.nextDouble() * 8.0);
        }
        
        // Standard MFN rates: 2-15% tariff
        return BigDecimal.valueOf(2.0 + random.nextDouble() * 13.0);
    }

    private boolean areInSameRegion(String country1, String country2) {
        // Simple regional groupings for demo
        String[] nafta = {"USA", "CAN", "MEX"};
        String[] eu = {"DEU", "FRA", "ITA", "ESP", "NLD", "BEL", "POL", "ROU", "GRC", "PRT", "CZE", "HUN"};
        String[] asean = {"THA", "SGP", "MYS", "IDN", "PHL", "VNM"};
        String[] mercosur = {"BRA", "ARG", "URY", "PRY"};
        
        return isInGroup(country1, country2, nafta) || 
               isInGroup(country1, country2, eu) ||
               isInGroup(country1, country2, asean) ||
               isInGroup(country1, country2, mercosur);
    }

    private boolean isInGroup(String country1, String country2, String[] group) {
        boolean country1InGroup = false;
        boolean country2InGroup = false;
        
        for (String country : group) {
            if (country.equals(country1)) country1InGroup = true;
            if (country.equals(country2)) country2InGroup = true;
        }
        
        return country1InGroup && country2InGroup;
    }

    private boolean isDevelopedCountry(String countryCode) {
        // Simple classification for demo purposes
        String[] developed = {"USA", "CAN", "DEU", "FRA", "GBR", "ITA", "JPN", "AUS", "NZL", 
                             "NOR", "SWE", "DNK", "NLD", "BEL", "CHE", "AUT", "KOR", "SGP"};
        
        for (String country : developed) {
            if (country.equals(countryCode)) {
                return true;
            }
        }
        return false;
    }
}
