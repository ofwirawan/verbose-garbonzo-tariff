package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.dto.TariffCalculationRequest;
import com.verbosegarbonzo.tariff.dto.TariffCalculationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class TariffCalculationService {

    private final RestTemplate restTemplate;
    private static final String WITS_BASE_URL = "https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN";

    public TariffCalculationResponse calculateTariff(TariffCalculationRequest request) {
        TariffCalculationResponse response = new TariffCalculationResponse();
        
        try {
            log.info("Starting tariff calculation for: {} -> {}", 
                    request.getExportingCountry(), request.getImportingCountry());

            // Set basic request data in response
            mapRequestToResponse(request, response);

            // Get tariff rate from WITS API
            BigDecimal tariffRate = getTariffRateFromWITS(request);
            String tariffType = determineTariffType(request, tariffRate);
            
            // Calculate tariff cost and total
            BigDecimal tariffCost = calculateTariffCost(request.getTradeValue(), tariffRate);
            BigDecimal totalCost = request.getTradeValue().add(tariffCost);

            // Set calculation results
            response.setTariffRate(tariffRate);
            response.setTariffCost(tariffCost);
            response.setTotalCost(totalCost);
            response.setTariffType(tariffType);
            response.setStatus("SUCCESS");
            response.setMessage("Tariff calculation completed successfully");

        } catch (Exception e) {
            log.error("Error calculating tariff", e);
            handleErrorResponse(request, response, e);
        }

        return response;
    }

    private void mapRequestToResponse(TariffCalculationRequest request, TariffCalculationResponse response) {
        response.setExportingCountry(request.getExportingCountry());
        response.setImportingCountry(request.getImportingCountry());
        response.setProductDescription(request.getProductDescription());
        response.setTradeValue(request.getTradeValue());
        response.setCurrency(request.getCurrency());
        response.setCalculationTimestamp(LocalDateTime.now());
    }

    private BigDecimal getTariffRateFromWITS(TariffCalculationRequest request) {
        try {
            String witsUrl = buildWITSUrl(request);
            log.info("Calling WITS API: {}", witsUrl);

            ResponseEntity<String> apiResponse = restTemplate.getForEntity(witsUrl, String.class);
            
            if (apiResponse.getStatusCode() == HttpStatus.OK && apiResponse.getBody() != null) {
                BigDecimal tariffRate = parseWITSResponse(apiResponse.getBody());
                log.info("Retrieved tariff rate: {}%", tariffRate);
                return tariffRate;
            } else {
                log.warn("WITS API returned status: {}", apiResponse.getStatusCode());
                return getDefaultTariffRate();
            }

        } catch (RestClientException e) {
            log.error("Failed to call WITS API: {}", e.getMessage());
            return getDefaultTariffRate();
        }
    }

    private String buildWITSUrl(TariffCalculationRequest request) {
        // Build URL based on WITS API format
        return String.format("%s/reporter/%s/partner/%s/product/%s/year/%d/datatype/reported?format=JSON",
                WITS_BASE_URL,
                request.getImportingCountry(),
                request.getExportingCountry(), 
                "ALL", // Can be enhanced with specific HS codes
                request.getTradeDate().getYear());
    }

    private BigDecimal parseWITSResponse(String responseBody) {
        // TODO: Implement proper JSON parsing using ObjectMapper
        // For now, return a mock value based on response content
        log.info("Parsing WITS response (simplified implementation)");
        
        if (responseBody.contains("error") || responseBody.isEmpty()) {
            return getDefaultTariffRate();
        }
        
        // Mock parsing - replace with actual JSON parsing
        return new BigDecimal("7.5"); // 7.5% mock rate
    }

    private String determineTariffType(TariffCalculationRequest request, BigDecimal tariffRate) {
        // TODO: Parse WITS response to determine actual tariff type
        // For now, use simple logic based on rate
        if (tariffRate.compareTo(new BigDecimal("10")) < 0) {
            return "PREFERENTIAL";
        } else {
            return "MFN";
        }
    }

    private BigDecimal getDefaultTariffRate() {
        log.info("Using default tariff rate due to API unavailability");
        return new BigDecimal("5.0"); // 5% default rate
    }

    private BigDecimal calculateTariffCost(BigDecimal tradeValue, BigDecimal tariffRate) {
        BigDecimal rateDecimal = tariffRate.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
        return tradeValue.multiply(rateDecimal).setScale(4, RoundingMode.HALF_UP);
    }

    private void handleErrorResponse(TariffCalculationRequest request, TariffCalculationResponse response, Exception e) {
        response.setStatus("ERROR");
        response.setMessage("Failed to calculate tariff: " + e.getMessage());
        response.setTariffRate(BigDecimal.ZERO);
        response.setTariffCost(BigDecimal.ZERO);
        response.setTotalCost(request.getTradeValue());
        response.setCalculationTimestamp(LocalDateTime.now());
    }
}

