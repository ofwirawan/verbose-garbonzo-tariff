package com.verbosegarbonzo.tariff.dto;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceDTO {
    private Long preferenceId;
    private String importerCode;
    private String exporterCode;
    private String productCode;
    private String validFrom;
    private String validTo;
    private String prefAdvalRate;
}
