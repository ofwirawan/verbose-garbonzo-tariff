package com.verbosegarbonzo.tariff.service.admin;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // Get all countries (paginated)
    public Page<Country> getAll(Pageable pageable) {
        return countryRepository.findAll(pageable);
    }

    // Get country by countryCode
    public Country getByCountryCode(String countryCode) {
        return countryRepository.findById(countryCode)
                .orElseThrow(() -> new NoSuchElementException("Country not found with code " + countryCode));
    }

    // Update country by countryCode
    @Transactional
    public Country update(String countryCode, Country updatedCountry) {
        Country existingCountry = getByCountryCode(countryCode);
        existingCountry.setNumericCode(updatedCountry.getNumericCode());
        existingCountry.setName(updatedCountry.getName());
        return countryRepository.save(existingCountry);
    }

    // Delete country by countryCode
    @Transactional
    public void deleteByCountryCode(String countryCode) {
        if (!countryRepository.existsById(countryCode)) {
            throw new NoSuchElementException("Country not found with code " + countryCode);
        }
        countryRepository.deleteById(countryCode);
    }
}
