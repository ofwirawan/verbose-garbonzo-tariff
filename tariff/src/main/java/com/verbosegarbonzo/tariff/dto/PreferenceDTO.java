package com.verbosegarbonzo.tariff.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceDTO {
    private Long preferenceId;
    private String importerCode;
    private String exporterCode;
    private String productCode;
    private LocalDate validFrom;
    private LocalDate validTo;
    private BigDecimal prefAdValRate;
}
