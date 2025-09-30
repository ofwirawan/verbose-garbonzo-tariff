package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "preference", uniqueConstraints = @UniqueConstraint(columnNames = { "importer_code", "exporter_code",
        "product_code", "valid_from" }))
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
    @NotNull
    private Country importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exporter_code", referencedColumnName = "country_code", nullable = false)
    @NotNull
    private Country exporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_code", referencedColumnName = "hs6code", nullable = false)
    @NotNull
    private Product product;

    @Column(name = "valid_from", nullable = false)
    @NotNull
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "pref_adval_rate", nullable = false)
    @NotNull
    @DecimalMin(value = "0.0", inclusive = true, message = "Preference Adval Rate must be zero or positive")
    private BigDecimal prefAdValRate;
}
