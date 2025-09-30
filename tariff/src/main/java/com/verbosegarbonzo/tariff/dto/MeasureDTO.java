package com.verbosegarbonzo.tariff.dto;

import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeasureDTO {
    private Long measureId;
    private String importerCode;
    private String productCode;
    private LocalDate validFrom;
    private LocalDate validTo;
    private BigDecimal mfnAdvalRate;
    private BigDecimal specificRatePerKg;
}
