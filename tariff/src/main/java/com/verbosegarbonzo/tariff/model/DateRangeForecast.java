package com.verbosegarbonzo.tariff.model;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Forecast for a date range.
 * Used internally for aggregating daily predictions into weekly/monthly ranges.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DateRangeForecast {

    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal avgRate;
    private BigDecimal minRate;
    private BigDecimal maxRate;
    private Integer confidencePercent;
    private Long dayCount;
}
