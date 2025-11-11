package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "measure", uniqueConstraints = @UniqueConstraint(columnNames = { "valid_from", "importer_code",
        "product_code" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Measure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "measure_id")
    private Integer measureId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importer_code", referencedColumnName = "country_code", nullable = false)
    @NotNull
    private Country importer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_code", referencedColumnName = "hs6code", nullable = false)
    @NotNull
    private Product product;

    @Column(name = "valid_from", nullable = false)
    @NotNull
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "mfn_adval_rate")
    @DecimalMin(value = "0.0", inclusive = true, message = "MFN Adval Rate must be zero or positive")
    private BigDecimal mfnAdvalRate;

    @Column(name = "specific_rate_per_kg")
    @DecimalMin(value = "0.0", inclusive = true, message = "Specific Rate per Kg must be zero or positive")
    private BigDecimal specificRatePerKg;
}
