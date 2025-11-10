package com.verbosegarbonzo.tariff.model;

import lombok.*;

import java.math.BigDecimal;

/**
 * Feature vector for ML model training and inference.
 * Contains extracted temporal, geographic, and economic features.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TariffFeatures {

    // Temporal features
    private Integer year;
    private Integer quarter;
    private Integer month;
    private Integer dayOfYear;
    private Long daysSinceEpoch;

    // Rate history features
    private BigDecimal avgRateLast3Years;
    private BigDecimal avgRateLast5Years;
    private BigDecimal rateVolatility;
    private Integer trendDirection; // -1: decreasing, 0: stable, 1: increasing

    // Trade pattern features
    private Long tradeFrequency;
    private BigDecimal avgTradeValue;
    private BigDecimal avgWeight;

    // Policy indicator features
    private Boolean hasPreference;
    private Boolean hasSuspension;
    private Integer yearsSinceFTA;

    // Geographic encoding features
    private Integer importerCodeHash;
    private Integer exporterCodeHash;
}
