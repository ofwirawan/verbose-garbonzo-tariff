package com.verbosegarbonzo.tariff.model;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

//Input Data Transfer Object for tariff calculation

@Getter
@Setter
public class CalculateRequest {
    @Pattern(regexp = "^\\d{6}$", message = "hs6 must be 6 digits")
    @NotBlank
    private String hs6;

    @NotBlank
    private String importerCode;

    private String exporterCode; //optional

    @DecimalMin(value = "0.01")
    @Digits(integer = 18, fraction = 2)
    @NotNull
    private BigDecimal tradeValue;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal netWeight; //optional, for specific/compound tariffs

    @NotNull
    private LocalDate transactionDate;
}