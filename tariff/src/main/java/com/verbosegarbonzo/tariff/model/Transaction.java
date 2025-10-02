package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tid;
    
    @Column(nullable = false)
    private UUID uid;
    
    @Column(name = "t_date", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tDate;
    
    @Column(name = "importer_code", nullable = false, length = 3)
    private String importerCode;
    
    @Column(name = "exporter_code", length = 3)
    private String exporterCode;
    
    @Column(nullable = false, length = 6)
    private String hs6code;
    
    @Column(name = "trade_original", nullable = false, precision = 38, scale = 2)
    private BigDecimal tradeOriginal;
    
    @Column(name = "net_weight", precision = 38, scale = 2)
    private BigDecimal netWeight;
    
    @Column(name = "trade_final", nullable = false, precision = 38, scale = 2)
    private BigDecimal tradeFinal;
    
    @Column(name = "applied_rate", columnDefinition = "json")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> appliedRate;
    
    // Relationships - ignore during JSON serialization to prevent lazy loading issues
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer_code", referencedColumnName = "country_code", insertable = false, updatable = false)
    private Country importer;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exporter_code", referencedColumnName = "country_code", insertable = false, updatable = false)
    private Country exporter;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hs6code", referencedColumnName = "hs6code", insertable = false, updatable = false)
    private Product product;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid", referencedColumnName = "uid", insertable = false, updatable = false)
    private UserInfo user;
}