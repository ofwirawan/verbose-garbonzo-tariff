package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "tariff_rate", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"hs6code", "importing", "exporting", "start_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TariffRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // surrogate primary key

    @Column(name = "hs6code", length = 6, nullable = false)
    private String hs6Code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importing", referencedColumnName = "numeric_code", nullable = false)
    private Country importingCountry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exporting", referencedColumnName = "numeric_code", nullable = false)
    private Country exportingCountry;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expiry")
    private LocalDate expiry;  // nullable for open-ended validity

    @Column(name = "rate", nullable = false)
    private Double rate;
}

