package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "preference")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Preference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "preference_id")
    private Integer preferenceId;

    @Column(name = "importer_code", nullable = false)
    private String importerCode;

    @Column(name = "exporter_code", nullable = false)
    private String exporterCode;

    @Column(name = "product_code", nullable = false)
    private String productCode;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "pref_adval_rate", nullable = false)
    private java.math.BigDecimal prefAdvalRate;
}
