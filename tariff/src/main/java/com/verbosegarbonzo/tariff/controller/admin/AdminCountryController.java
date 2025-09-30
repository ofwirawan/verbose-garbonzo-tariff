package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;

import java.util.List;


@RestController
@RequestMapping("/api/admin/countries")
public class AdminCountryController {

    private final CountryRepository countryRepository;

    public AdminCountryController(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    // Create a new country
    @PostMapping
    public Country createCountry(@Valid @RequestBody Country country) {
        return countryRepository.save(country);
    }

    // Get all countries
    @GetMapping
    public Page<Country> getAllCountries(Pageable pageable) {
        return countryRepository.findAll(pageable);
    }

    // Get country by countryCode
    @GetMapping("/{countryCode}")
    public ResponseEntity<Country> getCountryById(@PathVariable String countryCode) {
        return countryRepository.findById(countryCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update country by countryCode
    @PutMapping("/{countryCode}")
    public ResponseEntity<Country> updateCountry(@PathVariable String countryCode,
            @Valid @RequestBody Country updatedCountry) {
        return countryRepository.findById(countryCode)
                .map(existingCountry -> {
                    existingCountry.setNumericCode(updatedCountry.getNumericCode());
                    existingCountry.setName(updatedCountry.getName());
                    Country saved = countryRepository.save(existingCountry);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete country by countryCode
    @DeleteMapping("/{countryCode}")
    public ResponseEntity<Void> deleteCountry(@PathVariable String countryCode) {
        if (countryRepository.existsById(countryCode)) {
            countryRepository.deleteById(countryCode);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
