package com.verbosegarbonzo.tariff.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor          
@AllArgsConstructor
public class CountryRef {
//Holds country info

    private String name;
    private String iso3;
    private String numericCode;
}
