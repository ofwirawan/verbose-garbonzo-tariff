package com.verbosegarbonzo.tariff.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TariffCalculationRequest {

    @NotBlank(message = "Exporting country is required")
    @Size(min = 3, max = 3, message = "Country code must be 3 characters")
    private String exportingCountry;

    @NotBlank(message = "Importing country is required")
    @Size(min = 3, max = 3, message = "Country code must be 3 characters")
    private String importingCountry;

    @NotNull(message = "Trade value is required")
    @DecimalMin(value = "0.01", message = "Trade value must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Trade value format is invalid")
    private BigDecimal tradeValue;

    @NotNull(message = "Trade date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    @Size(max = 3, message = "Currency code must be 3 characters or less")
    private String currency = "USD";

    private String userId = "default-user"; // For demo purposes

    // Optional product description
    private String productDescription;
}
