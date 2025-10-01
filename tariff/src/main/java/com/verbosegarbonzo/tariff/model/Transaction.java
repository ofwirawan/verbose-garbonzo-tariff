package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.vladmihalcea.hibernate.type.json.JsonType;
import org.hibernate.annotations.Type;

@Entity
@Table(name = "transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @Column(name = "tid")
    private Integer tid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid", referencedColumnName = "uid", nullable = false)
    @NotNull
    private User user;

    @Column(name = "t_date", nullable = false)
    @NotNull
    private LocalDate tDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer_code", referencedColumnName = "country_code", nullable = false)
    @NotNull
    private Country importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exporter_code", referencedColumnName = "country_code")
    private Country exporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hs6code", referencedColumnName = "hs6code", nullable = false)
    @NotNull
    private Product product;

    @Column(name = "trade_original", nullable = false)
    @NotNull
    @DecimalMin(value = "0.0", inclusive = true, message = "Trade original must be zero or positive")
    private BigDecimal tradeOriginal;

    @Column(name = "net_weight")
    @DecimalMin(value = "0.0", inclusive = true, message = "Net weight must be zero or positive")
    private BigDecimal netWeight;

    @Column(name = "trade_final", nullable = false)
    @NotNull
    @DecimalMin(value = "0.0", inclusive = true, message = "Trade final must be zero or positive")
    private BigDecimal tradeFinal;

    @Column(name = "applied_rate", columnDefinition = "json", nullable = false)
    @Type(JsonType.class)
    @NotNull
    private JsonNode appliedRate;
}
