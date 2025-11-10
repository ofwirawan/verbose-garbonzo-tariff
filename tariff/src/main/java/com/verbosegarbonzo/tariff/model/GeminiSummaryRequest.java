package com.verbosegarbonzo.tariff.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

/**
 * Request model for Gemini summary generation.
 * Contains ML recommendation results and trade route information.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GeminiSummaryRequest {

    @NotBlank(message = "Importer code is required")
    private String importerCode;

    @NotBlank(message = "HS6 code is required")
    private String hs6Code;

    private String exporterCode;

    @Valid
    private AIRecommendationResponse recommendation;
}
