package com.verbosegarbonzo.tariff.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

//Output Data Transfer Object for tariff calculation

@Getter
@Setter
public class CalculateResponse {
    private Long transactionId;
    private UUID uid;

    private String hs6;
    private String importerCode;
    private String exporterCode;

    private LocalDate transactionDate;

    private BigDecimal tradeOriginal;
    private BigDecimal tradeFinal; // after duty applied
    private BigDecimal netWeight;

    private JsonNode appliedRate;
    private List<String> warnings; // Optional warning message for user

    private BigDecimal freightCost;
    private BigDecimal freightCostMin;
    private BigDecimal freightCostMax;
    private String freightType;
    private Integer transitDays;

    private BigDecimal insuranceRate;
    private BigDecimal insuranceCost;
    private String valuationBasisDeclared;
    private String valuationBasisApplied;

    private BigDecimal totalLandedCost; // tradeFinal + freight + insurance
}
