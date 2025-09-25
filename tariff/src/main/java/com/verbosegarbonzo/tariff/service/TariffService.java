package com.verbosegarbonzo.tariff.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.verbosegarbonzo.tariff.config.WitsProperties;
import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class TariffService {
    // - Build WITS SDMX URL
    // - Call WITS
    // - Extract ratePercent
    // - Compute duty and totalPayable
    // - Return response

    private final WebClient webClient;
    private final WitsProperties props;
    private final ObjectMapper om = new ObjectMapper(); // JSON parsing

    public TariffService(@Qualifier("tariffWebClient") WebClient tariffWebClient, WitsProperties props) {
        this.webClient = tariffWebClient;
        this.props = props;
    }

    public CalculateResponse calculate(CalculateRequest req) {
        final int year = req.getTransactionDate().getYear();

        // Build the initial WITS API path using original reporter and partner
        String partner = req.getPartner();
        String path = props.getTariff().getDataset()
                + "/reporter/" + req.getReporter()
                + "/partner/" + partner
                + "/product/" + req.getHs6()
                + "/year/" + year
                + "/datatype/reported?format=JSON";

        final String dataUrlBase = props.getTariff().getBaseUrl();

        String dataUrl = dataUrlBase + "/" + path;

        // WebClient call hits WITS and waits for the response
        String raw = webClient.get()
                .uri("/" + path) // prepend slash to be safe
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(String.class)
                .block(); // block() is fine in a service method in this project

        // Extract tariff percentage from WITS JSON response
        BigDecimal ratePercent = extractMfnSimpleAveragePercent(raw);

        // If rate not found, attempt fallback with partner "000" (default/world)
        if (ratePercent == null && !"000".equals(partner)) {
            partner = "000"; // fallback to partner '000'

            // Rebuild path with fallback partner
            path = props.getTariff().getDataset()
                    + "/reporter/" + req.getReporter()
                    + "/partner/" + partner
                    + "/product/" + req.getHs6()
                    + "/year/" + year
                    + "/datatype/reported?format=JSON";

            dataUrl = dataUrlBase + "/" + path;

            // Retry WITS call with fallback partner
            raw = webClient.get()
                    .uri("/" + path) // prepend slash again
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            ratePercent = extractMfnSimpleAveragePercent(raw);

            // Throw exception if fallback also yields no rate
            if (ratePercent == null) {
                throw new RateNotFoundException("No MFN rate for hs6=" + req.getHs6()
                        + " reporter=" + req.getReporter()
                        + " partner=" + partner
                        + " year=" + year);
            }
        } else if (ratePercent == null) {
            // Rate not found and partner was already '000' or no fallback possible
            throw new RateNotFoundException("No MFN rate for hs6=" + req.getHs6()
                    + " reporter=" + req.getReporter()
                    + " partner=" + partner
                    + " year=" + year);
        }

        // Convert percentage rate (e.g., 5.00) to decimal (e.g., 0.05) for calculations
        BigDecimal rateDecimal = ratePercent.movePointLeft(2);

        // Calculate duty by multiplying trade value by decimal rate and rounding
        BigDecimal duty = req.getTradeValue()
                .multiply(rateDecimal)
                .setScale(2, RoundingMode.HALF_UP);

        // Calculate total amount payable including duty
        BigDecimal totalPayable = req.getTradeValue().add(duty);

        // Build output DTO with results and metadata including possibly fallback
        // partner
        final CalculateResponse resp = new CalculateResponse();
        resp.setHs6(req.getHs6());
        resp.setReporter(req.getReporter());
        resp.setPartner(partner); // shows fallback partner if used
        resp.setYear(year);
        resp.setRatePercent(ratePercent.setScale(2, RoundingMode.HALF_UP));
        resp.setTradeValue(req.getTradeValue());
        resp.setDuty(duty);
        resp.setTotalPayable(totalPayable);
        resp.setDataUrl(dataUrl);
        return resp;
    }

    // pulling out the tariff percentage from the JSON response returned by WITS
    private BigDecimal extractMfnSimpleAveragePercent(String rawJson) {
        try {
            JsonNode root = om.readTree(rawJson);

            JsonNode dataSets = root.path("dataSets");
            if (!dataSets.isArray() || dataSets.isEmpty())
                return null;

            JsonNode seriesNode = dataSets.get(0).path("series");
            // must be an array with at least one element, otherwise return null
            if (seriesNode.isMissingNode())
                return null;

            var it = seriesNode.fields();
            // Look at the "0" entry, if it is an array and the first element is a number ->
            // return that as a BigDecimal.
            while (it.hasNext()) {
                var entry = it.next();
                JsonNode observations = entry.getValue().path("observations");
                JsonNode firstObs = observations.path("0");
                if (firstObs.isArray() && firstObs.size() > 0 && firstObs.get(0).isNumber()) {
                    // return as percentage
                    return new BigDecimal(firstObs.get(0).asText());
                }
            }
            return null;
        } catch (Exception e) {
            throw new ExternalServiceException("Failed to parse WITS JSON", e);
        }
    }

    // 404 when WITS has no observation for the chosen combo
    public static class RateNotFoundException extends RuntimeException {
        public RateNotFoundException(String msg) {
            super(msg);
        }
    }

    // 502 or 500 when WITS payload is malformed or network/parsing fails
    public static class ExternalServiceException extends RuntimeException {
        public ExternalServiceException(String msg, Throwable cause) {
            super(msg, cause);
        }
    }
}
