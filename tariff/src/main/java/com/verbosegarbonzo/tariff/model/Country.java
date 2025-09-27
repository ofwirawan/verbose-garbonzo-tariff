package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "countries", uniqueConstraints = {
        @UniqueConstraint(columnNames = "iso_code"), @UniqueConstraint(columnNames = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Country {

    @Id
    @Column(name = "numeric_code", length = 3)
    private String numericCode; // Primary key - 3-digit numeric code

    @Column(name = "iso_code", length = 3, unique = true)
    private String iso3; // 3-letter ISO code, unique

    @Column(name = "name")
    private String name;
}
