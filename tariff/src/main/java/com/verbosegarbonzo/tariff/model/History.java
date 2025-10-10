package com.verbosegarbonzo.tariff.model;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;

@Getter
@Setter
@NoArgsConstructor
public class History {
    private Long id;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;
    private String product;
    private String route;
    private Double weight; // Changed from double to Double to make it optional
    private double tradeValue;
    private double tariffRate;
    private double tariffCost;
}