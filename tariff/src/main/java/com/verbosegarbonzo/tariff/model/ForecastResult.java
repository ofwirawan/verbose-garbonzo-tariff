package com.verbosegarbonzo.tariff.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * ML forecast result for a specific date.
 * Contains predicted rate and confidence metrics.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastResult {

    private LocalDate forecastDate;
    private BigDecimal predictedRate;
    private BigDecimal confidenceLower;
    private BigDecimal confidenceUpper;
    private Integer confidencePercent; // 0-100%
    private String modelVersion;
    private Boolean hasHistoricalData;
}
