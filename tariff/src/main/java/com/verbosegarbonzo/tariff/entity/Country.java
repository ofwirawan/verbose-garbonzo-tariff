package com.verbosegarbonzo.tariff.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "countries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Country {
    
    @Id
    @Column(name = "iso3_code", length = 3)
    private String iso3Code; // ISO3 country code

    @Column(name = "country_name", nullable = false)
    @JsonProperty("name") // Expose countryName as "name" in JSON
    private String countryName; // Full country name

    @Column(name = "region")
    private String region; 

    @Column(name = "income_group")
    private String incomeGroup;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;
}   
