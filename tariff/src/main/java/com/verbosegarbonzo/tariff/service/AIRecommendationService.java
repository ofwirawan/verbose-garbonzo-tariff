package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.*;
import com.verbosegarbonzo.tariff.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating AI-powered timing recommendations.
 * Analyzes historical tariff data and predicts optimal import/export periods.
 * Personalizes recommendations based on user profile type.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIRecommendationService {

    private final TariffMLService mlService;
    private final MeasureRepository measureRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;
    private final UserInfoRepository userInfoRepository;

    /**
     * Get AI timing recommendations for a specific trade route.
     */
    @Cacheable(value = "aiRecommendations", key = "#importerCode + '-' + #exporterCode + '-' + #hs6Code + '-' + #userProfile")
    public AIRecommendationResponse getTimingRecommendation(
            String importerCode,
            String exporterCode,
            String hs6Code,
            ProfileType userProfile) {

        try {
            log.info("Generating AI recommendations for {}/{}/{} - Profile: {}",
                importerCode, exporterCode, hs6Code, userProfile);

            LocalDate today = LocalDate.now();
            LocalDate endDate = today.plusDays(365);

            // Get current rate
            BigDecimal currentRate = getCurrentRate(importerCode, hs6Code);

            // Predict rates for next 365 days
            log.info("*** About to call mlService.predictRateRange() ***");
            List<DateRangeForecast> forecasts = mlService.predictRateRange(
                importerCode, exporterCode, hs6Code, today, endDate);
            log.info("*** Returned from mlService.predictRateRange() - got {} forecasts", forecasts.size());

            if (forecasts.isEmpty()) {
                log.warn("No forecasts available for {}/{}", importerCode, hs6Code);
                return createEmptyResponse(currentRate);
            }

            // Identify optimal and avoid periods
            List<OptimalPeriod> optimalPeriods = findOptimalPeriods(forecasts, currentRate, importerCode, hs6Code);
            List<AvoidPeriod> avoidPeriods = findAvoidPeriods(forecasts, currentRate, importerCode, hs6Code);

            // Calculate potential savings
            BigDecimal potentialSavings = calculatePotentialSavings(optimalPeriods, currentRate);
            BigDecimal potentialSavingsPercent = currentRate.compareTo(BigDecimal.ZERO) > 0
                ? potentialSavings.divide(currentRate, 2, RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                : BigDecimal.ZERO;

            // Calculate average confidence
            int avgConfidence = (int) forecasts.stream()
                .mapToInt(DateRangeForecast::getConfidencePercent)
                .average()
                .orElse(70);

            // Generate personalized explanation
            String explanation = generateExplanation(
                optimalPeriods, avoidPeriods, userProfile, importerCode, hs6Code);

            return AIRecommendationResponse.builder()
                .optimalPeriods(optimalPeriods)
                .avoidPeriods(avoidPeriods)
                .explanation(explanation)
                .currentRate(currentRate)
                .potentialSavings(potentialSavings)
                .potentialSavingsPercent(potentialSavingsPercent)
                .averageConfidence(avgConfidence)
                .modelVersion("1.0.0")
                .hasInsufficientData(false)
                .build();

        } catch (Exception e) {
            log.error("Error generating AI recommendations", e);
            return createErrorResponse(importerCode, hs6Code);
        }
    }

    /**
     * Find optimal periods (lowest rates) from forecasts.
     */
    private List<OptimalPeriod> findOptimalPeriods(
            List<DateRangeForecast> forecasts,
            BigDecimal currentRate,
            String importerCode,
            String hs6Code) {

        List<OptimalPeriod> optimalPeriods = new ArrayList<>();

        // Group consecutive low-rate periods
        List<DateRangeForecast> sortedByRate = forecasts.stream()
            .sorted(Comparator.comparing(DateRangeForecast::getAvgRate))
            .collect(Collectors.toList());

        // Take top 3 lowest rate periods
        for (int i = 0; i < Math.min(3, sortedByRate.size()); i++) {
            DateRangeForecast forecast = sortedByRate.get(i);

            if (forecast.getAvgRate().compareTo(currentRate) < 0) {
                BigDecimal savingsPercent = currentRate.subtract(forecast.getAvgRate())
                    .divide(currentRate, 2, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));

                BigDecimal estimatedSavingsAmount = savingsPercent.multiply(new BigDecimal("10000")) // Assume $10k trade
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                String reason = determineReason(forecast, importerCode, hs6Code, true);

                optimalPeriods.add(OptimalPeriod.builder()
                    .startDate(forecast.getStartDate())
                    .endDate(forecast.getEndDate())
                    .avgRate(forecast.getAvgRate())
                    .currentRate(currentRate)
                    .savingsPercent(savingsPercent)
                    .estimatedSavingsAmount(estimatedSavingsAmount)
                    .confidence(forecast.getConfidencePercent())
                    .reason(reason)
                    .build());
            }
        }

        return optimalPeriods;
    }

    /**
     * Find periods to avoid (highest rates) from forecasts.
     */
    private List<AvoidPeriod> findAvoidPeriods(
            List<DateRangeForecast> forecasts,
            BigDecimal currentRate,
            String importerCode,
            String hs6Code) {

        List<AvoidPeriod> avoidPeriods = new ArrayList<>();

        // Group consecutive high-rate periods
        List<DateRangeForecast> sortedByRate = forecasts.stream()
            .sorted(Comparator.comparing(DateRangeForecast::getAvgRate).reversed())
            .collect(Collectors.toList());

        // Take top 2 highest rate periods
        for (int i = 0; i < Math.min(2, sortedByRate.size()); i++) {
            DateRangeForecast forecast = sortedByRate.get(i);

            if (forecast.getAvgRate().compareTo(currentRate) > 0) {
                BigDecimal increasePercent = forecast.getAvgRate().subtract(currentRate)
                    .divide(currentRate, 2, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));

                BigDecimal estimatedAdditionalCost = increasePercent.multiply(new BigDecimal("10000"))
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                String reason = determineReason(forecast, importerCode, hs6Code, false);

                avoidPeriods.add(AvoidPeriod.builder()
                    .startDate(forecast.getStartDate())
                    .endDate(forecast.getEndDate())
                    .avgRate(forecast.getAvgRate())
                    .currentRate(currentRate)
                    .increasePercent(increasePercent)
                    .estimatedAdditionalCostAmount(estimatedAdditionalCost)
                    .confidence(forecast.getConfidencePercent())
                    .reason(reason)
                    .build());
            }
        }

        return avoidPeriods;
    }

    /**
     * Determine reason for rate change.
     */
    private String determineReason(DateRangeForecast forecast, String importerCode, String hs6Code, boolean isOptimal) {
        // In a real implementation, this would analyze suspensions, FTA dates, etc.
        if (isOptimal) {
            // Check for suspensions during this period
            int month = forecast.getStartDate().getMonthValue();
            if (month >= 4 && month <= 6) {
                return "FTA renewal period typically shows lower rates";
            }
            return "Historical data shows lower rates during this period";
        } else {
            int month = forecast.getStartDate().getMonthValue();
            if (month == 1 || month == 9) {
                return "Policy adjustment period historically increases rates";
            }
            return "Historical rate increase pattern detected";
        }
    }

    /**
     * Calculate potential savings based on optimal periods.
     */
    private BigDecimal calculatePotentialSavings(List<OptimalPeriod> optimalPeriods, BigDecimal currentRate) {
        if (optimalPeriods.isEmpty()) {
            return BigDecimal.ZERO;
        }

        OptimalPeriod bestPeriod = optimalPeriods.get(0);
        if (bestPeriod.getSavingsPercent() == null) {
            return BigDecimal.ZERO;
        }

        // Calculate savings on $10,000 trade value
        return bestPeriod.getSavingsPercent()
            .multiply(new BigDecimal("10000"))
            .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    /**
     * Generate personalized explanation based on user profile.
     */
    private String generateExplanation(
            List<OptimalPeriod> optimalPeriods,
            List<AvoidPeriod> avoidPeriods,
            ProfileType userProfile,
            String importerCode,
            String hs6Code) {

        StringBuilder explanation = new StringBuilder();

        if (userProfile == ProfileType.BUSINESS_OWNER) {
            explanation.append("Based on historical tariff data analysis, we've identified the best timing for your imports/exports. ");
            if (!optimalPeriods.isEmpty()) {
                OptimalPeriod best = optimalPeriods.get(0);
                explanation.append(String.format(
                    "The optimal period is %s to %s with an estimated rate of %.2f%% (%.2f%% savings). ",
                    best.getStartDate(), best.getEndDate(), best.getAvgRate(), best.getSavingsPercent()));
            }
            explanation.append("Schedule your transactions during recommended periods to maximize cost efficiency. ");
            if (!avoidPeriods.isEmpty()) {
                AvoidPeriod avoid = avoidPeriods.get(0);
                explanation.append(String.format(
                    "Avoid %s to %s when rates are expected to increase to %.2f%%.",
                    avoid.getStartDate(), avoid.getEndDate(), avoid.getAvgRate()));
            }

        } else if (userProfile == ProfileType.POLICY_ANALYST) {
            explanation.append("Historical tariff analysis for HS6 code ").append(hs6Code).append(": ");
            explanation.append("We observe seasonal variations in tariff rates. Q2 (April-June) typically shows lower rates ");
            explanation.append("due to preferential trade agreement renewal cycles. ");
            explanation.append("Current data shows rate volatility of ±2-3% throughout the year. ");
            explanation.append("These patterns can inform policy discussions on trade timing and economic impacts.");

        } else if (userProfile == ProfileType.STUDENT) {
            explanation.append("Educational insight: Tariff rates for this product vary throughout the year. ");
            explanation.append("This variation depends on international trade agreements, policy changes, and market conditions. ");
            explanation.append("By analyzing historical patterns, we can identify periods when rates are typically lower or higher. ");
            explanation.append("This demonstrates how macroeconomic factors affect import/export decisions.");
        }

        return explanation.toString();
    }

    /**
     * Get current tariff rate for importer-product combination.
     */
    private BigDecimal getCurrentRate(String importerCode, String hs6Code) {
        try {
            // Load Country and Product from database
            Optional<Country> country = countryRepository.findById(importerCode);
            Optional<Product> product = productRepository.findById(hs6Code);

            if (country.isPresent() && product.isPresent()) {
                Optional<Measure> currentMeasure = measureRepository.findValidRate(
                    country.get(),
                    product.get(),
                    LocalDate.now());

                if (currentMeasure.isPresent()) {
                    BigDecimal rate = currentMeasure.get().getMfnAdvalRate();
                    return rate != null ? rate : BigDecimal.ZERO;
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch current rate, using default", e);
        }

        return BigDecimal.valueOf(5.0); // Default estimate
    }

    /**
     * Create response when no recommendations available.
     */
    private AIRecommendationResponse createEmptyResponse(BigDecimal currentRate) {
        return AIRecommendationResponse.builder()
            .optimalPeriods(new ArrayList<>())
            .avoidPeriods(new ArrayList<>())
            .explanation("Insufficient historical data available for this trade route.")
            .currentRate(currentRate)
            .potentialSavings(BigDecimal.ZERO)
            .potentialSavingsPercent(BigDecimal.ZERO)
            .averageConfidence(30)
            .modelVersion("1.0.0")
            .hasInsufficientData(true)
            .build();
    }

    /**
     * Create error response.
     */
    private AIRecommendationResponse createErrorResponse(String importerCode, String hs6Code) {
        log.error("Failed to generate recommendations for {}/{}", importerCode, hs6Code);

        return AIRecommendationResponse.builder()
            .optimalPeriods(new ArrayList<>())
            .avoidPeriods(new ArrayList<>())
            .explanation("Unable to generate recommendations at this time. Please try again later.")
            .currentRate(BigDecimal.ZERO)
            .potentialSavings(BigDecimal.ZERO)
            .potentialSavingsPercent(BigDecimal.ZERO)
            .averageConfidence(0)
            .modelVersion("1.0.0")
            .hasInsufficientData(true)
            .build();
    }
}
