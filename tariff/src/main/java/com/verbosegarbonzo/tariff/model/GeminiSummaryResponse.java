package com.verbosegarbonzo.tariff.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response model for Gemini summary generation.
 * Contains the AI-enhanced summary and profile information.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GeminiSummaryResponse {

    private String summary;

    private ProfileType profileType;

    private boolean success;
}
