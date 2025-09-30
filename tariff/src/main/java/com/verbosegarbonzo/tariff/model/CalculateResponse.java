package com.verbosegarbonzo.tariff.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.Map;

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
    private BigDecimal tradeFinal;   //after duty applied
    private BigDecimal netWeight;    

    private JsonNode appliedRate;
}