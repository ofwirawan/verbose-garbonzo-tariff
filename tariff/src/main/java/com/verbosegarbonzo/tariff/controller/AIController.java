package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.AIRecommendationRequest;
import com.verbosegarbonzo.tariff.model.AIRecommendationResponse;
import com.verbosegarbonzo.tariff.model.GeminiSummaryRequest;
import com.verbosegarbonzo.tariff.model.GeminiSummaryResponse;
import com.verbosegarbonzo.tariff.model.ProfileType;
import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.AIRecommendationService;
import com.verbosegarbonzo.tariff.service.GeminiSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Optional;

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
    private final UserInfoRepository userInfoRepository;
    private final GeminiSummaryService geminiSummaryService;

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
            // Fetch user's profile type from database
            Optional<UserInfo> userInfo = userInfoRepository.findByEmail(principal.getUsername());
            ProfileType userProfile = userInfo
                    .map(UserInfo::getProfileType)
                    .orElse(ProfileType.BUSINESS_OWNER); // Default if not set

            log.info("Using profile type: {} for user {}", userProfile, principal.getUsername());

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

    /**
     * Generate Gemini 2.5 summary for AI recommendations (Option 1: Two-Phase Approach).
     * This is a separate endpoint that can be called asynchronously after getting ML results.
     *
     * @param request Contains the ML recommendation and trade route info
     * @param principal Authenticated user principal
     * @return GeminiSummaryResponse with AI-enhanced summary
     */
    @PostMapping("/gemini-summary")
    public ResponseEntity<GeminiSummaryResponse> getGeminiSummary(
            @Valid @RequestBody GeminiSummaryRequest request,
            @AuthenticationPrincipal User principal) {

        if (principal == null) {
            log.warn("Attempted Gemini summary without authentication");
            return ResponseEntity.status(401).build();
        }

        log.info("🤖 [Controller] Generating Gemini summary for user: {}", principal.getUsername());

        try {
            // Fetch user's profile type from database
            Optional<UserInfo> userInfo = userInfoRepository.findByEmail(principal.getUsername());
            ProfileType userProfile = userInfo
                    .map(UserInfo::getProfileType)
                    .orElse(ProfileType.BUSINESS_OWNER); // Default if not set

            log.info("🤖 [Controller] Using profile type: {} for Gemini summary", userProfile);
            log.info("🤖 [Controller] Request details - Importer: {}, HS6: {}", request.getImporterCode(), request.getHs6Code());

            // Generate Gemini summary based on ML recommendations
            String geminiSummary = geminiSummaryService.generateGeminiSummary(
                    request.getRecommendation(),
                    userProfile,
                    request.getImporterCode(),
                    request.getHs6Code());

            GeminiSummaryResponse response = GeminiSummaryResponse.builder()
                    .summary(geminiSummary)
                    .profileType(userProfile)
                    .success(!geminiSummary.isEmpty())
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error generating Gemini summary", e);
            return ResponseEntity.status(500).body(GeminiSummaryResponse.builder()
                    .summary("")
                    .success(false)
                    .build());
        }
    }
}
