package com.verbosegarbonzo.tariff.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class BaseTariffRateDTO {

    private Long id;  // optional surrogate key

    @NotNull
    @Size(min = 6, max = 6)
    private String hs6Code;

    @NotNull
    @Size(min = 3, max = 3)
    private String importing;

    @NotNull
    @Size(min = 3, max = 3)
    private String exporting;

    @NotNull
    private LocalDate startDate;

    private LocalDate expiry;  // can be null for open-ended validity

    @NotNull
    private Double rate;

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getHs6Code() {
        return hs6Code;
    }

    public void setHs6Code(String hs6Code) {
        this.hs6Code = hs6Code;
    }

    public String getImporting() {
        return importing;
    }

    public void setImporting(String importing) {
        this.importing = importing;
    }

    public String getExporting() {
        return exporting;
    }

    public void setExporting(String exporting) {
        this.exporting = exporting;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getExpiry() {
        return expiry;
    }

    public void setExpiry(LocalDate expiry) {
        this.expiry = expiry;
    }

    public Double getRate() {
        return rate;
    }

    public void setRate(Double rate) {
        this.rate = rate;
    }
}
