package com.verbosegarbonzo.tariff.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "country")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Country {
    // created to parse country list into Supabase
    // WITS -> Country -> Supabase

    @Id
    @Column(name = "country_code", length = 3, nullable = false) // ISO alpha-3 (e.g., "SGP")
    @NotBlank(message = "Country code cannot be blank")
    @Size(min = 3, max = 3, message = "Country code must be exactly 3 characters")
    private String countryCode;

    @Column(name = "name", columnDefinition = "text", nullable = false)
    @NotBlank(message = "Country name cannot be blank")
    private String name;

    @Column(name = "numeric_code", length = 3) // ISO numeric (e.g., "702")
    @NotBlank(message = "Numeric code cannot be blank")
    @Size(min = 3, max = 3, message = "Numeric code must be exactly 3 characters")
    private String numericCode;

    @Column(name = "valuation_basis", length = 10)
    private String valuationBasis; // CIF, CFR, or FOB
}
