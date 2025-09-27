package com.verbosegarbonzo.tariff.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class BaseRateCalculateResponse {
    private String hs6Code;
    private String importingCountryCode;
    private String exportingCountryCode;
    private BigDecimal tradeValue;
    private LocalDate transactionDate;
    private BigDecimal baseRate;  // The calculated base tariff rate
    private BigDecimal tariffAmount;  // Calculated tariff amount applying base rate
    private LocalDate rateEffectiveDate;  // Effective date of the base rate
    private LocalDate rateExpiryDate;  // Expiry date if applicable
}
