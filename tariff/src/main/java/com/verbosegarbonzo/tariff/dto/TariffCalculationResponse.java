package com.verbosegarbonzo.tariff.dto;

import lombok.Data;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TariffCalculationResponse {

    private Long id;
    private String productDescription;
    private String exportingCountry;
    private String importingCountry;
    private BigDecimal tradeValue;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;
    
    private BigDecimal tariffRate;
    private BigDecimal tariffCost;
    private String tariffType;
    private String currency;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // Additional metadata
    private String exportingCountryName;
    private String importingCountryName;
    private String calculationSummary;
}
