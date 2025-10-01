package com.verbosegarbonzo.tariff.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceDTO {
    @JsonProperty(access = Access.READ_ONLY)
    private Integer preferenceId;
    private String importerCode;
    private String exporterCode;
    private String productCode;
    private LocalDate validFrom;
    private LocalDate validTo;
    private BigDecimal prefAdValRate;
}
