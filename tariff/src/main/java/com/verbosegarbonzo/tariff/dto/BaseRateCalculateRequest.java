package com.verbosegarbonzo.tariff.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class BaseRateCalculateRequest {

    @Pattern(regexp = "^\\d{6}$", message = "hs6 code must be exactly 6 digits")
    @NotBlank
    private String hs6Code;

    @Pattern(regexp = "^\\d{3}$", message = "importing country code must be exactly 3 digits")
    @NotBlank
    private String importingCountryCode;

    @Pattern(regexp = "^\\d{3}$", message = "exporting country code must be exactly 3 digits")
    @NotBlank
    private String exportingCountryCode;

    @DecimalMin(value = "0.01", message = "trade value must be positive")
    @Digits(integer = 18, fraction = 2)
    @NotNull
    private BigDecimal tradeValue;

    @NotNull
    private LocalDate transactionDate;
}


