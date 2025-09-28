package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "measure", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"importer", "product", "validfrom"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Measure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long measureId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer", referencedColumnName = "numericcode", nullable = false)
    private Country importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product", referencedColumnName = "hs6code", nullable = false)
    private Product product;

    @Column(name = "validfrom", nullable = false)
    private LocalDate validFrom;

    @Column(name = "validto")
    private LocalDate validTo;

    @Column(name = "mfnadvalrate", nullable = false, precision = 8, scale = 6)
    private BigDecimal mfnAdValRate;

    @Column(name = "specificrateperkg", precision = 8, scale = 6)
    private BigDecimal specificRatePerKg;

    @Column(name = "compoundflag")
    private Boolean compoundFlag;
}


