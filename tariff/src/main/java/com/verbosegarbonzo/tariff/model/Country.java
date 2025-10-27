package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "country")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Country {
//created to parse country list into Supabase
//WITS -> Country -> Supabase

    @Id
    @NotBlank(message = "Country code cannot be blank")
    @Size(min = 3, max = 3, message = "Country code must be exactly 3 characters")
    @Column(name = "country_code", length = 3, nullable = false) //ISO alpha-3 (e.g., "SGP")
    private String countryCode;

    @NotBlank(message = "Country name cannot be blank")
    @Column(name = "name", columnDefinition = "text", nullable = false)
    private String name;

    @NotBlank(message = "Numeric code cannot be blank")
    @Size(min = 3, max = 3, message = "Numeric code must be exactly 3 characters")
    @Column(name = "numeric_code", length = 3) //ISO numeric (e.g., "702")
    private String numericCode;
}
