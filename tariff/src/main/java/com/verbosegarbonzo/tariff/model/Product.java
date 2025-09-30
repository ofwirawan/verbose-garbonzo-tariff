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
    @Column(name = "hs6code")
    private String hs6Code;

    @Column(name = "description")
    private String description;
}
