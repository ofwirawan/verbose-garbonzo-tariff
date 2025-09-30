package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @Column(name = "tid")
    private Long tid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @Column(name = "t_date", nullable = false)
    private LocalDate tDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer_code", referencedColumnName = "country_code", nullable = false)
    private Country importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exporter_code", referencedColumnName = "country_code")
    private Country exporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hs6code", referencedColumnName = "hs6code", nullable = false)
    private Product product;

    @Column(name = "trade_original", nullable = false)
    private BigDecimal tradeOriginal;

    @Column(name = "net_weight")
    private BigDecimal netWeight;

    @Column(name = "trade_final", nullable = false)
    private BigDecimal tradeFinal;

    @Column(name = "applied_rate", columnDefinition = "json", nullable = false)
    private String appliedRate;
}
