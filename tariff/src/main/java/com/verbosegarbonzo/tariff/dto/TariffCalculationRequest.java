package com.verbosegarbonzo.tariff.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class TariffCalculationRequest {
    
    @NotBlank(message = "Exporting country is required")
    @Size(min = 3, max = 3, message = "Exporting country must be a valid ISO3 code")
    private String exportingCountry; // ISO3 code

    @NotBlank(message = "Importing country is required")
    @Size(min = 3, max = 3, message = "Importing country must be a valid ISO3 code")
    private String importingCountry; // ISO3 code

    @NotNull(message = "Trade value is required")
    @DecimalMin(value = "0.01", message = "Trade value must be greater than 0")
    @Digits(integer = 15, fraction = 4, message = "Trade value format is invalid")
    private BigDecimal tradeValue;

    @NotNull(message = "Trade date is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tradeDate;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a valid ISO3 code")
    private String currency; // ISO3 currency code

    @NotBlank(message = "Product description is required")
    @Size(max = 255, message = "Product description cannot exceed 255 characters")
    private String productDescription;
}
