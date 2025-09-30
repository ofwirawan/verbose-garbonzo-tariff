package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/admin/countries")
public class AdminCountryController {

    private final CountryRepository countryRepository;

    public AdminCountryController(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    // Create a new country
    @PostMapping
    public ResponseEntity<?> createCountry(@Valid @RequestBody Country country) {
        boolean exists = countryRepository.findAll().stream()
                .anyMatch(c -> c.getNumericCode().equals(country.getNumericCode()));
        if (exists) { // If a country with the same numeric code exists
            String message = "A country with numeric code '" + country.getNumericCode() + "' already exists.";
            return ResponseEntity.status(409).body(message);
        }
        Country created = countryRepository.save(country);
        return ResponseEntity.status(201).body(created);
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
    public ResponseEntity<?> updateCountry(@PathVariable String countryCode,
            @Valid @RequestBody Country updatedCountry) {
        return countryRepository.findById(countryCode)
                .map(existingCountry -> {
                    boolean exists = countryRepository.findAll().stream()
                            .anyMatch(c -> c.getNumericCode().equals(updatedCountry.getNumericCode())
                                    && !c.getCountryCode().equals(countryCode));
                    if (exists) {
                        String message = "A country with numeric code '" + updatedCountry.getNumericCode()
                                + "' already exists.";
                        return ResponseEntity.status(409).body(message);
                    }
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
