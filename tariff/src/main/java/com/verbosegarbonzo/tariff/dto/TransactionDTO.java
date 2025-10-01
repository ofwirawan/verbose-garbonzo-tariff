package com.verbosegarbonzo.tariff.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private Integer tid;
    private UUID user;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tDate;
    private String importer;
    private String exporter;
    private String product;
    private BigDecimal tradeOriginal;
    private BigDecimal netWeight;
    private BigDecimal tradeFinal;
    private JsonNode appliedRate;
}
