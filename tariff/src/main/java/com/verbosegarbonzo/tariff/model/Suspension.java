package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "suspension")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Suspension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "suspension_id")
    private Integer suspensionId;

    @Column(name = "importer_code", nullable = false)
    private String importerCode;

    @Column(name = "exporter_code")
    private String exporterCode; // nullable

    @Column(name = "product_code", nullable = false)
    private String productCode;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "suspension_flag", nullable = false)
    private boolean suspensionFlag;

    @Column(name = "suspension_note")
    private String suspensionNote;
}
