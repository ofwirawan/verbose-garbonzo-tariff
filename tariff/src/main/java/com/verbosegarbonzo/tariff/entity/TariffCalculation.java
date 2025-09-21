package com.verbosegarbonzo.tariff.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import org.springframework.cglib.core.Local;

import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "tariff_calculations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TariffCalculation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_description")
    private String productDescription;

    @Column(name = "exporting_country", length = 3)
    private String exportingCountry; // ISO3 code

    @Column(name = "importing_country", length = 3)
    private String importingCountry; // ISO3 code

    @Column(name = "trade_value", nullable = false, precision = 19, scale = 4)
    private java.math.BigDecimal tradeValue;

    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Column(name = "tariff_rate", precision = 10, scale = 4)
    private BigDecimal tariffRate;
    
    @Column(name = "tariff_cost", precision = 19, scale = 4)
    private BigDecimal tariffCost;

    @Column(name = "tariff_type", length = 10)
    private String tariffType; 

    @Column(name = "currency", length = 3)
    private String currency; // ISO3 currency code

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
