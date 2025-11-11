package com.verbosegarbonzo.tariff.dto;

import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;

import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeasureDTO {
    @JsonProperty(access = Access.READ_ONLY)
    private Integer measureId;

    @NotNull
    private String importerCode;

    @NotNull
    private String productCode;

    @NotNull
    private LocalDate validFrom;
    
    private LocalDate validTo;
    private BigDecimal mfnAdvalRate;
    private BigDecimal specificRatePerKg;
}
