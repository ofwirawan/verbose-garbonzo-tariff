package com.verbosegarbonzo.tariff.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

//Output Data Transfer Object for tariff calculation

@Getter
@Setter
public class CalculateResponse {
    private Long transactionId;

    private String hs6;
    private String importerCode;
    private String exporterCode;

    private LocalDate transactionDate;

    private BigDecimal tradeValue;
    private BigDecimal tradeFinal;   //after duty applied

    private BigDecimal rateAdval;    
    private BigDecimal rateSpecific; 
    private BigDecimal ratePref;     

    private BigDecimal netWeight;    
}