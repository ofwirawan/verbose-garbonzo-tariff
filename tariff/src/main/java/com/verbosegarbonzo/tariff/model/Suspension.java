package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "suspension")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Suspension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "suspension_id")
    private Integer suspensionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer_code", referencedColumnName = "country_code", nullable = false)
    private Country importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_code", referencedColumnName = "hs6code", nullable = false)
    private Product product;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "suspension_flag", nullable = false)
    private boolean suspensionFlag;

    @Column(name = "suspension_note", nullable = false)
    private String suspensionNote;

    @Column(name = "suspension_rate")
    private BigDecimal suspensionRate;
}
