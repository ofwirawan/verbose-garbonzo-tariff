package com.verbosegarbonzo.tariff.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class TariffCalculationResponse {
    
    private Long id; // Database ID for the saved calculation record
    
    private String exportingCountry; // ISO3 code
    private String importingCountry; // ISO3 code
    private String productDescription;
    private BigDecimal tradeValue;
    private String currency;
    
    private BigDecimal tariffRate; // Percentage rate applied
    private BigDecimal tariffCost; // Calculated tariff amount
    private BigDecimal totalCost;  // tradeValue + tariffCost
    private String tariffType;     // e.g., MFN, preferential
    
    private String status;         // SUCCESS, ERROR, etc.
    private String message;        // Optional message for additional info
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime calculationTimestamp;
}
