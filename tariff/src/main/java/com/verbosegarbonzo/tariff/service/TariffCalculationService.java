package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.dto.TariffCalculationRequest;
import com.verbosegarbonzo.tariff.dto.TariffCalculationResponse;
import com.verbosegarbonzo.tariff.dto.TariffData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

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
            String hsCode = request.getProductDescription();  // productDescription holds HS code
            log.info("Starting tariff calculation for: {} -> {} with HS code: {}",
                    request.getExportingCountry(), request.getImportingCountry(), hsCode);

            mapRequestToResponse(request, response);

            TariffData tariffData = getTariffDataFromWITS(request, hsCode);

            response.setTariffRate(tariffData.getRate());
            response.setTariffType(tariffData.getTariffType());

            BigDecimal tariffCost = calculateTariffCost(request.getTradeValue(), tariffData.getRate());
            BigDecimal totalCost = request.getTradeValue().add(tariffCost);

            response.setTariffCost(tariffCost);
            response.setTotalCost(totalCost);
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

    private TariffData getTariffDataFromWITS(TariffCalculationRequest request, String hsCode) {
        try {
            String witsUrl = buildWITSUrl(request, hsCode);
            log.info("Calling WITS API: {}", witsUrl);

            ResponseEntity<String> apiResponse = restTemplate.getForEntity(witsUrl, String.class);

            if (apiResponse.getStatusCode() == HttpStatus.OK && apiResponse.getBody() != null) {
                return parseWITSResponse(apiResponse.getBody());
            } else if (apiResponse.getStatusCode() == HttpStatus.NOT_FOUND) {
                if (!"000".equals(request.getExportingCountry())) {
                    log.warn("WITS API returned 404, retrying with exporting country '000'");
                    TariffCalculationRequest retryRequest = cloneWithExportingCountry(request, "000");
                    return getTariffDataFromWITS(retryRequest, hsCode);
                }
                log.warn("WITS API returned 404 even with exporting country '000'");
                return new TariffData(getDefaultTariffRate(), "UNKNOWN");
            } else {
                return new TariffData(getDefaultTariffRate(), "UNKNOWN");
            }
        } catch (RestClientException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("404")) {
                if (!"000".equals(request.getExportingCountry())) {
                    log.warn("Caught 404 exception, retrying with exporting country '000'");
                    TariffCalculationRequest retryRequest = cloneWithExportingCountry(request, "000");
                    return getTariffDataFromWITS(retryRequest, hsCode);
                }
                log.warn("Caught 404 again with exporting country '000', returning default tariff");
                return new TariffData(getDefaultTariffRate(), "UNKNOWN");
            }
            log.error("Failed to call WITS API: {}", msg);
            return new TariffData(getDefaultTariffRate(), "UNKNOWN");
        }
    }

    private TariffCalculationRequest cloneWithExportingCountry(TariffCalculationRequest original, String newExportingCountry) {
        TariffCalculationRequest copy = new TariffCalculationRequest();
        copy.setImportingCountry(original.getImportingCountry());
        copy.setExportingCountry(newExportingCountry);
        copy.setProductDescription(original.getProductDescription());
        copy.setTradeValue(original.getTradeValue());
        copy.setCurrency(original.getCurrency());
        copy.setTradeDate(original.getTradeDate());
        return copy;
    }

    private String buildWITSUrl(TariffCalculationRequest request, String hsCode) {
        return String.format("%s/reporter/%s/partner/%s/product/%s/year/%d/datatype/reported?format=JSON",
                WITS_BASE_URL,
                request.getImportingCountry(),
                request.getExportingCountry(),
                hsCode,
                request.getTradeDate().getYear());
    }

    private TariffData parseWITSResponse(String responseBody) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(responseBody);

            JsonNode dataSets = root.path("dataSets");
            if (!dataSets.isArray() || dataSets.size() == 0) {
                log.warn("No dataSets found in WITS response");
                return new TariffData(getDefaultTariffRate(), "UNKNOWN");
            }
            JsonNode dataSet = dataSets.get(0);

            JsonNode series = dataSet.path("series");
            if (series.isMissingNode() || series.size() == 0) {
                log.warn("No series data found");
                return new TariffData(getDefaultTariffRate(), "UNKNOWN");
            }

            String seriesKey = series.fieldNames().next();
            JsonNode seriesData = series.get(seriesKey);

            JsonNode observations = seriesData.path("observations");
            if (observations.isMissingNode() || !observations.fieldNames().hasNext()) {
                log.warn("No observations found in series");
                return new TariffData(getDefaultTariffRate(), "UNKNOWN");
            }

            String observationKey = observations.fieldNames().next();
            JsonNode observationValue = observations.get(observationKey);
            if (!observationValue.isArray() || observationValue.size() == 0) {
                log.warn("Observation format invalid or empty");
                return new TariffData(getDefaultTariffRate(), "UNKNOWN");
            }

            double rateDouble = observationValue.get(0).asDouble();
            BigDecimal tariffRate = BigDecimal.valueOf(rateDouble);

            String tariffType = "UNKNOWN";

            // New: get tariff type index from dataSets.attributes
            JsonNode dataSetAttributes = dataSet.path("attributes");
            int tariffTypeIndex = -1;
            if (dataSetAttributes.isArray() && dataSetAttributes.size() > 0) {
                tariffTypeIndex = dataSetAttributes.get(0).asInt(-1);
            }

            if (tariffTypeIndex != -1) {
                JsonNode structureAttributes = root.path("structure").path("attributes").path("observation");
                if (structureAttributes.isArray()) {
                    // Find the attribute with id "TARIFFTYPE" or use first attribute in observation
                    JsonNode tariffTypeAttribute = null;
                    for (JsonNode attr : structureAttributes) {
                        if ("TARIFFTYPE".equalsIgnoreCase(attr.path("id").asText())) {
                            tariffTypeAttribute = attr;
                            break;
                        }
                    }
                    if (tariffTypeAttribute == null && structureAttributes.size() > 0) {
                        tariffTypeAttribute = structureAttributes.get(0);
                    }
                    if (tariffTypeAttribute != null) {
                        JsonNode values = tariffTypeAttribute.path("values");
                        if (values.isArray() && tariffTypeIndex < values.size()) {
                            tariffType = values.get(tariffTypeIndex).path("id").asText("UNKNOWN");
                        }
                    }
                }
            }

            log.info("Parsed tariff rate: {}%, Tariff type: {}", tariffRate, tariffType);

            // Fallback if unknown and tariffRate zero -> "MFN"
            if ("UNKNOWN".equals(tariffType) && tariffRate.compareTo(BigDecimal.ZERO) == 0) {
                tariffType = "MFN";
            }

            return new TariffData(tariffRate, tariffType);

        } catch (Exception e) {
            log.error("Failed to parse WITS response JSON", e);
            return new TariffData(getDefaultTariffRate(), "UNKNOWN");
        }
    }

    private BigDecimal getDefaultTariffRate() {
        log.info("Using default tariff rate due to unavailability");
        return new BigDecimal("5.0");
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

