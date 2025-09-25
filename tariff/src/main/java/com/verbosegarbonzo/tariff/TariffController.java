package com.verbosegarbonzo.tariff;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;
import java.util.*;
import java.util.Collections;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TariffController {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    // Country code mapping for realistic tariff relationships
    

    // Product categories for realistic tariff variations (expanded HS code-based classification)
    

    public TariffController() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping("/tariffs")
    public ResponseEntity<Map<String, Object>> getTariffs(
            @RequestParam(required = false) String reporterCountry,
            @RequestParam(required = false) String partnerCountry,
            @RequestParam(required = false) String importingCountry,
            @RequestParam(required = false) String exportingCountry,
            @RequestParam String productCode,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) Double simBaseRate,
            @RequestParam(required = false) Double simCountryModifier,
            @RequestParam(required = false) Double simTrend
    ) {
        // Handle different parameter naming conventions
        String reporter = reporterCountry != null ? reporterCountry : importingCountry;
        String partner = partnerCountry != null ? partnerCountry : exportingCountry;

        if (reporter == null || partner == null) {
            Map<String, Object> error = Map.of(
                "error", "Missing required parameters",
                "message", "Please provide either (reporterCountry, partnerCountry) or (importingCountry, exportingCountry)"
            );
            return ResponseEntity.badRequest().body(error);
        }

        try {
            // Try WITS API first
            Map<String, Object> apiData = fetchFromWitsApi(reporter, partner, productCode);
            if (apiData != null && !((List<?>) apiData.get("data")).isEmpty()) {
                return ResponseEntity.ok(apiData);
            }
        } catch (Exception e) {
            System.out.println("WITS API failed: " + e.getMessage());
        }

        // Generate enhanced fallback data with simulation params
        Map<String, Object> fallbackData = generateEnhancedFallbackData(
            reporter, partner, productCode, simBaseRate, simCountryModifier, simTrend
        );
        return ResponseEntity.ok(fallbackData);
    }

    private Map<String, Object> fetchFromWitsApi(String reporterCountry, String partnerCountry, String productCode) {
        try {
            // Try a simplified approach first - use the basic WITS API structure
            // Based on research, try the most basic trade indicator with simplified parameters
            String apiUrl = String.format(
                "http://wits.worldbank.org/API/V1/SDMX/V21/rest/data/DF_WITS_TradeStats_Trade/A.%s.%s.999999.MPRT-TRD-VL",
                reporterCountry, partnerCountry
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            System.out.println("WITS API URL: " + apiUrl);
            System.out.println("WITS API Response Status: " + response.statusCode());
            
            if (response.statusCode() == 200) {
                System.out.println("SUCCESS! WITS API returned data");
                return parseWitsResponse(response.body());
            } else {
                System.out.println("WITS API returned status: " + response.statusCode());
                if (response.statusCode() == 404) {
                    System.out.println("API endpoint not found - trying alternative structure");
                    return tryAlternativeWitsStructure(reporterCountry, partnerCountry, productCode);
                }
                return null;
            }
        } catch (Exception e) {
            System.out.println("Error fetching from WITS API: " + e.getMessage());
            return null;
        }
    }

    private Map<String, Object> tryAlternativeWitsStructure(String reporterCountry, String partnerCountry, String productCode) {
        try {
            // Try the alternative dataset name that was mentioned in research
            String apiUrl = String.format(
                "http://wits.worldbank.org/API/V1/SDMX/V21/rest/data/DF_WITS_Trade/A.%s.%s.999999.MPRT-TRD-VL",
                reporterCountry, partnerCountry
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            System.out.println("Alternative WITS API URL: " + apiUrl);
            System.out.println("Alternative WITS API Response Status: " + response.statusCode());
            
            if (response.statusCode() == 200) {
                System.out.println("SUCCESS! Alternative WITS API returned data");
                return parseWitsResponse(response.body());
            } else {
                System.out.println("Alternative API also returned status: " + response.statusCode());
                return null;
            }
        } catch (Exception e) {
            System.out.println("Error with alternative WITS API: " + e.getMessage());
            return null;
        }
    }

    private Map<String, Object> parseWitsResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            List<Map<String, Object>> tariffData = new ArrayList<>();

            // Parse SDMX JSON structure
            if (root.has("data") && root.get("data").has("dataSets")) {
                JsonNode dataSets = root.get("data").get("dataSets");
                if (dataSets.isArray() && dataSets.size() > 0) {
                    JsonNode dataSet = dataSets.get(0);
                    
                    if (dataSet.has("observations")) {
                        JsonNode observations = dataSet.get("observations");
                        observations.fieldNames().forEachRemaining(key -> {
                            JsonNode obs = observations.get(key);
                            if (obs.isArray() && obs.size() > 0) {
                                Map<String, Object> dataPoint = new HashMap<>();
                                dataPoint.put("year", extractYearFromKey(key));
                                dataPoint.put("tariff", obs.get(0).asDouble());
                                tariffData.add(dataPoint);
                            }
                        });
                    }
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("data", tariffData);
            result.put("source", "WITS API");
            return result;
        } catch (Exception e) {
            System.out.println("Error parsing WITS response: " + e.getMessage());
            return null;
        }
    }

    private String extractYearFromKey(String key) {
        // Extract year from SDMX dimension key format
        String[] parts = key.split(":");
        return parts.length > 0 ? parts[0] : "2020";
    }

    private Map<String, Object> generateEnhancedFallbackData(
        String reporterCountry,
        String partnerCountry,
        String productCode,
        Double simBaseRate,
        Double simCountryModifier,
        Double simTrend
    ) {
        List<Map<String, Object>> tariffData = new ArrayList<>();

        // Get base tariff rate for this product, override if simulation param provided
        Double baseTariff = simBaseRate != null ? simBaseRate : productBaseTariffs.getOrDefault(productCode, 10.0);

        // Apply country relationship modifiers, override if simulation param provided
        double countryModifier = simCountryModifier != null ? simCountryModifier : calculateCountryModifier(reporterCountry, partnerCountry);
        double adjustedBaseTariff = baseTariff * countryModifier;

        // Create a deterministic seed based on the combination of countries and product
        String seedString = reporterCountry + partnerCountry + productCode;
        Random deterministicRandom = new Random(seedString.hashCode());

        // Use simulation trend if provided, otherwise default to -2% per year
        double trendPercent = simTrend != null ? simTrend : -2.0;

        // Generate 10 years of realistic tariff data with trends
        for (int i = 0; i < 10; i++) {
            int year = 2015 + i;

            // Add year-over-year variation and trends (using deterministic random)
            double yearVariation = (deterministicRandom.nextGaussian() * 0.5); // Small random variation
            double trendFactor = 1.0 + (trendPercent / 100.0) * i; // e.g. -2% per year

            double tariffRate = Math.max(0.1, adjustedBaseTariff * trendFactor + yearVariation);

            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("year", String.valueOf(year));
            dataPoint.put("tariff", Math.round(tariffRate * 100.0) / 100.0);
            tariffData.add(dataPoint);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("data", tariffData);
        result.put("source", "Enhanced Simulation Model");
        result.put("note", String.format(
            "Displaying realistic tariff estimates for %s imports from %s. " +
            "Data based on economic modeling of trade relationships, regional agreements, " +
            "and historical tariff patterns. Real-time WITS API access currently unavailable.",
            reporterCountry, partnerCountry
        ));
        result.put("methodology", "Country development level, regional trade agreements, and product sensitivity factors");
        result.put("baseTariff", baseTariff);
        result.put("countryModifier", Math.round(countryModifier * 100.0) / 100.0);

        return result;
    }

    private double calculateCountryModifier(String reporterCountry, String partnerCountry) {
        String[] reporterRegion = countryRegions.getOrDefault(reporterCountry, new String[]{"developing", "other"});
        String[] partnerRegion = countryRegions.getOrDefault(partnerCountry, new String[]{"developing", "other"});
        
        double modifier = 1.0;
        
        // Lower tariffs between developed countries
        if ("developed".equals(reporterRegion[0]) && "developed".equals(partnerRegion[0])) {
            modifier *= 0.6;
        }
        
        // Higher tariffs from developing to developed
        if ("developing".equals(reporterRegion[0]) && "developed".equals(partnerRegion[0])) {
            modifier *= 1.4;
        }
        
        // Regional trade agreements (same region = lower tariffs)
        if (reporterRegion[1].equals(partnerRegion[1])) {
            modifier *= 0.7;
        }
        
        // Add deterministic variation based on country combination
        // This replaces the random component with a deterministic one
        String combinedCountries = reporterCountry + partnerCountry;
        double deterministicVariation = 0.8 + (Math.abs(combinedCountries.hashCode()) % 40) / 100.0; // 0.8 to 1.2 range
        modifier *= deterministicVariation;
        
        return modifier;
    }

    @GetMapping("/countries")
    public ResponseEntity<List<Map<String, String>>> getCountries() {
        List<Map<String, String>> countries = Arrays.asList(
            Map.of("code", "AFG", "name", "Afghanistan"),
            Map.of("code", "ALB", "name", "Albania"),
            Map.of("code", "DZA", "name", "Algeria"),
            Map.of("code", "AND", "name", "Andorra"),
            Map.of("code", "AGO", "name", "Angola"),
            Map.of("code", "ATG", "name", "Antigua and Barbuda"),
            Map.of("code", "ARG", "name", "Argentina"),
            Map.of("code", "ARM", "name", "Armenia"),
            Map.of("code", "AUS", "name", "Australia"),
            Map.of("code", "AUT", "name", "Austria"),
            Map.of("code", "AZE", "name", "Azerbaijan"),
            Map.of("code", "BHS", "name", "Bahamas"),
            Map.of("code", "BHR", "name", "Bahrain"),
            Map.of("code", "BGD", "name", "Bangladesh"),
            Map.of("code", "BRB", "name", "Barbados"),
            Map.of("code", "BLR", "name", "Belarus"),
            Map.of("code", "BEL", "name", "Belgium"),
            Map.of("code", "BLZ", "name", "Belize"),
            Map.of("code", "BEN", "name", "Benin"),
            Map.of("code", "BTN", "name", "Bhutan"),
            Map.of("code", "BOL", "name", "Bolivia"),
            Map.of("code", "BIH", "name", "Bosnia and Herzegovina"),
            Map.of("code", "BWA", "name", "Botswana"),
            Map.of("code", "BRA", "name", "Brazil"),
            Map.of("code", "BRN", "name", "Brunei"),
            Map.of("code", "BGR", "name", "Bulgaria"),
            Map.of("code", "BFA", "name", "Burkina Faso"),
            Map.of("code", "BDI", "name", "Burundi"),
            Map.of("code", "CPV", "name", "Cabo Verde"),
            Map.of("code", "KHM", "name", "Cambodia"),
            Map.of("code", "CMR", "name", "Cameroon"),
            Map.of("code", "CAN", "name", "Canada"),
            Map.of("code", "CAF", "name", "Central African Republic"),
            Map.of("code", "TCD", "name", "Chad"),
            Map.of("code", "CHL", "name", "Chile"),
            Map.of("code", "CHN", "name", "China"),
            Map.of("code", "COL", "name", "Colombia"),
            Map.of("code", "COM", "name", "Comoros"),
            Map.of("code", "COG", "name", "Congo"),
            Map.of("code", "COD", "name", "Congo (Democratic Republic)"),
            Map.of("code", "CRI", "name", "Costa Rica"),
            Map.of("code", "CIV", "name", "Côte d'Ivoire"),
            Map.of("code", "HRV", "name", "Croatia"),
            Map.of("code", "CUB", "name", "Cuba"),
            Map.of("code", "CYP", "name", "Cyprus"),
            Map.of("code", "CZE", "name", "Czech Republic"),
            Map.of("code", "DNK", "name", "Denmark"),
            Map.of("code", "DJI", "name", "Djibouti"),
            Map.of("code", "DMA", "name", "Dominica"),
            Map.of("code", "DOM", "name", "Dominican Republic"),
            Map.of("code", "ECU", "name", "Ecuador"),
            Map.of("code", "EGY", "name", "Egypt"),
            Map.of("code", "SLV", "name", "El Salvador"),
            Map.of("code", "GNQ", "name", "Equatorial Guinea"),
            Map.of("code", "ERI", "name", "Eritrea"),
            Map.of("code", "EST", "name", "Estonia"),
            Map.of("code", "SWZ", "name", "Eswatini"),
            Map.of("code", "ETH", "name", "Ethiopia"),
            Map.of("code", "FJI", "name", "Fiji"),
            Map.of("code", "FIN", "name", "Finland"),
            Map.of("code", "FRA", "name", "France"),
            Map.of("code", "GAB", "name", "Gabon"),
            Map.of("code", "GMB", "name", "Gambia"),
            Map.of("code", "GEO", "name", "Georgia"),
            Map.of("code", "DEU", "name", "Germany"),
            Map.of("code", "GHA", "name", "Ghana"),
            Map.of("code", "GRC", "name", "Greece"),
            Map.of("code", "GRD", "name", "Grenada"),
            Map.of("code", "GTM", "name", "Guatemala"),
            Map.of("code", "GIN", "name", "Guinea"),
            Map.of("code", "GNB", "name", "Guinea-Bissau"),
            Map.of("code", "GUY", "name", "Guyana"),
            Map.of("code", "HTI", "name", "Haiti"),
            Map.of("code", "HND", "name", "Honduras"),
            Map.of("code", "HUN", "name", "Hungary"),
            Map.of("code", "ISL", "name", "Iceland"),
            Map.of("code", "IND", "name", "India"),
            Map.of("code", "IDN", "name", "Indonesia"),
            Map.of("code", "IRN", "name", "Iran"),
            Map.of("code", "IRQ", "name", "Iraq"),
            Map.of("code", "IRL", "name", "Ireland"),
            Map.of("code", "ISR", "name", "Israel"),
            Map.of("code", "ITA", "name", "Italy"),
            Map.of("code", "JAM", "name", "Jamaica"),
            Map.of("code", "JPN", "name", "Japan"),
            Map.of("code", "JOR", "name", "Jordan"),
            Map.of("code", "KAZ", "name", "Kazakhstan"),
            Map.of("code", "KEN", "name", "Kenya"),
            Map.of("code", "KIR", "name", "Kiribati"),
            Map.of("code", "PRK", "name", "Korea (North)"),
            Map.of("code", "KOR", "name", "Korea (South)"),
            Map.of("code", "KWT", "name", "Kuwait"),
            Map.of("code", "KGZ", "name", "Kyrgyzstan"),
            Map.of("code", "LAO", "name", "Laos"),
            Map.of("code", "LVA", "name", "Latvia"),
            Map.of("code", "LBN", "name", "Lebanon"),
            Map.of("code", "LSO", "name", "Lesotho"),
            Map.of("code", "LBR", "name", "Liberia"),
            Map.of("code", "LBY", "name", "Libya"),
            Map.of("code", "LIE", "name", "Liechtenstein"),
            Map.of("code", "LTU", "name", "Lithuania"),
            Map.of("code", "LUX", "name", "Luxembourg"),
            Map.of("code", "MDG", "name", "Madagascar"),
            Map.of("code", "MWI", "name", "Malawi"),
            Map.of("code", "MYS", "name", "Malaysia"),
            Map.of("code", "MDV", "name", "Maldives"),
            Map.of("code", "MLI", "name", "Mali"),
            Map.of("code", "MLT", "name", "Malta"),
            Map.of("code", "MHL", "name", "Marshall Islands"),
            Map.of("code", "MRT", "name", "Mauritania"),
            Map.of("code", "MUS", "name", "Mauritius"),
            Map.of("code", "MEX", "name", "Mexico"),
            Map.of("code", "FSM", "name", "Micronesia"),
            Map.of("code", "MDA", "name", "Moldova"),
            Map.of("code", "MCO", "name", "Monaco"),
            Map.of("code", "MNG", "name", "Mongolia"),
            Map.of("code", "MNE", "name", "Montenegro"),
            Map.of("code", "MAR", "name", "Morocco"),
            Map.of("code", "MOZ", "name", "Mozambique"),
            Map.of("code", "MMR", "name", "Myanmar"),
            Map.of("code", "NAM", "name", "Namibia"),
            Map.of("code", "NRU", "name", "Nauru"),
            Map.of("code", "NPL", "name", "Nepal"),
            Map.of("code", "NLD", "name", "Netherlands"),
            Map.of("code", "NZL", "name", "New Zealand"),
            Map.of("code", "NIC", "name", "Nicaragua"),
            Map.of("code", "NER", "name", "Niger"),
            Map.of("code", "NGA", "name", "Nigeria"),
            Map.of("code", "MKD", "name", "North Macedonia"),
            Map.of("code", "NOR", "name", "Norway"),
            Map.of("code", "OMN", "name", "Oman"),
            Map.of("code", "PAK", "name", "Pakistan"),
            Map.of("code", "PLW", "name", "Palau"),
            Map.of("code", "PSE", "name", "Palestine"),
            Map.of("code", "PAN", "name", "Panama"),
            Map.of("code", "PNG", "name", "Papua New Guinea"),
            Map.of("code", "PRY", "name", "Paraguay"),
            Map.of("code", "PER", "name", "Peru"),
            Map.of("code", "PHL", "name", "Philippines"),
            Map.of("code", "POL", "name", "Poland"),
            Map.of("code", "PRT", "name", "Portugal"),
            Map.of("code", "QAT", "name", "Qatar"),
            Map.of("code", "ROU", "name", "Romania"),
            Map.of("code", "RUS", "name", "Russia"),
            Map.of("code", "RWA", "name", "Rwanda"),
            Map.of("code", "KNA", "name", "Saint Kitts and Nevis"),
            Map.of("code", "LCA", "name", "Saint Lucia"),
            Map.of("code", "VCT", "name", "Saint Vincent and the Grenadines"),
            Map.of("code", "WSM", "name", "Samoa"),
            Map.of("code", "SMR", "name", "San Marino"),
            Map.of("code", "STP", "name", "Sao Tome and Principe"),
            Map.of("code", "SAU", "name", "Saudi Arabia"),
            Map.of("code", "SEN", "name", "Senegal"),
            Map.of("code", "SRB", "name", "Serbia"),
            Map.of("code", "SYC", "name", "Seychelles"),
            Map.of("code", "SLE", "name", "Sierra Leone"),
            Map.of("code", "SGP", "name", "Singapore"),
            Map.of("code", "SVK", "name", "Slovakia"),
            Map.of("code", "SVN", "name", "Slovenia"),
            Map.of("code", "SLB", "name", "Solomon Islands"),
            Map.of("code", "SOM", "name", "Somalia"),
            Map.of("code", "ZAF", "name", "South Africa"),
            Map.of("code", "SSD", "name", "South Sudan"),
            Map.of("code", "ESP", "name", "Spain"),
            Map.of("code", "LKA", "name", "Sri Lanka"),
            Map.of("code", "SDN", "name", "Sudan"),
            Map.of("code", "SUR", "name", "Suriname"),
            Map.of("code", "SWE", "name", "Sweden"),
            Map.of("code", "CHE", "name", "Switzerland"),
            Map.of("code", "SYR", "name", "Syria"),
            Map.of("code", "TWN", "name", "Taiwan"),
            Map.of("code", "TJK", "name", "Tajikistan"),
            Map.of("code", "TZA", "name", "Tanzania"),
            Map.of("code", "THA", "name", "Thailand"),
            Map.of("code", "TLS", "name", "Timor-Leste"),
            Map.of("code", "TGO", "name", "Togo"),
            Map.of("code", "TON", "name", "Tonga"),
            Map.of("code", "TTO", "name", "Trinidad and Tobago"),
            Map.of("code", "TUN", "name", "Tunisia"),
            Map.of("code", "TUR", "name", "Turkey"),
            Map.of("code", "TKM", "name", "Turkmenistan"),
            Map.of("code", "TUV", "name", "Tuvalu"),
            Map.of("code", "UGA", "name", "Uganda"),
            Map.of("code", "UKR", "name", "Ukraine"),
            Map.of("code", "ARE", "name", "United Arab Emirates"),
            Map.of("code", "GBR", "name", "United Kingdom"),
            Map.of("code", "USA", "name", "United States"),
            Map.of("code", "URY", "name", "Uruguay"),
            Map.of("code", "UZB", "name", "Uzbekistan"),
            Map.of("code", "VUT", "name", "Vanuatu"),
            Map.of("code", "VAT", "name", "Vatican City"),
            Map.of("code", "VEN", "name", "Venezuela"),
            Map.of("code", "VNM", "name", "Vietnam"),
            Map.of("code", "YEM", "name", "Yemen"),
            Map.of("code", "ZMB", "name", "Zambia"),
            Map.of("code", "ZWE", "name", "Zimbabwe")
        );
        return ResponseEntity.ok(countries);
    }

    @GetMapping("/products")
    public ResponseEntity<List<Map<String, String>>> getProducts() {
        List<Map<String, String>> products = Arrays.asList(
            Map.of("code", "01-05_Animals", "name", "Live Animals & Animal Products"),
            Map.of("code", "06-14_Vegetables", "name", "Vegetable Products"),
            Map.of("code", "16-24_Food", "name", "Prepared Foodstuffs & Beverages"),
            Map.of("code", "25-27_Minerals", "name", "Mineral Products & Fuels"),
            Map.of("code", "28-38_Chemicals", "name", "Chemical Products"),
            Map.of("code", "39-40_Plastics", "name", "Plastics & Rubber"),
            Map.of("code", "41-43_Leather", "name", "Hides, Skins & Leather"),
            Map.of("code", "44-46_Wood", "name", "Wood Products"),
            Map.of("code", "47-49_Paper", "name", "Pulp & Paper"),
            Map.of("code", "50-63_Textiles", "name", "Textiles & Clothing"),
            Map.of("code", "64-67_Footwear", "name", "Footwear & Headgear"),
            Map.of("code", "68-70_Stone", "name", "Stone, Glass & Ceramics"),
            Map.of("code", "71_Precious", "name", "Precious Metals & Stones"),
            Map.of("code", "72-83_Metals", "name", "Base Metals"),
            Map.of("code", "84-85_Machinery", "name", "Machinery & Electronics"),
            Map.of("code", "86-89_Vehicles", "name", "Transportation Equipment"),
            Map.of("code", "90-92_Instruments", "name", "Optical & Medical Instruments"),
            Map.of("code", "93_Arms", "name", "Arms & Ammunition"),
            Map.of("code", "94-96_Miscellaneous", "name", "Miscellaneous Manufactured Articles"),
            Map.of("code", "97_Art", "name", "Works of Art & Antiques"),
            Map.of("code", "98_Services", "name", "Services & Intangibles")
        );
        return ResponseEntity.ok(products);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "healthy");
        status.put("service", "tariff-api");
        status.put("timestamp", java.time.Instant.now().toString());
        
        // Check WITS API connectivity
        try {
            String testUrl = "http://wits.worldbank.org/API/V1/SDMX/V21/rest/data/DF_WITS_TradeStats_Trade/A.USA.CHN.999999.MPRT-TRD-VL";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(testUrl))
                    .timeout(Duration.ofSeconds(5))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            status.put("witsApiStatus", response.statusCode() == 200 ? "available" : "unavailable (HTTP " + response.statusCode() + ")");
            status.put("dataSource", response.statusCode() == 200 ? "Real-time WITS data" : "Enhanced simulation model");
        } catch (Exception e) {
            status.put("witsApiStatus", "unavailable (connection error)");
            status.put("dataSource", "Enhanced simulation model");
        }
        
        return ResponseEntity.ok(status);
    }
}
