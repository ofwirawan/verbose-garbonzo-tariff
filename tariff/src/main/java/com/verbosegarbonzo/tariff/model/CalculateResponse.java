package com.verbosegarbonzo.tariff.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

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

    private BigDecimal rateAdval;
    private BigDecimal rateSpecific;
    private BigDecimal ratePref;

    private BigDecimal netWeight;

    private String suspensionNote;
    private Boolean suspensionActive;
}