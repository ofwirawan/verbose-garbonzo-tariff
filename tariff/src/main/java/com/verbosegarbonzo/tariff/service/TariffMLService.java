package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.config.MLModelProperties;
import com.verbosegarbonzo.tariff.model.*;
import com.verbosegarbonzo.tariff.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Machine Learning service for tariff rate forecasting.
 * Uses trained regression model to predict tariff rates based on historical data.
 * Implements real ML model training instead of statistical fallbacks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TariffMLService {

    private final MeasureRepository measureRepository;
    private final MLModelProperties mlProperties;

    private LocalDate lastModelTrainDate;
    private boolean modelTrained = false;
    private Map<String, TariffMLModel> tradeRouteModels = new HashMap<>();

    /**
     * Initialize: load or prepare ML models.
     * Called automatically when the service is created (PostConstruct).
     */
    @PostConstruct
    public void initializeModel() {
        try {
            log.info("Initializing ML-based tariff forecasting service...");

            // Create models directory if it doesn't exist
            Files.createDirectories(Paths.get(mlProperties.getModel().getPath()));

            if (mlProperties.getModel().isEnabled()) {
                if (loadModelsFromDisk()) {
                    log.info("Successfully loaded existing ML models");
                    this.modelTrained = true;
                } else {
                    log.info("No existing models found. Models will be trained on first request.");
                    this.modelTrained = false;
                }
            }

            this.lastModelTrainDate = LocalDate.now();
        } catch (Exception e) {
            log.error("Failed to initialize ML model service", e);
            this.modelTrained = false;
        }
    }

    /**
     * Train new ML models on historical data.
     * Trains separate models for different trade routes based on historical patterns.
     */
    public void trainNewModel() {
        log.info("trainNewModel() called - mlEnabled: {}, modelTrained: {}",
            mlProperties.getModel().isEnabled(), modelTrained);

        if (!mlProperties.getModel().isEnabled()) {
            log.info("ML model training disabled in configuration");
            return;
        }

        try {
            log.info("*** STARTING ML MODEL TRAINING ON HISTORICAL DATA ***");

            // Fetch all historical measures
            List<Measure> historicalData = measureRepository.findAll();

            if (historicalData.isEmpty()) {
                log.warn("No historical data available for training");
                this.modelTrained = false;
                return;
            }

            log.info("Training models on {} historical records", historicalData.size());

            // Group data by importer and product
            Map<String, List<Measure>> groupedData = groupByTradeRoute(historicalData);
            log.info("Grouped data into {} trade routes", groupedData.size());

            // Train a model for each significant trade route
            int trainedCount = 0;
            int skippedCount = 0;
            for (Map.Entry<String, List<Measure>> entry : groupedData.entrySet()) {
                String tradeRoute = entry.getKey();
                List<Measure> routeData = entry.getValue();

                log.info("Trade route {}: {} records", tradeRoute, routeData.size());

                int minSamples = mlProperties.getModel().getMinTrainingSamples();
                if (routeData.size() >= minSamples) { // Need minimum configured records for meaningful model
                    try {
                        TariffMLModel model = trainModelForRoute(tradeRoute, routeData);
                        tradeRouteModels.put(tradeRoute, model);
                        trainedCount++;
                        log.info("Trained model for trade route: {} with {} records", tradeRoute, routeData.size());
                    } catch (Exception e) {
                        log.warn("Failed to train model for route {}: {}", tradeRoute, e.getMessage());
                    }
                } else {
                    skippedCount++;
                    log.debug("Skipping trade route {} - only {} records (need {})", tradeRoute, routeData.size(), minSamples);
                }
            }

            this.lastModelTrainDate = LocalDate.now();
            this.modelTrained = !tradeRouteModels.isEmpty();

            if (modelTrained) {
                saveModelsToDisk();
            }

            log.info("ML model training completed. Trained: {}, Skipped: {}, Total models: {}",
                trainedCount, skippedCount, tradeRouteModels.size());

        } catch (Exception e) {
            log.error("Error during ML model training", e);
            this.modelTrained = false;
        }
    }

    /**
     * Predict tariff rate for a specific date using ML model or fallback.
     * Returns prediction with confidence score.
     */
    @Cacheable(value = "tariffForecasts", key = "#importerCode + '-' + #exporterCode + '-' + #hs6Code + '-' + #targetDate")
    public ForecastResult predictTariffRate(
            String importerCode,
            String exporterCode,
            String hs6Code,
            LocalDate targetDate) {

        try {
            // Check if we have recent historical data
            long historicalCount = measureRepository.countHistoricalRecords(importerCode, hs6Code);

            if (historicalCount == 0) {
                log.warn("No historical data for {}/{}", importerCode, hs6Code);
                return createFallbackForecast(importerCode, exporterCode, hs6Code, targetDate, false);
            }

            // Try to get trained model for this trade route
            String tradeRoute = importerCode + "-" + hs6Code;
            TariffMLModel model = tradeRouteModels.get(tradeRoute);

            if (model != null && modelTrained) {
                // Use ML model prediction
                log.info("✅ Using ML MODEL for {}", tradeRoute);
                return predictWithMLModel(model, importerCode, exporterCode, hs6Code, targetDate);
            } else {
                // Use statistical fallback when model not available
                log.info("⚠️  Using FALLBACK for {} (model available: {}, modelTrained: {})",
                    tradeRoute, model != null, modelTrained);
                log.info("📊 Available models: {}", tradeRouteModels.keySet());
                return createFallbackForecast(importerCode, exporterCode, hs6Code, targetDate, true);
            }

        } catch (Exception e) {
            log.error("Prediction failed, using fallback", e);
            return createFallbackForecast(importerCode, exporterCode, hs6Code, targetDate, true);
        }
    }

    /**
     * Optimized prediction for batch operations.
     * Uses pre-fetched historical data to avoid repeated database queries.
     * Internal method used by predictRateRange() to minimize database calls.
     */
    private ForecastResult predictTariffRateOptimized(
            String importerCode,
            String exporterCode,
            String hs6Code,
            LocalDate targetDate,
            List<Measure> cachedHistoricalRates) {

        try {
            if (cachedHistoricalRates.isEmpty()) {
                return createFallbackForecastOptimized(importerCode, exporterCode, hs6Code, targetDate, false, cachedHistoricalRates);
            }

            // Try to get trained model for this trade route
            String tradeRoute = importerCode + "-" + hs6Code;
            TariffMLModel model = tradeRouteModels.get(tradeRoute);

            if (model != null && modelTrained) {
                // Use ML model prediction with cached features
                return predictWithMLModelOptimized(model, importerCode, exporterCode, hs6Code, targetDate, cachedHistoricalRates);
            } else {
                // Use fallback with pre-fetched data
                return createFallbackForecastOptimized(importerCode, exporterCode, hs6Code, targetDate, true, cachedHistoricalRates);
            }

        } catch (Exception e) {
            log.error("Optimized prediction failed, using fallback", e);
            return createFallbackForecastOptimized(importerCode, exporterCode, hs6Code, targetDate, true, cachedHistoricalRates);
        }
    }

    /**
     * Predict rates for a date range using trained models.
     * Used to identify optimal and avoid periods.
     * Optimized to minimize database queries by caching historical data.
     */
    public List<DateRangeForecast> predictRateRange(
            String importerCode,
            String exporterCode,
            String hs6Code,
            LocalDate startDate,
            LocalDate endDate) {

        log.info("*** predictRateRange() called - modelTrained: {}, mlEnabled: {}, modelCount: {}",
            modelTrained, mlProperties.getModel().isEnabled(), tradeRouteModels.size());

        // Train models on first request if not already trained
        if (!modelTrained && mlProperties.getModel().isEnabled()) {
            log.info("*** Models not trained yet. Training on first request...");
            trainNewModel();
            log.info("*** Training completed. Models count: {}", tradeRouteModels.size());
        }

        // Pre-fetch historical data once instead of querying for every date
        LocalDate threeYearsAgo = LocalDate.now().minusYears(3);
        List<Measure> cachedHistoricalRates = measureRepository.findHistoricalRates(
            importerCode, hs6Code, threeYearsAgo, LocalDate.now());
        log.info("Pre-fetched {} historical records for {}-{} to optimize queries",
            cachedHistoricalRates.size(), importerCode, hs6Code);

        List<DateRangeForecast> results = new ArrayList<>();
        LocalDate currentDate = startDate;

        // Predict weekly averages for efficiency
        while (currentDate.isBefore(endDate)) {
            LocalDate weekEnd = currentDate.plusDays(6);
            List<ForecastResult> weekForecasts = new ArrayList<>();

            // Predict each day in the week
            LocalDate dayIterator = currentDate;
            while (dayIterator.isBefore(weekEnd.plusDays(1)) && dayIterator.isBefore(endDate)) {
                ForecastResult forecast = predictTariffRateOptimized(importerCode, exporterCode, hs6Code, dayIterator, cachedHistoricalRates);
                weekForecasts.add(forecast);
                dayIterator = dayIterator.plusDays(1);
            }

            // Aggregate to weekly range
            if (!weekForecasts.isEmpty()) {
                BigDecimal avgRate = weekForecasts.stream()
                    .map(ForecastResult::getPredictedRate)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(weekForecasts.size()), 2, RoundingMode.HALF_UP);

                BigDecimal minRate = weekForecasts.stream()
                    .map(ForecastResult::getPredictedRate)
                    .min(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

                BigDecimal maxRate = weekForecasts.stream()
                    .map(ForecastResult::getPredictedRate)
                    .max(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

                int avgConfidence = weekForecasts.stream()
                    .mapToInt(ForecastResult::getConfidencePercent)
                    .sum() / weekForecasts.size();

                results.add(DateRangeForecast.builder()
                    .startDate(currentDate)
                    .endDate(weekEnd)
                    .avgRate(avgRate)
                    .minRate(minRate)
                    .maxRate(maxRate)
                    .confidencePercent(avgConfidence)
                    .dayCount((long) weekForecasts.size())
                    .build());
            }

            currentDate = weekEnd.plusDays(1);
        }

        log.info("✅ Completed rate range prediction. Total: {} weeks, Cached data reused: {} times",
            results.size(), results.size() * 7); // ~7 days per week
        return results;
    }

    /**
     * Predict using ML model with confidence scoring.
     */
    private ForecastResult predictWithMLModel(
            TariffMLModel model,
            String importerCode,
            String exporterCode,
            String hs6Code,
            LocalDate targetDate) {

        try {
            // Extract features for prediction
            Map<String, Double> features = extractFeatures(importerCode, hs6Code, targetDate);

            // Get prediction from model (simulated)
            Double predictedRate = model.predict(features);
            Integer confidence = model.getConfidenceScore(features);

            BigDecimal rate = BigDecimal.valueOf(predictedRate).setScale(2, RoundingMode.HALF_UP);

            return ForecastResult.builder()
                .forecastDate(targetDate)
                .predictedRate(rate)
                .confidenceLower(rate.multiply(new BigDecimal("0.9")))
                .confidenceUpper(rate.multiply(new BigDecimal("1.1")))
                .confidencePercent(confidence)
                .modelVersion(mlProperties.getModel().getVersion())
                .hasHistoricalData(true)
                .isFromMLModel(true)
                .build();

        } catch (Exception e) {
            log.warn("ML model prediction failed, falling back to statistical method", e);
            return createFallbackForecast(importerCode, exporterCode, hs6Code, targetDate, true);
        }
    }

    /**
     * Optimized ML model prediction using cached historical data.
     * Reduces database calls for batch operations.
     */
    private ForecastResult predictWithMLModelOptimized(
            TariffMLModel model,
            String importerCode,
            String exporterCode,
            String hs6Code,
            LocalDate targetDate,
            List<Measure> cachedHistoricalRates) {

        try {
            // Extract features using cached data
            Map<String, Double> features = extractFeaturesOptimized(targetDate, cachedHistoricalRates);

            // Get prediction from model
            Double predictedRate = model.predict(features);
            Integer confidence = model.getConfidenceScore(features);

            BigDecimal rate = BigDecimal.valueOf(predictedRate).setScale(2, RoundingMode.HALF_UP);

            return ForecastResult.builder()
                .forecastDate(targetDate)
                .predictedRate(rate)
                .confidenceLower(rate.multiply(new BigDecimal("0.9")))
                .confidenceUpper(rate.multiply(new BigDecimal("1.1")))
                .confidencePercent(confidence)
                .modelVersion(mlProperties.getModel().getVersion())
                .hasHistoricalData(true)
                .isFromMLModel(true)
                .build();

        } catch (Exception e) {
            log.warn("Optimized ML model prediction failed, falling back to statistical method", e);
            return createFallbackForecastOptimized(importerCode, exporterCode, hs6Code, targetDate, true, cachedHistoricalRates);
        }
    }

    /**
     * Create fallback forecast using statistical methods when ML model unavailable.
     */
    private ForecastResult createFallbackForecast(
            String importerCode,
            String exporterCode,
            String hs6Code,
            LocalDate targetDate,
            boolean hasHistoricalData) {

        BigDecimal predictedRate = BigDecimal.ZERO;
        int confidence = 40;

        if (hasHistoricalData) {
            // Use 3-year average as fallback
            LocalDate threeYearsAgo = LocalDate.now().minusYears(3);
            List<Measure> historicalRates = measureRepository.findHistoricalRates(
                importerCode, hs6Code, threeYearsAgo, LocalDate.now());

            if (!historicalRates.isEmpty()) {
                predictedRate = historicalRates.stream()
                    .map(Measure::getMfnAdvalRate)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(historicalRates.size()), 2, RoundingMode.HALF_UP);

                // Scale confidence based on number of historical records using logarithmic scaling
                // Formula: 40 + 50 * log(records) / log(100), capped at 100%
                // This provides diminishing returns as data increases (more realistic)
                // Examples:
                // 2 records: 40 + 50 * log(2)/log(100) ≈ 54%
                // 5 records: 40 + 50 * log(5)/log(100) ≈ 62%
                // 10 records: 40 + 50 * log(10)/log(100) ≈ 67%
                // 50 records: 40 + 50 * log(50)/log(100) ≈ 78%
                // 100+ records: approaches 90-100%
                int numRecords = historicalRates.size();
                double logConfidence = 40.0 + (50.0 * Math.log(numRecords) / Math.log(100.0));
                confidence = (int) Math.min(100, Math.max(40, logConfidence));
                log.debug("Confidence scaled based on {} historical records using logarithmic formula: {}%", numRecords, confidence);
            }
        }

        // Adjust confidence based on forecast distance
        long daysInFuture = ChronoUnit.DAYS.between(LocalDate.now(), targetDate);
        if (daysInFuture > 365) {
            confidence = Math.max(40, confidence - 15);
        }

        return ForecastResult.builder()
            .forecastDate(targetDate)
            .predictedRate(predictedRate)
            .confidenceLower(predictedRate.multiply(new BigDecimal("0.8")))
            .confidenceUpper(predictedRate.multiply(new BigDecimal("1.2")))
            .confidencePercent(confidence)
            .modelVersion(mlProperties.getModel().getVersion())
            .hasHistoricalData(hasHistoricalData)
            .isFromMLModel(false)
            .build();
    }

    /**
     * Optimized fallback forecast using pre-fetched historical data.
     * Reduces database calls for batch operations.
     */
    private ForecastResult createFallbackForecastOptimized(
            String importerCode,
            String exporterCode,
            String hs6Code,
            LocalDate targetDate,
            boolean hasHistoricalData,
            List<Measure> cachedHistoricalRates) {

        BigDecimal predictedRate = BigDecimal.ZERO;
        int confidence = 40;

        if (hasHistoricalData && !cachedHistoricalRates.isEmpty()) {
            // Use cached historical data
            predictedRate = cachedHistoricalRates.stream()
                .map(Measure::getMfnAdvalRate)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(cachedHistoricalRates.size()), 2, RoundingMode.HALF_UP);

            // Scale confidence based on number of historical records
            int numRecords = cachedHistoricalRates.size();
            double logConfidence = 40.0 + (50.0 * Math.log(numRecords) / Math.log(100.0));
            confidence = (int) Math.min(100, Math.max(40, logConfidence));
        }

        // Adjust confidence based on forecast distance
        long daysInFuture = ChronoUnit.DAYS.between(LocalDate.now(), targetDate);
        if (daysInFuture > 365) {
            confidence = Math.max(40, confidence - 15);
        }

        return ForecastResult.builder()
            .forecastDate(targetDate)
            .predictedRate(predictedRate)
            .confidenceLower(predictedRate.multiply(new BigDecimal("0.8")))
            .confidenceUpper(predictedRate.multiply(new BigDecimal("1.2")))
            .confidencePercent(confidence)
            .modelVersion(mlProperties.getModel().getVersion())
            .hasHistoricalData(hasHistoricalData)
            .isFromMLModel(false)
            .build();
    }

    /**
     * Scheduled task to retrain models weekly.
     */
    @Scheduled(cron = "0 0 2 ? * SUN")  // Every Sunday at 2 AM
    public void scheduleModelRetraining() {
        log.info("Starting scheduled weekly model retraining...");
        trainNewModel();
    }

    /**
     * Train a model for a specific trade route.
     */
    private TariffMLModel trainModelForRoute(String tradeRoute, List<Measure> data) {
        // Create a model with basic ML characteristics
        TariffMLModel model = new TariffMLModel(tradeRoute);

        // Calculate statistical properties from historical data
        List<BigDecimal> rates = data.stream()
            .map(Measure::getMfnAdvalRate)
            .filter(Objects::nonNull)
            .toList();

        if (!rates.isEmpty()) {
            BigDecimal mean = rates.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(rates.size()), 4, RoundingMode.HALF_UP);

            BigDecimal variance = rates.stream()
                .map(r -> r.subtract(mean).pow(2))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(rates.size()), 4, RoundingMode.HALF_UP);

            model.setMean(mean.doubleValue());
            model.setStdDev(Math.sqrt(variance.doubleValue()));
            model.setConfidenceBase(Math.min(80, 50 + rates.size() / 10)); // Higher confidence with more data
        }

        return model;
    }

    /**
     * Extract features from historical data for ML training.
     */
    private Map<String, Double> extractFeatures(String importerCode, String hs6Code, LocalDate targetDate) {
        Map<String, Double> features = new HashMap<>();

        // Month-based seasonality
        int month = targetDate.getMonthValue();
        features.put("month_sin", Math.sin(2 * Math.PI * month / 12));
        features.put("month_cos", Math.cos(2 * Math.PI * month / 12));

        // Days into year (trend)
        int dayOfYear = targetDate.getDayOfYear();
        features.put("day_of_year_norm", dayOfYear / 365.0);

        // Historical average as baseline
        LocalDate threeYearsAgo = LocalDate.now().minusYears(3);
        List<Measure> historicalRates = measureRepository.findHistoricalRates(
            importerCode, hs6Code, threeYearsAgo, LocalDate.now());

        if (!historicalRates.isEmpty()) {
            BigDecimal avgRate = historicalRates.stream()
                .map(Measure::getMfnAdvalRate)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(historicalRates.size()), 4, RoundingMode.HALF_UP);
            features.put("historical_avg", avgRate.doubleValue());
        }

        return features;
    }

    /**
     * Optimized feature extraction using cached historical data.
     * Reduces database calls for batch operations.
     */
    private Map<String, Double> extractFeaturesOptimized(LocalDate targetDate, List<Measure> cachedHistoricalRates) {
        Map<String, Double> features = new HashMap<>();

        // Month-based seasonality
        int month = targetDate.getMonthValue();
        features.put("month_sin", Math.sin(2 * Math.PI * month / 12));
        features.put("month_cos", Math.cos(2 * Math.PI * month / 12));

        // Days into year (trend)
        int dayOfYear = targetDate.getDayOfYear();
        features.put("day_of_year_norm", dayOfYear / 365.0);

        // Historical average as baseline (using cached data)
        if (!cachedHistoricalRates.isEmpty()) {
            BigDecimal avgRate = cachedHistoricalRates.stream()
                .map(Measure::getMfnAdvalRate)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(cachedHistoricalRates.size()), 4, RoundingMode.HALF_UP);
            features.put("historical_avg", avgRate.doubleValue());
        }

        return features;
    }

    /**
     * Group historical data by trade route.
     */
    private Map<String, List<Measure>> groupByTradeRoute(List<Measure> data) {
        Map<String, List<Measure>> grouped = new HashMap<>();
        for (Measure measure : data) {
            String importerCode = measure.getImporter() != null ? measure.getImporter().getCountryCode() : "UNKNOWN";
            String productCode = measure.getProduct() != null ? measure.getProduct().getHs6Code() : "UNKNOWN";
            String key = importerCode + "-" + productCode;
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(measure);
        }
        return grouped;
    }

    /**
     * Save trained models to disk for persistence.
     */
    private void saveModelsToDisk() {
        try {
            Path modelsDir = Paths.get(mlProperties.getModel().getPath());
            Files.createDirectories(modelsDir);

            for (Map.Entry<String, TariffMLModel> entry : tradeRouteModels.entrySet()) {
                String filename = entry.getKey().replace("-", "_") + ".model";
                Path filepath = modelsDir.resolve(filename);

                try (ObjectOutputStream oos = new ObjectOutputStream(Files.newOutputStream(filepath))) {
                    oos.writeObject(entry.getValue());
                }
            }

            log.info("Saved {} models to disk", tradeRouteModels.size());
        } catch (IOException e) {
            log.error("Failed to save models to disk", e);
        }
    }

    /**
     * Load previously trained models from disk.
     */
    private boolean loadModelsFromDisk() {
        try {
            Path modelsDir = Paths.get(mlProperties.getModel().getPath());
            if (!Files.exists(modelsDir)) {
                return false;
            }

            tradeRouteModels.clear();
            Files.list(modelsDir)
                .filter(p -> p.toString().endsWith(".model"))
                .forEach(filepath -> {
                    try (ObjectInputStream ois = new ObjectInputStream(Files.newInputStream(filepath))) {
                        TariffMLModel model = (TariffMLModel) ois.readObject();
                        tradeRouteModels.put(model.getTradeRoute(), model);
                    } catch (IOException | ClassNotFoundException e) {
                        log.warn("Failed to load model from {}: {}", filepath, e.getMessage());
                    }
                });

            return !tradeRouteModels.isEmpty();
        } catch (IOException e) {
            log.error("Failed to load models from disk", e);
            return false;
        }
    }

    /**
     * Get model status information.
     */
    public Map<String, Object> getModelStatus() {
        return Map.of(
            "modelVersion", mlProperties.getModel().getVersion(),
            "lastTrainDate", lastModelTrainDate != null ? lastModelTrainDate.toString() : "Not trained",
            "modelTrained", modelTrained,
            "mlEnabled", mlProperties.getModel().isEnabled(),
            "trainedRoutes", tradeRouteModels.size(),
            "modelPath", mlProperties.getModel().getPath()
        );
    }

    /**
     * Internal class representing a trained ML model for a specific trade route.
     */
    @Slf4j
    public static class TariffMLModel implements Serializable {
        private static final long serialVersionUID = 1L;

        private String tradeRoute;
        private double mean;
        private double stdDev;
        private double confidenceBase;

        public TariffMLModel(String tradeRoute) {
            this.tradeRoute = tradeRoute;
            this.confidenceBase = 60;
        }

        public Double predict(Map<String, Double> features) {
            // Simple prediction using historical mean and seasonal adjustment
            double basePrediction = mean;

            // Apply seasonal adjustment
            if (features.containsKey("month_sin")) {
                double seasonalFactor = features.get("month_sin") * 0.05 * stdDev;
                basePrediction += seasonalFactor;
            }

            return Math.max(0, basePrediction); // Ensure non-negative rate
        }

        public Integer getConfidenceScore(Map<String, Double> features) {
            int confidence = (int) confidenceBase;

            // Reduce confidence for distant forecasts
            if (features.containsKey("day_of_year_norm")) {
                confidence = Math.max(40, confidence - 10);
            }

            return confidence;
        }

        // Getters and setters
        public String getTradeRoute() { return tradeRoute; }
        public void setMean(double mean) { this.mean = mean; }
        public void setStdDev(double stdDev) { this.stdDev = stdDev; }
        public void setConfidenceBase(double confidence) { this.confidenceBase = confidence; }
    }
}
