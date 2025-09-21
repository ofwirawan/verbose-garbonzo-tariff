package com.verbosegarbonzo.tariff;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

/**
 * REST controller for exposing tariff data to the frontend.
 */
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*")
public class TariffController {

    @GetMapping("/api/tariffs")
    public List<Map<String, Object>> getTariffs(@org.springframework.web.bind.annotation.RequestParam(defaultValue = "NY.GDP.MKTP.CD") String sector) {
        // Fetch data from WITS API and map to chart format using Jackson
        try {
            System.out.println("Requested sector: " + sector);
            var client = java.net.http.HttpClient.newHttpClient();
            String witsUrl = String.format("https://api.worldbank.org/v2/en/indicator/%s?format=json&date=2010:2022&country=all", sector);
            System.out.println("WITS API URL: " + witsUrl);
            var request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(witsUrl))
                .build();
            var response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            var json = response.body();
            System.out.println("WITS raw response: " + json);

            // Use Jackson ObjectMapper to parse JSON
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();

            // WITS returns a JSON array, second element contains data
            java.util.List<?> arr = mapper.readValue(json, java.util.List.class);
            if (arr.size() > 1) {
                Object secondElem = arr.get(1);
                // Case 1: Map with "data" key (old format)
                if (secondElem instanceof java.util.Map) {
                    java.util.Map<?, ?> dataObj = (java.util.Map<?, ?>) secondElem;
                    Object dataArrObj = dataObj.get("data");
                    if (dataArrObj instanceof java.util.List) {
                        java.util.List<?> dataArr = (java.util.List<?>) dataArrObj;
                        for (Object item : dataArr) {
                            if (item instanceof java.util.Map) {
                                java.util.Map<?, ?> obj = (java.util.Map<?, ?>) item;
                                Object yearObj = obj.get("date");
                                Object valueObj = obj.get("value");
                                int year = yearObj != null ? Integer.parseInt(yearObj.toString()) : 0;
                                double value = valueObj != null ? Double.parseDouble(valueObj.toString()) : 0;
                                result.add(Map.of("year", year, "value", value));
                            }
                        }
                    }
                }
                // Case 2: List of country/year data objects (new format)
                else if (secondElem instanceof java.util.List) {
                    java.util.List<?> dataArr = (java.util.List<?>) secondElem;
                    for (Object item : dataArr) {
                        if (item instanceof java.util.Map) {
                            java.util.Map<?, ?> obj = (java.util.Map<?, ?>) item;
                            Object yearObj = obj.get("date");
                            Object valueObj = obj.get("value");
                            int year = yearObj != null ? Integer.parseInt(yearObj.toString()) : 0;
                            double value = valueObj != null ? Double.parseDouble(valueObj.toString()) : 0;
                            result.add(Map.of("year", year, "value", value));
                        }
                    }
                }
            }
            System.out.println("Parsed chart data: " + result);
            return result;
        } catch (Exception e) {
            System.out.println("Error fetching/parsing WITS data: " + e.getMessage());
            // Fallback to static data if WITS fetch fails
            return List.of(
                Map.of("year", 2018, "value", 100),
                Map.of("year", 2019, "value", 120),
                Map.of("year", 2020, "value", 90),
                Map.of("year", 2021, "value", 150)
            );
        }
    }
}