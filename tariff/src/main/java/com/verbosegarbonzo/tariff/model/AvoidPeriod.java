package com.verbosegarbonzo.tariff.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents a period to avoid for import/export due to high tariff rates.
 * Shows when tariff rates are expected to be higher than average.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvoidPeriod {

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal avgRate;
    private BigDecimal currentRate;
    private BigDecimal increasePercent;
    private BigDecimal estimatedAdditionalCostAmount;
    private Integer confidence;
    private String reason;
}
