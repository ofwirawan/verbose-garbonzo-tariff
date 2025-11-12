package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;

import jakarta.validation.Valid;
import lombok.NonNull;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin/countries")
public class AdminCountryController {

    private final CountryRepository countryRepository;

    public AdminCountryController(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    // Create a new country
    @PostMapping
    public ResponseEntity<Country> createCountry(@Valid @RequestBody Country country) {
        boolean exists = countryRepository.findAll().stream()
                .anyMatch(c -> c.getNumericCode().equals(country.getNumericCode()));
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A country with numeric code '" + country.getNumericCode() + "' already exists.");
        }
        if (country.getCountryCode().length() != 3 || country.getNumericCode().length() != 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Country code & numeric code must be of length 3.");
        }
        try {
            Integer.valueOf(country.getNumericCode());
            Country created = countryRepository.save(country);
            return ResponseEntity.status(201).body(created);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Numeric code must be numeric");
        }

    }

    // Get all countries with optional search
    @GetMapping
    public Page<Country> getAllCountries(
            @RequestParam(required = false) String search,
            @NonNull Pageable pageable) {       
        if (search != null && !search.isEmpty()) {
            return countryRepository.findByNameContainingIgnoreCaseOrCountryCodeContainingIgnoreCaseOrNumericCodeContaining(
                    search, search, search, pageable);
        }
        return countryRepository.findAll(pageable);
    }

    // Get country by countryCode
    @GetMapping("/{countryCode}")
    public ResponseEntity<Country> getCountryById(@PathVariable @NonNull String countryCode) {
        return countryRepository.findById(countryCode)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Country not found"));
    }

    // Update country by countryCode
    @PutMapping("/{countryCode}")
    public ResponseEntity<Country> updateCountry(@PathVariable @NonNull String countryCode,
            @Valid @RequestBody Country updatedCountry) {
        Country existingCountry = countryRepository.findById(countryCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Country not found"));

        boolean exists = countryRepository.findAll().stream()
                .anyMatch(c -> c.getNumericCode().equals(updatedCountry.getNumericCode())
                && !c.getCountryCode().equals(countryCode));
                
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A country with numeric code '" + updatedCountry.getNumericCode() + "' already exists.");
        }
        existingCountry.setNumericCode(updatedCountry.getNumericCode());
        existingCountry.setName(updatedCountry.getName());
        Country saved = countryRepository.save(existingCountry);
        return ResponseEntity.ok(saved);
    }

    // Delete country by countryCode
    @DeleteMapping("/{countryCode}")
    public ResponseEntity<Void> deleteCountry(@PathVariable @NonNull String countryCode) {
        if (!countryRepository.existsById(countryCode)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Country not found");
        }
        countryRepository.deleteById(countryCode);
        return ResponseEntity.noContent().build();
    }  
}
