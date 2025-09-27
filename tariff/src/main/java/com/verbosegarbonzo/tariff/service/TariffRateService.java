package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.TariffRate;
import com.verbosegarbonzo.tariff.model.TariffRate.TariffRateId;
import com.verbosegarbonzo.tariff.repository.TariffRateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TariffRateService {

    private final TariffRateRepository tariffRateRepository;

    public TariffRateService(TariffRateRepository tariffRateRepository) {
        this.tariffRateRepository = tariffRateRepository;
    }

    // Create or save a TariffRate
    public TariffRate create(TariffRate tariffRate) {
        return tariffRateRepository.save(tariffRate);
    }

    // Retrieve by composite ID
    public TariffRate getById(String hs6Code, String importing, String exporting, LocalDate date) {
        TariffRateId id = new TariffRateId(hs6Code, importing, exporting, date);
        return tariffRateRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("TariffRate not found"));
    }

    // Find all tariff rates matching keys within a date range
    public List<TariffRate> findAllByIdBetweenDates(String hs6Code, String importing, String exporting, LocalDate startDate, LocalDate endDate) {
        return tariffRateRepository.findAllByIdBetweenDates(hs6Code, importing, exporting, startDate, endDate);
    }

    // Update tariff rate details by ID
    @Transactional
    public boolean updateTariffRate(String hs6Code, String importing, String exporting, LocalDate oldDate,
                                    Double rate, LocalDate expiry, LocalDate newDate) {
        TariffRateId id = new TariffRateId(hs6Code, importing, exporting, oldDate);
        int updatedRows = tariffRateRepository.updateTariffRate(id, rate, expiry, newDate);
        return updatedRows > 0;
    }

    // Delete by composite ID
    @Transactional
    public void deleteById(String hs6Code, String importing, String exporting, LocalDate date) {
        TariffRateId id = new TariffRateId(hs6Code, importing, exporting, date);
        if (!tariffRateRepository.existsById(id)) {
            throw new NoSuchElementException("TariffRate not found");
        }
        tariffRateRepository.deleteById(id);
    }
}
