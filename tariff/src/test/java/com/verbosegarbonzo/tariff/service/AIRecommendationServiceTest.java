package com.verbosegarbonzo.tariff.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.verbosegarbonzo.tariff.model.AIRecommendationResponse;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.DateRangeForecast;
import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.model.ProfileType;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
class AIRecommendationServiceTest {

    @Mock
    private TariffMLService mlService;

    @Mock
    private MeasureRepository measureRepository;

    @Mock
    private CountryRepository countryRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private AIRecommendationService aiRecommendationService;

    private Country testCountry;
    private Product testProduct;
    private Measure testMeasure;

    @BeforeEach
    void setUp() {
        testCountry = Country.builder()
            .countryCode("USA")
            .name("United States")
            .numericCode("840")
            .city("Washington")
            .build();

        testProduct = new Product();
        testProduct.setHs6Code("123456");
        testProduct.setDescription("Test Product");

        testMeasure = Measure.builder()
            .measureId(1)
            .importer(testCountry)
            .product(testProduct)
            .mfnAdvalRate(new BigDecimal("0.10"))
            .validFrom(LocalDate.now().minusYears(1))
            .validTo(LocalDate.now().plusYears(1))
            .build();
    }

    @Test
    void getTimingRecommendation_WithValidData_ReturnsRecommendations() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createTestForecasts();
        when(mlService.predictRateRange(eq(importerCode), eq(exporterCode), eq(hs6Code), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getExplanation()).isNotEmpty();
        assertThat(response.getCurrentRate()).isEqualByComparingTo(new BigDecimal("0.10"));
        assertThat(response.getAverageConfidence()).isBetween(40, 100);
        assertThat(response.getModelVersion()).isEqualTo("1.0.0");
        assertThat(response.getHasInsufficientData()).isFalse();
    }

    @Test
    void getTimingRecommendation_BusinessOwner_PersonalizedExplanation() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createTestForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getExplanation())
            .contains("Based on historical tariff data analysis")
            .contains("maximize cost efficiency");
    }

    @Test
    void getTimingRecommendation_PolicyAnalyst_PersonalizedExplanation() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.POLICY_ANALYST;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createTestForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getExplanation())
            .contains("Historical tariff analysis")
            .contains("policy discussions");
    }

    @Test
    void getTimingRecommendation_Student_PersonalizedExplanation() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.STUDENT;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createTestForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getExplanation())
            .contains("Educational insight")
            .contains("macroeconomic factors");
    }

    @Test
    void getTimingRecommendation_WithNoForecasts_ReturnsEmptyResponse() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getHasInsufficientData()).isTrue();
        assertThat(response.getExplanation()).contains("Insufficient historical data");
        assertThat(response.getOptimalPeriods()).isEmpty();
        assertThat(response.getAvoidPeriods()).isEmpty();
        assertThat(response.getAverageConfidence()).isEqualTo(30);
    }

    @Test
    void getTimingRecommendation_WithException_ReturnsErrorResponse() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenThrow(new RuntimeException("Database error"));

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getHasInsufficientData()).isTrue();
        assertThat(response.getExplanation()).contains("Insufficient historical data available for this trade route");
        assertThat(response.getCurrentRate()).isEqualByComparingTo(new BigDecimal(5));
        assertThat(response.getAverageConfidence()).isEqualTo(30);
    }

    @Test
    void getTimingRecommendation_WithNoCurrentRate_UsesDefault() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "999999";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.empty());
        when(productRepository.findById(hs6Code)).thenReturn(Optional.empty());

        List<DateRangeForecast> forecasts = createTestForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getCurrentRate()).isEqualByComparingTo(new BigDecimal("5.0")); // Default rate
    }

    @Test
    void getTimingRecommendation_FindsOptimalPeriods() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createVariedForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getOptimalPeriods()).isNotEmpty();
        assertThat(response.getOptimalPeriods()).allSatisfy(period -> {
            assertThat(period.getStartDate()).isNotNull();
            assertThat(period.getEndDate()).isNotNull();
            assertThat(period.getAvgRate()).isNotNull();
            assertThat(period.getSavingsPercent()).isNotNull();
            assertThat(period.getEstimatedSavingsAmount()).isNotNull();
            assertThat(period.getConfidence()).isGreaterThan(0);
            assertThat(period.getReason()).isNotEmpty();
        });
    }

    @Test
    void getTimingRecommendation_FindsAvoidPeriods() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createVariedForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getAvoidPeriods()).isNotEmpty();
        assertThat(response.getAvoidPeriods()).allSatisfy(period -> {
            assertThat(period.getStartDate()).isNotNull();
            assertThat(period.getEndDate()).isNotNull();
            assertThat(period.getAvgRate()).isNotNull();
            assertThat(period.getIncreasePercent()).isNotNull();
            assertThat(period.getEstimatedAdditionalCostAmount()).isNotNull();
            assertThat(period.getConfidence()).isGreaterThan(0);
            assertThat(period.getReason()).isNotEmpty();
        });
    }

    @Test
    void getTimingRecommendation_CalculatesPotentialSavings() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createVariedForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getPotentialSavings()).isNotNull();
        assertThat(response.getPotentialSavings()).isGreaterThan(BigDecimal.ZERO);
        assertThat(response.getPotentialSavingsPercent()).isNotNull();
        assertThat(response.getPotentialSavingsPercent()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    void getTimingRecommendation_CalculatesAverageConfidence() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createTestForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getAverageConfidence()).isBetween(40, 100);
    }

    @Test
    void getTimingRecommendation_LimitsOptimalPeriodsToThree() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createManyForecasts(20);
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getOptimalPeriods()).hasSizeLessThanOrEqualTo(3);
    }

    @Test
    void getTimingRecommendation_LimitsAvoidPeriodsToTwo() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createManyForecasts(20);
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        assertThat(response.getAvoidPeriods()).hasSizeLessThanOrEqualTo(2);
    }

    @Test
    void getTimingRecommendation_OnlyIncludesLowerRatesInOptimal() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createVariedForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        BigDecimal currentRate = response.getCurrentRate();
        assertThat(response.getOptimalPeriods()).allSatisfy(period -> {
            assertThat(period.getAvgRate()).isLessThan(currentRate);
        });
    }

    @Test
    void getTimingRecommendation_OnlyIncludesHigherRatesInAvoid() {
        // Given
        String importerCode = "USA";
        String exporterCode = "CHN";
        String hs6Code = "123456";
        ProfileType userProfile = ProfileType.BUSINESS_OWNER;

        when(countryRepository.findById(importerCode)).thenReturn(Optional.of(testCountry));
        when(productRepository.findById(hs6Code)).thenReturn(Optional.of(testProduct));
        when(measureRepository.findValidRate(any(Country.class), any(Product.class), any(LocalDate.class)))
            .thenReturn(Optional.of(testMeasure));

        List<DateRangeForecast> forecasts = createVariedForecasts();
        when(mlService.predictRateRange(any(), any(), any(), any(LocalDate.class), any(LocalDate.class)))
            .thenReturn(forecasts);

        // When
        AIRecommendationResponse response = aiRecommendationService.getTimingRecommendation(
            importerCode, exporterCode, hs6Code, userProfile);

        // Then
        BigDecimal currentRate = response.getCurrentRate();
        assertThat(response.getAvoidPeriods()).allSatisfy(period -> {
            assertThat(period.getAvgRate()).isGreaterThan(currentRate);
        });
    }

    // Helper methods

    private List<DateRangeForecast> createTestForecasts() {
        List<DateRangeForecast> forecasts = new ArrayList<>();
        LocalDate start = LocalDate.now();

        for (int i = 0; i < 12; i++) {
            forecasts.add(DateRangeForecast.builder()
                .startDate(start.plusWeeks(i * 4L))
                .endDate(start.plusWeeks(i * 4L + 3))
                .avgRate(new BigDecimal("0.10"))
                .minRate(new BigDecimal("0.09"))
                .maxRate(new BigDecimal("0.11"))
                .confidencePercent(75)
                .dayCount(7L)
                .build());
        }

        return forecasts;
    }

    private List<DateRangeForecast> createVariedForecasts() {
        List<DateRangeForecast> forecasts = new ArrayList<>();
        LocalDate start = LocalDate.now();

        // Create forecasts with varied rates (some lower, some higher than current 0.10)
        forecasts.add(createForecast(start, new BigDecimal("0.05"), 80)); // Optimal
        forecasts.add(createForecast(start.plusMonths(1), new BigDecimal("0.15"), 75)); // Avoid
        forecasts.add(createForecast(start.plusMonths(2), new BigDecimal("0.07"), 82)); // Optimal
        forecasts.add(createForecast(start.plusMonths(3), new BigDecimal("0.10"), 70)); // Neutral
        forecasts.add(createForecast(start.plusMonths(4), new BigDecimal("0.18"), 77)); // Avoid
        forecasts.add(createForecast(start.plusMonths(5), new BigDecimal("0.06"), 85)); // Optimal

        return forecasts;
    }

    private List<DateRangeForecast> createManyForecasts(int count) {
        List<DateRangeForecast> forecasts = new ArrayList<>();
        LocalDate start = LocalDate.now();

        for (int i = 0; i < count; i++) {
            BigDecimal rate = new BigDecimal("0.05").add(new BigDecimal(i * 0.01));
            forecasts.add(createForecast(start.plusWeeks(i * 4L), rate, 70 + (i % 20)));
        }

        return forecasts;
    }

    private DateRangeForecast createForecast(LocalDate startDate, BigDecimal avgRate, int confidence) {
        return DateRangeForecast.builder()
            .startDate(startDate)
            .endDate(startDate.plusWeeks(3))
            .avgRate(avgRate)
            .minRate(avgRate.multiply(new BigDecimal("0.9")))
            .maxRate(avgRate.multiply(new BigDecimal("1.1")))
            .confidencePercent(confidence)
            .dayCount(21L)
            .build();
    }
}
