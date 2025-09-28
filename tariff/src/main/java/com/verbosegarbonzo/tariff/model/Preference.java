package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "preference", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"importer", "exporter", "product", "validfrom"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Preference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long preferenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer", referencedColumnName = "numericcode", nullable = false)
    private Country importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exporter", referencedColumnName = "numericcode", nullable = false)
    private Country exporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product", referencedColumnName = "hs6code", nullable = false)
    private Product product;

    @Column(name = "validfrom", nullable = false)
    private LocalDate validFrom;

    @Column(name = "validto")
    private LocalDate validTo;

    @Column(name = "prefadvalrate", nullable = false, precision = 8, scale = 6)
    private BigDecimal prefAdValRate;
}

