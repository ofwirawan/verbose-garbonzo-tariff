package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "country")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Country {

    @Id
    @Column(name = "country_code", length = 3, nullable = false)
    @NotBlank
    private String countryCode; // Primary key - country_code

    @Column(name = "numeric_code", unique = true, length = 3, nullable = false)
    @NotBlank
    private String numericCode; // Unique numeric code

    @Column(name = "name", nullable = false, columnDefinition = "text")
    private String name;
}
