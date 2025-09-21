package com.verbosegarbonzo.tariff;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.net.http.*;
import java.net.URI;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@CrossOrigin(origins = "*")
public class TariffController {

    @GetMapping("/api/tariffs")
    public List<Map<String, Object>> getTariffs(
            @RequestParam(defaultValue = "NY.GDP.MKTP.CD") String sector) {
        try {
            System.out.println("Requested sector: " + sector);

            // Build the World Bank API URL for United States only
            var client = HttpClient.newHttpClient();
            String witsUrl = String.format(
                    "https://api.worldbank.org/v2/en/country/USA/indicator/%s?format=json&date=2010:2022", sector);
            System.out.println("World Bank API URL: " + witsUrl);

            // Send the request
            var request = HttpRequest.newBuilder()
                    .uri(URI.create(witsUrl))
                    .build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("HTTP Status Code: " + response.statusCode());

            // Parse the JSON response
            ObjectMapper mapper = new ObjectMapper();
            List<?> arr = mapper.readValue(response.body(), List.class);

            if (arr.size() > 1) {
                List<?> dataArr = (List<?>) arr.get(1);
                List<Map<String, Object>> result = new ArrayList<>();
                
                for (Object item : dataArr) {
                    if (item instanceof Map) {
                        Map<?, ?> data = (Map<?, ?>) item;
                        String year = (String) data.get("date");
                        Object value = data.get("value");
                        
                        if (year != null && value != null) {
                            try {
                                double numericValue = Double.parseDouble(value.toString());
                                result.add(Map.of(
                                    "year", year,
                                    "value", numericValue
                                ));
                            } catch (NumberFormatException e) {
                                System.out.println("Skipping non-numeric value for year " + year + ": " + value);
                            }
                        }
                    }
                }
                
                // Sort by year
                result.sort((a, b) -> {
                    String yearA = (String) a.get("year");
                    String yearB = (String) b.get("year");
                    return yearA.compareTo(yearB);
                });
                
                System.out.println("Successfully processed " + result.size() + " years of data");
                return result;
            }

            System.out.println("No data found in response, using fallback");
            return getFallbackData();

        } catch (Exception e) {
            System.out.println("Error fetching World Bank data: " + e.getMessage());
            e.printStackTrace();
            return getFallbackData();
        }
    }

    // Fallback data
    private List<Map<String, Object>> getFallbackData() {
        return List.of(
            Map.of("year", "2018", "value", 100.0),
            Map.of("year", "2019", "value", 120.0),
            Map.of("year", "2020", "value", 90.0),
            Map.of("year", "2021", "value", 150.0),
            Map.of("year", "2022", "value", 160.0)
        );
    }
}