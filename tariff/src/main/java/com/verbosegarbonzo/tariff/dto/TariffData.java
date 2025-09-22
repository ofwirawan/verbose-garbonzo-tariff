package com.verbosegarbonzo.tariff.dto;

import java.math.BigDecimal;

public class TariffData {
    private BigDecimal rate;
    private String tariffType;

    public TariffData(BigDecimal rate, String tariffType) {
        this.rate = rate;
        this.tariffType = tariffType;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public String getTariffType() {
        return tariffType;
    }
}


