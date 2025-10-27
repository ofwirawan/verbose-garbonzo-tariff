package com.verbosegarbonzo.tariff.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "country")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Country {
//created to parse country list into Supabase
//WITS -> Country -> Supabase

    @Id
    @Column(name = "country_code", length = 3, nullable = false) //ISO alpha-3 (e.g., "SGP")
    private String countryCode;

    @Column(name = "name", columnDefinition = "text", nullable = false)
    private String name;

    @Column(name = "numeric_code", length = 3) //ISO numeric (e.g., "702")
    private String numericCode;
}
