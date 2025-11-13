package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.config.MLModelProperties;
import com.verbosegarbonzo.tariff.model.*;
import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TariffMLServiceTest {

    @Mock
    private MeasureRepository measureRepository;

    @Spy
    private MLModelProperties mlProperties;

    @InjectMocks
    private TariffMLService tariffMLService;

    @TempDir
    Path tempDir;

    private Country testImporter;
    private Country testExporter;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        // Set up test countries and products
        testImporter = new Country();
        testImporter.setCountryCode("USA");
        testImporter.setName("United States");

        testExporter = new Country();
        testExporter.setCountryCode("CHN");
        testExporter.setName("China");

        testProduct = new Product();
        testProduct.setHs6Code("123456");
        testProduct.setDescription("Test Product");

        // Configure ML properties
        mlProperties.getModel().setEnabled(true);
        mlProperties.getModel().setPath(tempDir.toString());
        mlProperties.getModel().setVersion("1.0.0");
        mlProperties.getModel().setMinTrainingSamples(30);
    }

    @Test
    void initializeModel_Success_CreatesModelsDirectory() {
        // When
        tariffMLService.initializeModel();

        // Then
        assertThat(tempDir).exists();
        verify(mlProperties, atLeastOnce()).getModel();
    }

    @Test
    void initializeModel_MLDisabled_DoesNotLoadModels() {
        // Given
        mlProperties.getModel().setEnabled(false);

        // When
        tariffMLService.initializeModel();

        // Then
        assertThat(tariffMLService.getModelStatus())
            .containsEntry("mlEnabled", false)
            .containsEntry("modelTrained", false);
    }

    @Test
    void trainNewModel_WithSufficientData_TrainsModelsSuccessfully() {
        // Given
        List<Measure> historicalData = createHistoricalData(50);
        when(measureRepository.findAll()).thenReturn(historicalData);

        // When
        tariffMLService.trainNewModel();

        // Then
        Map<String, Object> status = tariffMLService.getModelStatus();
        assertThat(status)
            .containsEntry("modelTrained", true)
            .extracting("trainedRoutes")
            .satisfies(routes -> assertThat((Integer) routes).isGreaterThan(0));
    }

    @Test
    void trainNewModel_WithInsufficientData_DoesNotTrainModels() {
        // Given - Less than minTrainingSamples (30)
        List<Measure> historicalData = createHistoricalData(10);
        when(measureRepository.findAll()).thenReturn(historicalData);

        // When
        tariffMLService.trainNewModel();

        // Then
        Map<String, Object> status = tariffMLService.getModelStatus();
        assertThat(status)
            .containsEntry("modelTrained", false)
            .containsEntry("trainedRoutes", 0);
    }

    @Test
    void trainNewModel_WithNoData_DoesNotTrainModels() {
        // Given
        when(measureRepository.findAll()).thenReturn(Collections.emptyList());

        // When
        tariffMLService.trainNewModel();

        // Then
        Map<String, Object> status = tariffMLService.getModelStatus();
        assertThat(status)
            .containsEntry("modelTrained", false)
            .containsEntry("trainedRoutes", 0);
    }

    @Test
    void trainNewModel_MLDisabled_SkipsTraining() {
        // Given
        mlProperties.getModel().setEnabled(false);

        // When
        tariffMLService.trainNewModel();

        // Then
        verify(measureRepository, never()).findAll();
    }

    @Test
    void predictTariffRate_WithHistoricalData_ReturnsPrediction() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now().plusMonths(6);

        when(measureRepository.countHistoricalRecords(importerCode, hs6Code)).thenReturn(10L);
        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createHistoricalData(10));

        // When
        ForecastResult result = tariffMLService.predictTariffRate(importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getForecastDate()).isEqualTo(targetDate);
        assertThat(result.getPredictedRate()).isNotNull();
        assertThat(result.getConfidencePercent()).isBetween(40, 100);
        assertThat(result.getHasHistoricalData()).isTrue();
    }

    @Test
    void predictTariffRate_WithNoHistoricalData_ReturnsFallbackPrediction() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "999999";
        LocalDate targetDate = LocalDate.now().plusMonths(3);

        when(measureRepository.countHistoricalRecords(importerCode, hs6Code)).thenReturn(0L);

        // When
        ForecastResult result = tariffMLService.predictTariffRate(importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getPredictedRate()).isEqualTo(BigDecimal.ZERO);
        assertThat(result.getConfidencePercent()).isEqualTo(40);
        assertThat(result.getHasHistoricalData()).isFalse();
        assertThat(result.getIsFromMLModel()).isFalse();
    }

    @Test
    void predictTariffRate_WithTrainedModel_UsesMLModel() {
        // Given
        tariffMLService.initializeModel();
        List<Measure> historicalData = createHistoricalData(50);
        when(measureRepository.findAll()).thenReturn(historicalData);
        tariffMLService.trainNewModel();

        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now().plusMonths(6);

        when(measureRepository.countHistoricalRecords(importerCode, hs6Code)).thenReturn(50L);
        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(historicalData);

        // When
        ForecastResult result = tariffMLService.predictTariffRate(importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsFromMLModel()).isTrue();
        assertThat(result.getModelVersion()).isEqualTo("1.0.0");
    }

    @Test
    void predictTariffRate_FarFuture_ReducesConfidence() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate farFuture = LocalDate.now().plusYears(2);

        when(measureRepository.countHistoricalRecords(importerCode, hs6Code)).thenReturn(10L);
        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createHistoricalData(10));

        // When
        ForecastResult result = tariffMLService.predictTariffRate(importerCode, exporterCode, hs6Code, farFuture);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getConfidencePercent()).isLessThanOrEqualTo(90); // Reduced for distant future
    }

    @Test
    void predictRateRange_ReturnsWeeklyForecasts() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(3);

        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createHistoricalData(50));

        // When
        List<DateRangeForecast> results = tariffMLService.predictRateRange(
            importerCode, exporterCode, hs6Code, startDate, endDate);

        // Then
        assertThat(results).isNotEmpty();
        assertThat(results).allSatisfy(forecast -> {
            assertThat(forecast.getStartDate()).isNotNull();
            assertThat(forecast.getEndDate()).isNotNull();
            assertThat(forecast.getAvgRate()).isNotNull();
            assertThat(forecast.getMinRate()).isNotNull();
            assertThat(forecast.getMaxRate()).isNotNull();
            assertThat(forecast.getConfidencePercent()).isBetween(40, 100);
            assertThat(forecast.getDayCount()).isGreaterThan(0);
        });
    }

    @Test
    void predictRateRange_TrainsModelsOnFirstRequest() {
        // Given
        mlProperties.getModel().setEnabled(true);
        tariffMLService.initializeModel();

        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(1);

        List<Measure> historicalData = createHistoricalData(50);
        when(measureRepository.findAll()).thenReturn(historicalData);
        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(historicalData);

        // When
        List<DateRangeForecast> results = tariffMLService.predictRateRange(
            importerCode, exporterCode, hs6Code, startDate, endDate);

        // Then
        assertThat(results).isNotEmpty();
        verify(measureRepository).findAll(); // Training should have been triggered
        assertThat(tariffMLService.getModelStatus())
            .containsEntry("modelTrained", true);
    }

    @Test
    void predictRateRange_AggregatesWeeklyData() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 1, 21); // 3 weeks

        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createHistoricalData(20));

        // When
        List<DateRangeForecast> results = tariffMLService.predictRateRange(
            importerCode, exporterCode, hs6Code, startDate, endDate);

        // Then
        assertThat(results).hasSize(3); // 3 weeks
        assertThat(results).allSatisfy(forecast -> {
            assertThat(forecast.getMinRate()).isLessThanOrEqualTo(forecast.getAvgRate());
            assertThat(forecast.getAvgRate()).isLessThanOrEqualTo(forecast.getMaxRate());
        });
    }

    @Test
    void getModelStatus_ReturnsCorrectInformation() {
        // Given
        tariffMLService.initializeModel();

        // When
        Map<String, Object> status = tariffMLService.getModelStatus();

        // Then
        assertThat(status)
            .containsKeys("modelVersion", "lastTrainDate", "modelTrained", "mlEnabled", "trainedRoutes", "modelPath")
            .containsEntry("modelVersion", "1.0.0")
            .containsEntry("mlEnabled", true)
            .containsEntry("modelPath", tempDir.toString());
    }

    @Test
    void scheduleModelRetraining_TriggersTraining() {
        // Given
        List<Measure> historicalData = createHistoricalData(50);
        when(measureRepository.findAll()).thenReturn(historicalData);

        // When
        tariffMLService.scheduleModelRetraining();

        // Then
        verify(measureRepository).findAll();
        assertThat(tariffMLService.getModelStatus())
            .extracting("modelTrained")
            .isEqualTo(true);
    }

    @Test
    void tariffMLModel_Predict_ReturnsNonNegativeRate() {
        // Given
        TariffMLService.TariffMLModel model = new TariffMLService.TariffMLModel("USA-123456");
        model.setMean(0.10);
        model.setStdDev(0.02);
        model.setConfidenceBase(75);

        Map<String, Double> features = new HashMap<>();
        features.put("month_sin", 0.5);
        features.put("month_cos", 0.866);
        features.put("day_of_year_norm", 0.5);
        features.put("historical_avg", 0.10);

        // When
        Double prediction = model.predict(features);

        // Then
        assertThat(prediction).isNotNull();
        assertThat(prediction).isGreaterThanOrEqualTo(0.0);
    }

    @Test
    void tariffMLModel_GetConfidenceScore_ReturnsValidScore() {
        // Given
        TariffMLService.TariffMLModel model = new TariffMLService.TariffMLModel("USA-123456");
        model.setConfidenceBase(70);

        Map<String, Double> features = new HashMap<>();
        features.put("day_of_year_norm", 0.75);

        // When
        Integer confidence = model.getConfidenceScore(features);

        // Then
        assertThat(confidence).isNotNull();
        assertThat(confidence).isBetween(40, 100);
    }

    @Test
    void tariffMLModel_Serializable_CanBeSerializedAndDeserialized() throws Exception {
        // Given
        TariffMLService.TariffMLModel model = new TariffMLService.TariffMLModel("USA-123456");
        model.setMean(0.12);
        model.setStdDev(0.03);
        model.setConfidenceBase(80);

        // When - Serialize
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        try (java.io.ObjectOutputStream oos = new java.io.ObjectOutputStream(baos)) {
            oos.writeObject(model);
        }

        // Then - Deserialize
        java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(baos.toByteArray());
        TariffMLService.TariffMLModel deserializedModel;
        try (java.io.ObjectInputStream ois = new java.io.ObjectInputStream(bais)) {
            deserializedModel = (TariffMLService.TariffMLModel) ois.readObject();
        }

        assertThat(deserializedModel).isNotNull();
        assertThat(deserializedModel.getTradeRoute()).isEqualTo("USA-123456");
    }

    @Test
    void predictTariffRate_WithManyHistoricalRecords_HigherConfidence() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now().plusMonths(3);

        when(measureRepository.countHistoricalRecords(importerCode, hs6Code)).thenReturn(100L);
        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createHistoricalData(100));

        // When
        ForecastResult result = tariffMLService.predictTariffRate(importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(result.getConfidencePercent()).isGreaterThan(70); // Higher confidence with more data
    }

    @Test
    void predictTariffRate_WithFewHistoricalRecords_LowerConfidence() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now().plusMonths(3);

        when(measureRepository.countHistoricalRecords(importerCode, hs6Code)).thenReturn(3L);
        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createHistoricalData(3));

        // When
        ForecastResult result = tariffMLService.predictTariffRate(importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(result.getConfidencePercent()).isLessThanOrEqualTo(60); // Lower confidence with less data
    }

    @Test
    void trainNewModel_WithMultipleTradeRoutes_TrainsMultipleModels() {
        // Given
        List<Measure> historicalData = new ArrayList<>();
        historicalData.addAll(createHistoricalDataForRoute("USA", "123456", 40));
        historicalData.addAll(createHistoricalDataForRoute("DEU", "654321", 35));
        historicalData.addAll(createHistoricalDataForRoute("GBR", "789012", 32));

        when(measureRepository.findAll()).thenReturn(historicalData);

        // When
        tariffMLService.trainNewModel();

        // Then
        Map<String, Object> status = tariffMLService.getModelStatus();
        assertThat((Integer) status.get("trainedRoutes")).isEqualTo(3);
        assertThat((Boolean) status.get("modelTrained")).isTrue();
    }

    @Test
    void predictRateRange_EmptyDateRange_ReturnsEmptyList() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate; // Same date

        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createHistoricalData(10));

        // When
        List<DateRangeForecast> results = tariffMLService.predictRateRange(
            importerCode, exporterCode, hs6Code, startDate, endDate);

        // Then
        assertThat(results).isEmpty();
    }

    // Helper methods

    private List<Measure> createHistoricalData(int count) {
        return createHistoricalDataForRoute("USA", "123456", count);
    }

    private List<Measure> createHistoricalDataForRoute(String importerCode, String hs6Code, int count) {
        List<Measure> data = new ArrayList<>();
        LocalDate startDate = LocalDate.now().minusYears(2);

        Country importer = new Country();
        importer.setCountryCode(importerCode);

        Product product = new Product();
        product.setHs6Code(hs6Code);

        for (int i = 0; i < count; i++) {
            Measure measure = new Measure();
            measure.setImporter(importer);
            measure.setProduct(product);
            measure.setMfnAdvalRate(new BigDecimal("0.10").add(
                new BigDecimal(Math.random() * 0.05)));
            measure.setValidFrom(startDate.plusDays(i * 7));
            measure.setValidTo(startDate.plusDays((i + 1) * 7));
            data.add(measure);
        }

        return data;
    }
}
