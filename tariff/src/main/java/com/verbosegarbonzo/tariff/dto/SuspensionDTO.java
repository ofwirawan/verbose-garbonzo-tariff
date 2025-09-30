package com.verbosegarbonzo.tariff.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;

import java.math.BigDecimal;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuspensionDTO {
    @JsonProperty(access = Access.READ_ONLY)
    private Integer suspensionId;
    private String importerCode;
    private String productCode;
    private LocalDate validFrom;
    private LocalDate validTo;
    private boolean suspensionFlag;
    private String suspensionNote;
    private BigDecimal suspensionRate;
}
