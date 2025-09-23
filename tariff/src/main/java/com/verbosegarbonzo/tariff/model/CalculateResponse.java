package com.verbosegarbonzo.tariff.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CalculateResponse {
//Output Data Transfer Object for tariff calculation

    private String hs6;
    private String reporter;
    private String partner;
    private int year;
    private BigDecimal ratePercent;
    private BigDecimal tradeValue;
    private BigDecimal duty;         // tradeValue * rateDecimal
    private BigDecimal totalPayable; // tradeValue + duty
    private String dataUrl;          // WITS API URL used for fetching data
}