package com.verbosegarbonzo.tariff.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRef {
    // Holds product info
    private String hs6;
    private String name;
}