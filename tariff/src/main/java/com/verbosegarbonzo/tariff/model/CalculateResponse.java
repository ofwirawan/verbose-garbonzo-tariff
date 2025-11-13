package com.verbosegarbonzo.tariff.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

//Output Data Transfer Object for tariff calculation
@NoArgsConstructor
@Getter
@Setter
public class CalculateResponse {
    private Long transactionId;
    private UUID uid;

    private String hs6;
    private String importerCode;
    private String exporterCode;

    private LocalDate transactionDate;

    private BigDecimal tradeOriginal;
    private BigDecimal tradeFinal; // after duty applied
    private BigDecimal netWeight;

    private JsonNode appliedRate;
    private List<String> warnings; // Optional warning message for user

    private BigDecimal freightCost;
    private String freightType;

    private BigDecimal insuranceRate;
    private BigDecimal insuranceCost;
    private String valuationBasisDeclared;
    private String valuationBasisApplied;

    private BigDecimal totalLandedCost; // tradeFinal + freight + insurance

    public CalculateResponse(Long tid, CalculateRequest req) {
        this.setTransactionId(tid);
        this.setUid(uid);
        this.setHs6(req.getHs6());
        this.setImporterCode(req.getImporterCode());
        this.setExporterCode(req.getExporterCode());
        this.setTransactionDate(req.getTransactionDate());
        this.setTradeOriginal(req.getTradeOriginal());
        this.setNetWeight(req.getNetWeight());
    }



}
