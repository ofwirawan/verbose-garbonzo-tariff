package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class CountryService {

    private final CountryRepository countryRepository;

    public CountryService(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    // Create new country
    public Country create(Country country) {
        return countryRepository.save(country);
    }

    // Read country by ID (numeric code is id)
    public Country getById(String id) {
        return countryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Country not found with id " + id));
    }

    // Delete country by ID
    @Transactional
    public void deleteById(String id) {
        if (!countryRepository.existsById(id)) {
            throw new NoSuchElementException("Country not found with id " + id);
        }
        countryRepository.deleteById(id);
    }

    // Search countries by query
    public List<Country> searchCountries(String query) {
        return countryRepository.searchCountries(query);
    }

    @Transactional
    public int updateCountry(String numericCode, String iso3, String name) {
        return countryRepository.updateCountry(numericCode, iso3, name);
    }

    @Transactional
    public int updateIso3ByName(String iso3, String name) {
        return countryRepository.updateIso3ByName(iso3, name);
    }

    @Transactional
    public int updateNameByIso3(String name, String iso3) {
        return countryRepository.updateNameByIso3(name, iso3);
    }

    @Transactional
    public int deleteByIso3(String iso3) {
        return countryRepository.deleteByIso3(iso3);
    }

    @Transactional
    public int deleteByName(String name) {
        return countryRepository.deleteByName(name);
    }
}


