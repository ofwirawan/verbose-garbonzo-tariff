package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer_code", referencedColumnName = "country_code", nullable = false)
    private Country importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exporter_code", referencedColumnName = "country_code", nullable = false)
    private Country exporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_code", referencedColumnName = "hs6code", nullable = false)
    private Product product;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "pref_adval_rate", nullable = false)
    private BigDecimal prefAdValRate;
}
