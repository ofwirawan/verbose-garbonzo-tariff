package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transaction")
@Getter
@Setter
public class Transaction {

    @Id
    @Column(name = "tid")
    private Long tid; 
    
    @Column(name = "uid", nullable = false)
    private UUID uid;

    @Column(name = "t_date", nullable = false)
    private LocalDate tDate;

    @Column(name = "importer_code", nullable = false)
    private String importerCode;

    @Column(name = "exporter_code")
    private String exporterCode;

    @Column(name = "hs6code")
    private String hs6code;

    @Column(name = "trade_original", nullable = false)
    private BigDecimal tradeOriginal;

    @Column(name = "net_weight")
    private BigDecimal netWeight;

    @Column(name = "trade_final", nullable = false)
    private BigDecimal tradeFinal;

    @Column(name = "rate_adval")
    private BigDecimal rateAdval;

    @Column(name = "rate_specific")
    private BigDecimal rateSpecific;

    @Column(name = "rate_pref")
    private BigDecimal ratePref;
}
