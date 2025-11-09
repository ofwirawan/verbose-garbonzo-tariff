package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.AIRecommendationRequest;
import com.verbosegarbonzo.tariff.model.AIRecommendationResponse;
import com.verbosegarbonzo.tariff.model.ProfileType;
import com.verbosegarbonzo.tariff.service.AIRecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * REST Controller for AI-powered timing recommendations.
 * Provides endpoints for analyzing tariff rates and generating personalized recommendations.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AIController {

    private final AIRecommendationService aiRecommendationService;

    /**
     * Get AI timing recommendations for a specific trade route.
     * Personalizes recommendations based on authenticated user's profile type.
     *
     * @param request Contains importer code, exporter code, and HS6 code
     * @param principal Authenticated user principal
     * @return AIRecommendationResponse with optimal/avoid periods and explanation
     */
    @PostMapping("/recommendation")
    public ResponseEntity<AIRecommendationResponse> getRecommendation(
            @Valid @RequestBody AIRecommendationRequest request,
            @AuthenticationPrincipal User principal) {

        if (principal == null) {
            log.warn("Attempted AI recommendation without authentication");
            return ResponseEntity.status(401).build();
        }

        log.info("Generating AI recommendations for user {}", principal.getUsername());

        try {
            // Default to BUSINESS_OWNER profile type
            // In a real implementation, you could store profile type in UserInfo and load it here
            ProfileType userProfile = ProfileType.BUSINESS_OWNER;

            AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
                    request.getImporterCode(),
                    request.getExporterCode(),
                    request.getHs6Code(),
                    userProfile);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error generating AI recommendations", e);
            return ResponseEntity.status(500).build();
        }
    }
}
