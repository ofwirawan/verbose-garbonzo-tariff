package com.verbosegarbonzo.tariff.dto;
import java.math.BigDecimal;
import java.time.LocalDate;

import java.util.UUID;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private Long tid;
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
