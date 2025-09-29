package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {
//created to parse product list into Supabase
//WITS -> Product -> Supabase
 
    @Id
    @Column(name = "hs6code", length = 6)
    private String hs6Code;

    @Column(name = "description", columnDefinition = "text")
    private String description;
}
