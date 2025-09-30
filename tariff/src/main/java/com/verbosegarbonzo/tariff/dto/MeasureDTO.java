package com.verbosegarbonzo.tariff.dto;

import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeasureDTO {
    @JsonProperty(access = Access.READ_ONLY)
    private Integer measureId;
    private String importerCode;
    private String productCode;
    private LocalDate validFrom;
    private LocalDate validTo;
    private BigDecimal mfnAdvalRate;
    private BigDecimal specificRatePerKg;
}
