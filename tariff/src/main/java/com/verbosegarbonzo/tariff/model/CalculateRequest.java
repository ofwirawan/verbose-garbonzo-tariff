package com.verbosegarbonzo.tariff.model;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CalculateRequest {
//Input Data Transfer Object for tariff calculation

    @Pattern(regexp = "^\\d{6}$", message = "hs6 must be 6 digits")
    @NotBlank
    private String hs6;

    @Pattern(regexp = "^\\d{3,4}$", message = "reporter must be numeric 3-4 digits")
    @NotBlank
    private String reporter;

    @Pattern(regexp = "^\\d{3,4}$", message = "partner must be numeric 3-4 digits")
    @NotBlank
    private String partner;

    @DecimalMin(value = "0.01")
    @Digits(integer = 18, fraction = 2)
    @NotNull
    private BigDecimal tradeValue;

    @NotNull
    private LocalDate transactionDate;
}
