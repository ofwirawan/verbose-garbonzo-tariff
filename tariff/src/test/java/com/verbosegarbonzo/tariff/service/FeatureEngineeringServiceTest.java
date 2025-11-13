package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.*;
import com.verbosegarbonzo.tariff.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeatureEngineeringServiceTest {

    @Mock
    private MeasureRepository measureRepository;

    @Mock
    private PreferenceRepository preferenceRepository;

    @Mock
    private SuspensionRepository suspensionRepository;

    @InjectMocks
    private FeatureEngineeringService featureEngineeringService;

    private Country testImporter;
    private Country testExporter;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testImporter = Country.builder()
            .countryCode("USA")
            .name("United States")
            .numericCode("840")
            .city("Washington")
            .build();

        testExporter = Country.builder()
            .countryCode("CHN")
            .name("China")
            .numericCode("156")
            .city("Beijing")
            .build();

        testProduct = new Product();
        testProduct.setHs6Code("123456");
        testProduct.setDescription("Test Product");
    }

    @Test
    void extractFeatures_WithValidData_ReturnsCompleteFeatures() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.of(2025, 6, 15);

        when(measureRepository.findHistoricalRates(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createTestMeasures(10));
        when(preferenceRepository.findHistoricalPreferences(eq(importerCode), eq(exporterCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createTestPreferences(3));
        when(suspensionRepository.findHistoricalSuspensions(eq(importerCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        // When
        TariffFeatures features = featureEngineeringService.extractFeatures(
            importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(features).isNotNull();
        assertThat(features.getYear()).isEqualTo(2025);
        assertThat(features.getQuarter()).isEqualTo(2); // June is Q2
        assertThat(features.getMonth()).isEqualTo(6);
        assertThat(features.getDayOfYear()).isEqualTo(targetDate.getDayOfYear());
        assertThat(features.getDaysSinceEpoch()).isNotNull();
    }

    @Test
    void extractFeatures_CalculatesTemporalFeatures() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.of(2025, 12, 25); // Q4

        when(measureRepository.findHistoricalRates(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createTestMeasures(5));
        when(preferenceRepository.findHistoricalPreferences(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());
        when(suspensionRepository.findHistoricalSuspensions(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        // When
        TariffFeatures features = featureEngineeringService.extractFeatures(
            importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(features.getYear()).isEqualTo(2025);
        assertThat(features.getQuarter()).isEqualTo(4); // December is Q4
        assertThat(features.getMonth()).isEqualTo(12);
        assertThat(features.getDayOfYear()).isEqualTo(359); // Dec 25 is day 359 in 2025
    }

    @Test
    void extractFeatures_CalculatesAverageRates() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now();

        List<Measure> measures = createTestMeasures(20);
        when(measureRepository.findHistoricalRates(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(measures);
        when(preferenceRepository.findHistoricalPreferences(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());
        when(suspensionRepository.findHistoricalSuspensions(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        // When
        TariffFeatures features = featureEngineeringService.extractFeatures(
            importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(features.getAvgRateLast3Years()).isNotNull();
        assertThat(features.getAvgRateLast5Years()).isNotNull();
        assertThat(features.getAvgRateLast3Years()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    void extractFeatures_CalculatesVolatility() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now();

        List<Measure> measures = createTestMeasuresWithVariation();
        when(measureRepository.findHistoricalRates(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(measures);
        when(preferenceRepository.findHistoricalPreferences(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());
        when(suspensionRepository.findHistoricalSuspensions(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        // When
        TariffFeatures features = featureEngineeringService.extractFeatures(
            importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(features.getRateVolatility()).isNotNull();
        assertThat(features.getRateVolatility()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    void extractFeatures_CalculatesTrendDirection() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now();

        List<Measure> measures = createTestMeasuresWithTrend();
        when(measureRepository.findHistoricalRates(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(measures);
        when(preferenceRepository.findHistoricalPreferences(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());
        when(suspensionRepository.findHistoricalSuspensions(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        // When
        TariffFeatures features = featureEngineeringService.extractFeatures(
            importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(features.getTrendDirection()).isIn(-1, 0, 1);
    }

    @Test
    void extractFeatures_WithPreferences_SetsHasPreferenceTrue() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now();

        when(measureRepository.findHistoricalRates(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createTestMeasures(5));
        when(preferenceRepository.findHistoricalPreferences(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createTestPreferences(2));
        when(suspensionRepository.findHistoricalSuspensions(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        // When
        TariffFeatures features = featureEngineeringService.extractFeatures(
            importerCode, exporterCode, hs6Code, targetDate);

        // Then
        assertThat(features.getHasPreference()).isTrue();
        assertThat(features.getYearsSinceFTA()).isNotNull();
    }

    @Test
    void extractFeatures_WithNoExporterCode_SkipsPreferenceQuery() {
        // Given
        String importerCode = "USA";
        String exporterCode = null;
        String hs6Code = "123456";
        LocalDate targetDate = LocalDate.now();

        when(measureRepository.findHistoricalRates(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(createTestMeasures(5));
        when(suspensionRepository.findHistoricalSuspensions(any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        // When
        TariffFeatures features = featureEngineeringService.extractFeatures(
            importerCode, exporterCode, hs6Code, targetDate);

        // Then
        verify(preferenceRepository, never()).findHistoricalPreferences(any(), any(), any(), any(), any());
        assertThat(features.getHasPreference()).isFalse();
    }

    // Helper methods

    private List<Measure> createTestMeasures(int count) {
        List<Measure> measures = new ArrayList<>();
        LocalDate startDate = LocalDate.now().minusYears(3);

        for (int i = 0; i < count; i++) {
            measures.add(Measure.builder()
                .measureId(i + 1)
                .importer(testImporter)
                .product(testProduct)
                .mfnAdvalRate(new BigDecimal("0.10"))
                .validFrom(startDate.plusMonths(i * 3L))
                .validTo(startDate.plusMonths((i + 1) * 3L))
                .build());
        }

        return measures;
    }

    private List<Measure> createTestMeasuresWithVariation() {
        List<Measure> measures = new ArrayList<>();
        BigDecimal[] rates = {
            new BigDecimal("0.05"),
            new BigDecimal("0.10"),
            new BigDecimal("0.15"),
            new BigDecimal("0.08"),
            new BigDecimal("0.12")
        };

        LocalDate startDate = LocalDate.now().minusYears(2);

        for (int i = 0; i < rates.length; i++) {
            measures.add(Measure.builder()
                .measureId(i + 1)
                .importer(testImporter)
                .product(testProduct)
                .mfnAdvalRate(rates[i])
                .validFrom(startDate.plusMonths(i * 4L))
                .validTo(startDate.plusMonths((i + 1) * 4L))
                .build());
        }

        return measures;
    }

    private List<Measure> createTestMeasuresWithTrend() {
        List<Measure> measures = new ArrayList<>();
        LocalDate startDate = LocalDate.now().minusYears(2);

        // Create increasing trend
        for (int i = 0; i < 10; i++) {
            measures.add(Measure.builder()
                .measureId(i + 1)
                .importer(testImporter)
                .product(testProduct)
                .mfnAdvalRate(new BigDecimal("0.05").add(new BigDecimal(i * 0.01)))
                .validFrom(startDate.plusMonths(i * 2L))
                .validTo(startDate.plusMonths((i + 1) * 2L))
                .build());
        }

        return measures;
    }

    private List<Preference> createTestPreferences(int count) {
        List<Preference> preferences = new ArrayList<>();
        LocalDate startDate = LocalDate.now().minusYears(2);

        for (int i = 0; i < count; i++) {
            Preference pref = new Preference();
            pref.setImporter(testImporter);
            pref.setExporter(testExporter);
            pref.setProduct(testProduct);
            pref.setPrefAdValRate(new BigDecimal("0.05"));
            pref.setValidFrom(startDate.plusMonths(i * 6L));
            preferences.add(pref);
        }

        return preferences;
    }
}
