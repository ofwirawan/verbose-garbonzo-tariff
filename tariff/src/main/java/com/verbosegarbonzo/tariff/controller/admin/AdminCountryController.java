package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public List<Country> getAllCountries() {
        return countryRepository.findAll();
    }

    // Get country by numericCode
    @GetMapping("/{numericCode}")
    public ResponseEntity<Country> getCountryById(@PathVariable String numericCode) {
        return countryRepository.findById(numericCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Search countries by query in name, iso3code, or numericCode
    @GetMapping("/search")
    public List<Country> searchCountries(@RequestParam String query) {
        return countryRepository.searchCountries(query);
    }

    // Update country by numericCode
    @PutMapping("/{numericCode}")
    public ResponseEntity<Country> updateCountry(@PathVariable String numericCode, @Valid @RequestBody Country updatedCountry) {
        return countryRepository.findById(numericCode)
                .map(existingCountry -> {
                    countryRepository.updateCountry(numericCode, updatedCountry.getIso3code(), updatedCountry.getName());
                    // Refresh and return updated entity
                    Country refreshed = countryRepository.findById(numericCode).orElse(existingCountry);
                    return ResponseEntity.ok(refreshed);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete country by iso3code
    @DeleteMapping("/deleteByIso3/{iso3code}")
    public ResponseEntity<Void> deleteByIso3Code(@PathVariable String iso3code) {
        int deleted = countryRepository.deleteByIso3code(iso3code);
        if (deleted > 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Delete country by name
    @DeleteMapping("/deleteByName/{name}")
    public ResponseEntity<Void> deleteByName(@PathVariable String name) {
        int deleted = countryRepository.deleteByName(name);
        if (deleted > 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
