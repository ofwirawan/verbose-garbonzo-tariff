package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.dto.*;
import com.verbosegarbonzo.tariff.entity.TariffCalculation;
import com.verbosegarbonzo.tariff.entity.Country;
import com.verbosegarbonzo.tariff.repository.TariffCalculationRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TariffCalculationService {

    private final TariffCalculationRepository calculationRepository;
    private final CountryRepository countryRepository;
    private final WitsApiService witsApiService;

    @Transactional
    public TariffCalculationResponse calculateTariff(TariffCalculationRequest request) {
        log.info("Processing tariff calculation request: {}", request);

        try {
            // Get product description (from request or use default)
            String productDescription = request.getProductDescription();
            if (productDescription == null || productDescription.trim().isEmpty()) {
                productDescription = "General Trade Item";
            }
            
            // Get tariff rate - use simplified logic based on country pair
            BigDecimal tariffRate = witsApiService.getGeneralTariffRate(
                    request.getImportingCountry(),
                    request.getExportingCountry(),
                    request.getTradeDate().getYear()
            ).block();

            // Calculate tariff cost
            BigDecimal tariffCost = request.getTradeValue()
                    .multiply(tariffRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            // Create and save calculation entity
            TariffCalculation calculation = new TariffCalculation();
            calculation.setProductDescription(productDescription);
            calculation.setExportingCountry(request.getExportingCountry());
            calculation.setImportingCountry(request.getImportingCountry());
            calculation.setTradeValue(request.getTradeValue());
            calculation.setTradeDate(request.getTradeDate());
            calculation.setTariffRate(tariffRate);
            calculation.setTariffCost(tariffCost);
            calculation.setTariffType("MFN"); // Default to Most Favored Nation
            calculation.setCurrency(request.getCurrency());
            calculation.setUserId(request.getUserId());

            TariffCalculation saved = calculationRepository.save(calculation);

            // Get country names
            String exportingCountryName = getCountryName(request.getExportingCountry());
            String importingCountryName = getCountryName(request.getImportingCountry());

            // Build response
            return TariffCalculationResponse.builder()
                    .id(saved.getId())
                    .productDescription(saved.getProductDescription())
                    .exportingCountry(saved.getExportingCountry())
                    .importingCountry(saved.getImportingCountry())
                    .tradeValue(saved.getTradeValue())
                    .tradeDate(saved.getTradeDate())
                    .tariffRate(saved.getTariffRate())
                    .tariffCost(saved.getTariffCost())
                    .tariffType(saved.getTariffType())
                    .currency(saved.getCurrency())
                    .createdAt(saved.getCreatedAt())
                    .exportingCountryName(exportingCountryName)
                    .importingCountryName(importingCountryName)
                    .calculationSummary(createCalculationSummary(saved, exportingCountryName, importingCountryName))
                    .build();

        } catch (Exception e) {
            log.error("Error calculating tariff", e);
            throw new RuntimeException("Failed to calculate tariff: " + e.getMessage(), e);
        }
    }

    @Transactional
    public TariffCalculationResponse saveCalculation(Long calculationId) {
        log.info("Saving calculation with ID: {}", calculationId);
        
        Optional<TariffCalculation> calculationOpt = calculationRepository.findById(calculationId);
        if (calculationOpt.isEmpty()) {
            throw new RuntimeException("Calculation not found with ID: " + calculationId);
        }
        
        // The calculation is already saved, just return the response
        TariffCalculation calculation = calculationOpt.get();
        return convertToResponse(calculation);
    }

    @Transactional
    public TariffCalculationResponse saveCalculationFromResponse(TariffCalculationResponse response) {
        log.info("Saving calculation from response: {}", response);
        
        // Create new calculation entity from response
        TariffCalculation calculation = new TariffCalculation();
        calculation.setProductDescription(response.getProductDescription());
        calculation.setExportingCountry(response.getExportingCountry());
        calculation.setImportingCountry(response.getImportingCountry());
        calculation.setTradeValue(response.getTradeValue());
        calculation.setTradeDate(response.getTradeDate());
        calculation.setTariffRate(response.getTariffRate());
        calculation.setTariffCost(response.getTariffCost());
        calculation.setTariffType(response.getTariffType() != null ? response.getTariffType() : "MFN");
        calculation.setCurrency(response.getCurrency() != null ? response.getCurrency() : "USD");
        calculation.setUserId("default-user"); // Default user for now

        TariffCalculation saved = calculationRepository.save(calculation);
        return convertToResponse(saved);
    }

    public List<Country> getAllCountries() {
        log.info("Fetching all countries");
        return countryRepository.findByIsActiveTrueOrderByCountryName();
    }

    public List<TariffCalculationResponse> getCalculationHistory(String userId) {
        log.info("Fetching calculation history for user: {}", userId);
        
        List<TariffCalculation> calculations = calculationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return calculations.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public AnalyticsResponse getAnalyticsData() {
        log.info("Generating analytics data");

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        LocalDate thirtyDaysAgoDate = LocalDate.now().minusDays(30);

        // Get trend data
        List<Object[]> trendData = calculationRepository.findTariffTrends(thirtyDaysAgoDate);
        List<AnalyticsResponse.TrendDataPoint> trends = trendData.stream()
                .map(row -> AnalyticsResponse.TrendDataPoint.builder()
                        .date((LocalDate) row[0])
                        .averageTariffRate((BigDecimal) row[1])
                        .calculationCount(1L) // This would need to be calculated properly
                        .build())
                .collect(Collectors.toList());

        // Get country comparison data
        List<Object[]> countryData = calculationRepository.findAvgTariffRateByCountry(thirtyDaysAgo);
        List<AnalyticsResponse.CountryData> countryComparison = countryData.stream()
                .map(row -> AnalyticsResponse.CountryData.builder()
                        .countryCode((String) row[0])
                        .countryName(getCountryName((String) row[0]))
                        .averageTariffRate((BigDecimal) row[1])
                        .calculationCount((Long) row[2])
                        .totalTradeValue(BigDecimal.ZERO) // Would need additional query
                        .build())
                .collect(Collectors.toList());

        // Get overall statistics
        Long totalCalculations = calculationRepository.countCalculationsSince(thirtyDaysAgo);
        
        AnalyticsResponse.OverallStatistics statistics = AnalyticsResponse.OverallStatistics.builder()
                .totalCalculations(totalCalculations)
                .averageTariffRate(calculateOverallAverageTariffRate())
                .totalTradeValue(calculateTotalTradeValue())
                .uniqueCountries((long) countryRepository.findByIsActiveTrueOrderByCountryName().size())
                .uniqueProducts(calculateUniqueProducts())
                .earliestCalculation(LocalDate.now().minusDays(30))
                .latestCalculation(LocalDate.now())
                .build();

        return AnalyticsResponse.builder()
                .trends(AnalyticsResponse.TariffTrends.builder()
                        .dailyTrends(trends)
                        .monthlyTrends(trends) // In real implementation, group by month
                        .build())
                .countryComparison(AnalyticsResponse.CountryComparison.builder()
                        .topCountriesByTariffRate(countryComparison)
                        .topCountriesByVolume(countryComparison)
                        .build())
                .statistics(statistics)
                .build();
    }

    private TariffCalculationResponse convertToResponse(TariffCalculation calculation) {
        String exportingCountryName = getCountryName(calculation.getExportingCountry());
        String importingCountryName = getCountryName(calculation.getImportingCountry());

        return TariffCalculationResponse.builder()
                .id(calculation.getId())
                .productDescription(calculation.getProductDescription())
                .exportingCountry(calculation.getExportingCountry())
                .importingCountry(calculation.getImportingCountry())
                .tradeValue(calculation.getTradeValue())
                .tradeDate(calculation.getTradeDate())
                .tariffRate(calculation.getTariffRate())
                .tariffCost(calculation.getTariffCost())
                .tariffType(calculation.getTariffType())
                .currency(calculation.getCurrency())
                .createdAt(calculation.getCreatedAt())
                .exportingCountryName(exportingCountryName)
                .importingCountryName(importingCountryName)
                .calculationSummary(createCalculationSummary(calculation, exportingCountryName, importingCountryName))
                .build();
    }

    private String getCountryName(String countryCode) {
        return countryRepository.findById(countryCode)
                .map(Country::getCountryName)
                .orElse(countryCode);
    }

    private String createCalculationSummary(TariffCalculation calculation, String exportingCountryName, String importingCountryName) {
        return String.format("Tariff cost of %s %s for importing %s from %s to %s (Rate: %s%%)",
                calculation.getCurrency(),
                calculation.getTariffCost(),
                calculation.getProductDescription(),
                exportingCountryName,
                importingCountryName,
                calculation.getTariffRate());
    }

    private BigDecimal calculateOverallAverageTariffRate() {
        // Simplified calculation - in real implementation, use repository query
        return BigDecimal.valueOf(7.5);
    }

    private BigDecimal calculateTotalTradeValue() {
        // Simplified calculation - in real implementation, use repository query
        return BigDecimal.valueOf(1000000);
    }

    private Long calculateUniqueProducts() {
        // Simplified calculation - in real implementation, use repository query
        return 150L;
    }
}
