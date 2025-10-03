package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @NotBlank(message = "HS6 code is required")
    @Size(min = 6, max = 6, message = "HS6 code must be exactly 6 characters")
    private String hs6Code;

    @Column(name = "description")
    private String description;
}
