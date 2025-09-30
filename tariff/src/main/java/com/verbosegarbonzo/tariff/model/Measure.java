package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "measure")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Measure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "measure_id")
    private Long measureId;

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

    @Column(name = "mfn_adval_rate")
    private BigDecimal mfnAdvalRate;

    @Column(name = "specific_rate_per_kg")
    private BigDecimal specificRatePerKg;
}
