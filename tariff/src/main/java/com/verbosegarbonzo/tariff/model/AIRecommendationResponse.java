package com.verbosegarbonzo.tariff.model;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO containing AI-generated timing recommendations.
 * Provides optimal and avoid periods along with personalized explanations.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIRecommendationResponse {

    private List<OptimalPeriod> optimalPeriods;
    private List<AvoidPeriod> avoidPeriods;
    private String explanation;
    private BigDecimal currentRate;
    private BigDecimal potentialSavings;
    private BigDecimal potentialSavingsPercent;
    private Integer averageConfidence;
    private String modelVersion;
    private Boolean hasInsufficientData;
}
