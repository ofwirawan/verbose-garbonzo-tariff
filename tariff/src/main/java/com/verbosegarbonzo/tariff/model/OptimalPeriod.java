package com.verbosegarbonzo.tariff.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents an optimal period for import/export based on tariff rates.
 * Shows the best date range to conduct the transaction for maximum savings.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimalPeriod {

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal avgRate;
    private BigDecimal currentRate;
    private BigDecimal savingsPercent;
    private BigDecimal estimatedSavingsAmount;
    private Integer confidence;
    private String reason;
}
