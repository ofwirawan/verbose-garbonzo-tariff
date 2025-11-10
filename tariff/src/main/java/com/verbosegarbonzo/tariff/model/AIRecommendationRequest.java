package com.verbosegarbonzo.tariff.model;

import lombok.*;

/**
 * Request DTO for getting AI timing recommendations.
 * Contains the trade parameters for which to generate recommendations.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIRecommendationRequest {

    private String importerCode;
    private String exporterCode;
    private String hs6Code;
}
