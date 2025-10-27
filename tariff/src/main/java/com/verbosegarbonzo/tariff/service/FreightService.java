package com.verbosegarbonzo.tariff.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;

@Service
public class FreightService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FreightService(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("https://ship.freightos.com/api").build();
    }

    @Getter @Setter
    public static class FreightQuote {
        private boolean success;
        private BigDecimal avgCost;
        private String mode;
    }

    public FreightQuote getFreightQuote(String originCode,
                                        String destinationCode,
                                        BigDecimal weight,
                                        String requestedMode) {
        FreightQuote quote = new FreightQuote();
        quote.setMode(requestedMode != null ? requestedMode : "air");
        quote.setSuccess(false);
        quote.setAvgCost(BigDecimal.ZERO);

        try {
            String uri = String.format("/shippingCalculator?origin=%s&destination=%s&weight=%s&loadtype=boxes&quantity=1",
                    originCode, destinationCode, weight.toPlainString());

            String responseBody = webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorResume(e -> Mono.empty())
                    .block();

            if (responseBody == null) {
                return quote;
            }

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode ratesArray = root.path("estimatedFreightRates");
            if (!ratesArray.isArray() || ratesArray.size() == 0) {
                return quote;
            }

            // Pick the first rate matching the mode or just the first
            JsonNode selectedRateNode = null;
            for (JsonNode rateNode : ratesArray) {
                String modeVal = rateNode.path("mode").asText("");
                if (modeVal.equalsIgnoreCase(requestedMode)) {
                    selectedRateNode = rateNode;
                    break;
                }
            }
            if (selectedRateNode == null) {
                selectedRateNode = ratesArray.get(0);
            }

            JsonNode priceNode = selectedRateNode.path("price");
            JsonNode minAmountNode = priceNode.path("min").path("moneyAmount").path("amount");
            JsonNode maxAmountNode = priceNode.path("max").path("moneyAmount").path("amount");

            BigDecimal minCost = minAmountNode.isNumber()
                    ? new BigDecimal(minAmountNode.asText())
                    : BigDecimal.ZERO;
            BigDecimal maxCost = maxAmountNode.isNumber()
                    ? new BigDecimal(maxAmountNode.asText())
                    : minCost;

            // compute average
            BigDecimal avgCost = minCost.add(maxCost).divide(BigDecimal.valueOf(2), 2, BigDecimal.ROUND_HALF_UP);

            quote.setSuccess(true);
            quote.setAvgCost(avgCost);
            quote.setMode(selectedRateNode.path("mode").asText(quote.getMode()));
            return quote;

        } catch (Exception e) {
            //throw a custom exception (for future scaling)
            return quote;
        }
    }
}
