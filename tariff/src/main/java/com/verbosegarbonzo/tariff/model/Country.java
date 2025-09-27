package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Entity
@Table(name = "countries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Country implements Serializable {

    @Id
    @Column(name = "iso_code", length = 3)
    private String iso3;

    @Column(name = "name")
    private String name;

    @Column(name = "numeric_code")
    private String numericCode;
}


