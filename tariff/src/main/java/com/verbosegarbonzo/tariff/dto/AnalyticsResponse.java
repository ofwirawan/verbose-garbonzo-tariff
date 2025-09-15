package com.verbosegarbonzo.tariff.dto;

import lombok.Data;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsResponse {

    private TariffTrends trends;
    private CountryComparison countryComparison;
    private OverallStatistics statistics;

    @Data
    @Builder
    public static class TariffTrends {
        private List<TrendDataPoint> dailyTrends;
        private List<TrendDataPoint> monthlyTrends;
    }

    @Data
    @Builder
    public static class TrendDataPoint {
        private LocalDate date;
        private BigDecimal averageTariffRate;
        private Long calculationCount;
    }

    @Data
    @Builder
    public static class CountryComparison {
        private List<CountryData> topCountriesByTariffRate;
        private List<CountryData> topCountriesByVolume;
    }

    @Data
    @Builder
    public static class CountryData {
        private String countryCode;
        private String countryName;
        private BigDecimal averageTariffRate;
        private Long calculationCount;
        private BigDecimal totalTradeValue;
    }

    @Data
    @Builder
    public static class OverallStatistics {
        private Long totalCalculations;
        private BigDecimal averageTariffRate;
        private BigDecimal totalTradeValue;
        private Long uniqueCountries;
        private Long uniqueProducts;
        private LocalDate earliestCalculation;
        private LocalDate latestCalculation;
    }
}
