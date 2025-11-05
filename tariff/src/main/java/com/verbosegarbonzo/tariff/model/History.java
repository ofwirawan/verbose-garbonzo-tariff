package com.verbosegarbonzo.tariff.model;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

@Getter
@Setter
@NoArgsConstructor
public class History {
    private Long id;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;
    private String product;
    private String route;
    private Double weight; // Changed from double to Double to make it optional
    private double tradeValue;
    private double tariffRate;
    private double tariffCost;
    
    // Add these fields to match CalculateResponse and frontend expectations
    private JsonNode appliedRate; // For detailed rate breakdown in frontend
    private List<String> warnings; // Add missing warnings field
    private BigDecimal freightCost;
    private String freightType;
    private BigDecimal insuranceRate;
    private BigDecimal insuranceCost;
    private BigDecimal totalLandedCost; // Complete cost including freight + insurance
    private BigDecimal tradeFinal; // Final trade value after duties
}