package com.verbosegarbonzo.tariff.dto;
import java.math.BigDecimal;
import java.time.LocalDate;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    @JsonProperty(access = Access.READ_ONLY)
    private Integer tid;
    private UUID user;
    private LocalDate tDate;
    private String importer;
    private String exporter;
    private String product;
    private BigDecimal tradeOriginal;
    private BigDecimal netWeight;
    private BigDecimal tradeFinal;
    private String appliedRate;
}
