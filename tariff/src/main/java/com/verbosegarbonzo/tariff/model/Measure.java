package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    private Integer measureId;

    @Column(name = "importer_code", nullable = false)
    private String importerCode;

    @Column(name = "product_code", nullable = false)
    private String productCode;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "mfn_adval_rate", nullable = false)
    private BigDecimal mfnAdvalRate;

    @Column(name = "specific_rate_per_kg")
    private BigDecimal specificRatePerKg;
}