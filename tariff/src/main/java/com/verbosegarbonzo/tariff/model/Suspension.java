package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "suspension", uniqueConstraints = @UniqueConstraint(columnNames = { "importer_code", "product_code",
        "valid_from" }))
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

    @Column(name = "suspension_flag", nullable = false)
    private boolean suspensionFlag;

    @Column(name = "suspension_note", nullable = false)
    @NotBlank(message = "Suspension note is required")
    private String suspensionNote;

    @Column(name = "suspension_rate")
    @DecimalMin(value = "0.0", inclusive = true, message = "Suspension rate must be zero or positive")
    private BigDecimal suspensionRate;
}