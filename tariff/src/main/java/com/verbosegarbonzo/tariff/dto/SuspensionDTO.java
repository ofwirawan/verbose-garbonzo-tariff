package com.verbosegarbonzo.tariff.dto;

import java.time.LocalDate;
import java.math.BigDecimal;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuspensionDTO {
    private Long suspensionId;
    private String importerCode;
    private String productCode;
    private LocalDate validFrom;
    private LocalDate validTo;
    private boolean suspensionFlag;
    private String suspensionNote;
    private BigDecimal suspensionRate;
}
