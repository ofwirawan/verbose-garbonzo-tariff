package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @Column(name = "hs6code", length = 6)
    private String hs6Code;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;
}

