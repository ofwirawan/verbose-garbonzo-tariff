package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "suspension", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"importer", "product", "validfrom"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Suspension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long suspensionId;

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

    @Column(name = "suspensionflag", nullable = false)
    private Boolean suspensionFlag;

    @Column(name = "suspensionnote")
    private String suspensionNote;
}
