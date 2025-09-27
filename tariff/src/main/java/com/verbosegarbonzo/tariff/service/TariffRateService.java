package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.dto.BaseTariffRateDTO;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.TariffRate;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.TariffRateRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TariffRateService {

    private final TariffRateRepository tariffRateRepository;
    private final CountryRepository countryRepository;

    public TariffRateService(TariffRateRepository tariffRateRepository,
                             CountryRepository countryRepository) {
        this.tariffRateRepository = tariffRateRepository;
        this.countryRepository = countryRepository;
    }

    @Transactional
    public BaseTariffRateDTO createTariffRate(BaseTariffRateDTO dto) {
        validateExpiry(dto.getStartDate(), dto.getExpiry());
        TariffRate entity = mapDtoToEntity(dto);
        TariffRate saved = tariffRateRepository.save(entity);
        return mapEntityToDto(saved);
    }

    @Transactional(readOnly = true)
    public Optional<BaseTariffRateDTO> findValidOrClosest(String hs6Code, String importing, String exporting, LocalDate date) {
        List<TariffRate> validTariffs = tariffRateRepository.findValidOrOpenEndedAtDate(hs6Code, importing, exporting, date);
        if (!validTariffs.isEmpty()) {
            return Optional.of(mapEntityToDto(validTariffs.get(0)));
        }
        List<TariffRate> closest = tariffRateRepository.findClosestStartDateBefore(hs6Code, importing, exporting, date);
        if (!closest.isEmpty()) {
            return Optional.of(mapEntityToDto(closest.get(0)));
        }
        return Optional.empty();
    }

    @Transactional(readOnly = true)
    public List<BaseTariffRateDTO> searchByStartDateRange(String hs6Code, String importing, String exporting,
                                                          LocalDate startDate, LocalDate endDate) {
        List<TariffRate> list = tariffRateRepository.findAllByStartDateBetween(hs6Code, importing, exporting, startDate, endDate);
        return list.stream().map(this::mapEntityToDto).collect(Collectors.toList());
    }

    @Transactional
    public BaseTariffRateDTO updateTariffRateById(Long id, BaseTariffRateDTO dto) {
        validateExpiry(dto.getStartDate(), dto.getExpiry());
        TariffRate existing = tariffRateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("TariffRate not found"));

        existing.setHs6Code(dto.getHs6Code());

        Country importingCountry = countryRepository.findById(dto.getImporting())
                .orElseThrow(() -> new EntityNotFoundException("Importing country not found: " + dto.getImporting()));
        existing.setImportingCountry(importingCountry);

        Country exportingCountry = countryRepository.findById(dto.getExporting())
                .orElseThrow(() -> new EntityNotFoundException("Exporting country not found: " + dto.getExporting()));
        existing.setExportingCountry(exportingCountry);

        existing.setStartDate(dto.getStartDate());
        existing.setExpiry(dto.getExpiry());
        existing.setRate(dto.getRate());

        TariffRate saved = tariffRateRepository.save(existing);
        return mapEntityToDto(saved);
    }

    @Transactional
    public BaseTariffRateDTO updateRate(Long id, Double rate) {
        TariffRate existing = tariffRateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("TariffRate not found"));
        existing.setRate(rate);
        tariffRateRepository.save(existing);
        return mapEntityToDto(existing);
    }

    @Transactional
    public BaseTariffRateDTO updateExpiry(Long id, LocalDate expiry) {
        TariffRate existing = tariffRateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("TariffRate not found"));
        validateExpiry(existing.getStartDate(), expiry);
        existing.setExpiry(expiry);
        tariffRateRepository.save(existing);
        return mapEntityToDto(existing);
    }

    @Transactional
    public void deleteTariffRateById(Long id) {
        if (!tariffRateRepository.existsById(id)) {
            throw new NoSuchElementException("TariffRate not found");
        }
        tariffRateRepository.deleteById(id);
    }

    private TariffRate mapDtoToEntity(BaseTariffRateDTO dto) {
        TariffRate entity = new TariffRate();

        entity.setHs6Code(dto.getHs6Code());

        Country importingCountry = countryRepository.findById(dto.getImporting())
                .orElseThrow(() -> new EntityNotFoundException("Importing country not found: " + dto.getImporting()));
        entity.setImportingCountry(importingCountry);

        Country exportingCountry = countryRepository.findById(dto.getExporting())
                .orElseThrow(() -> new EntityNotFoundException("Exporting country not found: " + dto.getExporting()));
        entity.setExportingCountry(exportingCountry);

        entity.setStartDate(dto.getStartDate());
        entity.setExpiry(dto.getExpiry());
        entity.setRate(dto.getRate());

        return entity;
    }

    private BaseTariffRateDTO mapEntityToDto(TariffRate entity) {
        BaseTariffRateDTO dto = new BaseTariffRateDTO();

        dto.setId(entity.getId());
        dto.setHs6Code(entity.getHs6Code());
        dto.setImporting(entity.getImportingCountry().getNumericCode());
        dto.setExporting(entity.getExportingCountry().getNumericCode());
        dto.setStartDate(entity.getStartDate());
        dto.setExpiry(entity.getExpiry());
        dto.setRate(entity.getRate());

        return dto;
    }

    private void validateExpiry(LocalDate startDate, LocalDate expiry) {
        if (expiry != null && expiry.isBefore(startDate)) {
            throw new IllegalArgumentException("Expiry date cannot be earlier than start date.");
        }
    }
}

