package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.*;
import com.verbosegarbonzo.tariff.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

/**
 * Service for extracting features from historical data for ML model training and inference.
 * Transforms raw tariff data into meaningful features that the ML model can learn from.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureEngineeringService {

    private final MeasureRepository measureRepository;
    private final PreferenceRepository preferenceRepository;
    private final SuspensionRepository suspensionRepository;

    /**
     * Extracts features for a given date and trade parameters.
     * Used both for model training and inference.
     */
    public TariffFeatures extractFeatures(
            String importerCode,
            String exporterCode,
            String hs6Code,
            LocalDate targetDate) {

        // Fetch historical data (5 years back)
        LocalDate fiveYearsAgo = targetDate.minusYears(5);
        List<Measure> historicalMeasures = measureRepository.findHistoricalRates(
            importerCode, hs6Code, fiveYearsAgo, targetDate);

        List<Preference> historicalPreferences = null;
        if (exporterCode != null && !exporterCode.isEmpty()) {
            historicalPreferences = preferenceRepository.findHistoricalPreferences(
                importerCode, exporterCode, hs6Code, fiveYearsAgo, targetDate);
        }

        List<Suspension> historicalSuspensions = suspensionRepository.findHistoricalSuspensions(
            importerCode, hs6Code, fiveYearsAgo, targetDate);

        return TariffFeatures.builder()
            // Temporal features
            .year(targetDate.getYear())
            .quarter((targetDate.getMonthValue() - 1) / 3 + 1)
            .month(targetDate.getMonthValue())
            .dayOfYear(targetDate.getDayOfYear())
            .daysSinceEpoch(calculateDaysSinceEpoch(targetDate))

            // Rate history features
            .avgRateLast3Years(calculateAverageRate(historicalMeasures, targetDate.minusYears(3)))
            .avgRateLast5Years(calculateAverageRate(historicalMeasures, targetDate.minusYears(5)))
            .rateVolatility(calculateVolatility(historicalMeasures))
            .trendDirection(calculateTrend(historicalMeasures))

            // Trade pattern features
            .tradeFrequency(0L) // Will be set by context when available
            .avgTradeValue(BigDecimal.ZERO) // Will be set by context when available
            .avgWeight(BigDecimal.ZERO) // Will be set by context when available

            // Policy indicator features
            .hasPreference(historicalPreferences != null && !historicalPreferences.isEmpty())
            .hasSuspension(!historicalSuspensions.isEmpty())
            .yearsSinceFTA(calculateYearsSinceFTA(historicalPreferences, targetDate))

            // Geographic encoding features
            .importerCodeHash(importerCode != null ? importerCode.hashCode() : 0)
            .exporterCodeHash(exporterCode != null ? exporterCode.hashCode() : 0)

            .build();
    }

    /**
     * Calculates the average rate for a given period.
     */
    private BigDecimal calculateAverageRate(List<Measure> measures, LocalDate startDate) {
        return measures.stream()
            .filter(m -> m.getValidFrom().isAfter(startDate))
            .map(Measure::getMfnAdvalRate)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(
                BigDecimal.valueOf(Math.max(1, measures.size())),
                2,
                RoundingMode.HALF_UP);
    }

    /**
     * Calculates standard deviation (volatility) of rates.
     */
    private BigDecimal calculateVolatility(List<Measure> measures) {
        if (measures.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal mean = measures.stream()
            .map(Measure::getMfnAdvalRate)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(measures.size()), 2, RoundingMode.HALF_UP);

        BigDecimal variance = measures.stream()
            .map(Measure::getMfnAdvalRate)
            .filter(Objects::nonNull)
            .map(rate -> rate.subtract(mean).pow(2))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(measures.size()), 2, RoundingMode.HALF_UP);

        // Return square root of variance (simplified - using approximation)
        return new BigDecimal(Math.sqrt(variance.doubleValue()));
    }

    /**
     * Calculates trend direction: -1 (decreasing), 0 (stable), 1 (increasing).
     */
    private Integer calculateTrend(List<Measure> measures) {
        if (measures.size() < 2) {
            return 0; // Stable if not enough data
        }

        // Compare recent vs older rates
        int mid = measures.size() / 2;
        BigDecimal recentAvg = measures.stream()
            .skip(mid)
            .map(Measure::getMfnAdvalRate)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(Math.max(1, measures.size() - mid)), 2, RoundingMode.HALF_UP);

        BigDecimal olderAvg = measures.stream()
            .limit(mid)
            .map(Measure::getMfnAdvalRate)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(Math.max(1, mid)), 2, RoundingMode.HALF_UP);

        BigDecimal change = recentAvg.subtract(olderAvg);

        if (change.compareTo(new BigDecimal("0.5")) > 0) {
            return 1; // Increasing
        } else if (change.compareTo(new BigDecimal("-0.5")) < 0) {
            return -1; // Decreasing
        } else {
            return 0; // Stable
        }
    }

    /**
     * Calculates years since FTA (if preference exists).
     */
    private Integer calculateYearsSinceFTA(List<Preference> preferences, LocalDate targetDate) {
        if (preferences == null || preferences.isEmpty()) {
            return null;
        }

        // Find earliest FTA validity date
        LocalDate earliestFTA = preferences.stream()
            .map(Preference::getValidFrom)
            .min(LocalDate::compareTo)
            .orElse(targetDate);

        return (int) java.time.temporal.ChronoUnit.YEARS.between(earliestFTA, targetDate);
    }

    /**
     * Calculates days since epoch for temporal encoding.
     */
    private Long calculateDaysSinceEpoch(LocalDate date) {
        return java.time.temporal.ChronoUnit.DAYS.between(
            LocalDate.ofEpochDay(0), date);
    }
}
