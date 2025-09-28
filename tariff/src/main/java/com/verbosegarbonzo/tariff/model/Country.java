package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "country", uniqueConstraints = {
        @UniqueConstraint(columnNames = "iso3code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Country {

    @Id
    @Column(name = "numericcode", length = 3)
    private String numericCode; // Primary key - 3-digit numeric code

    @Column(name = "iso3code", length = 3, unique = true, nullable = false)
    private String iso3code; // 3-letter ISO code, unique, not null

    @Column(name = "name", nullable = false, length = 255)
    private String name;
}
