package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.service.CountryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin/countries")
public class AdminCountryController {

    private final CountryService countryService;

    public AdminCountryController(CountryService countryService) {
        this.countryService = countryService;
    }

    // Create a new country
    @PostMapping
    public ResponseEntity<Country> create(@Valid @RequestBody Country country) {
        Country created = countryService.create(country);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Read country by numericCode (id)
    @GetMapping("/{id}")
    public ResponseEntity<Country> getById(@PathVariable("id") String numericCode) {
        try {
            Country country = countryService.getById(numericCode);
            return ResponseEntity.ok(country);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete country by numericCode (id)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String numericCode) {
        try {
            countryService.deleteById(numericCode);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Search countries by partial query on name, iso3, numericCode
    @GetMapping("/search")
    public ResponseEntity<List<Country>> searchCountries(@RequestParam String query) {
        List<Country> result = countryService.searchCountries(query);
        return ResponseEntity.ok(result);
    }

    // Update: update iso3 and name by numericCode
    @PutMapping("/update")
    public ResponseEntity<String> updateCountry(@RequestParam String numericCode,
                                                @RequestParam String iso3,
                                                @RequestParam String name) {
        int updated = countryService.updateCountry(numericCode, iso3, name);
        if (updated > 0) {
            return ResponseEntity.ok("Country updated successfully.");
        }
        return ResponseEntity.badRequest().body("Country update failed.");
    }

    // Update iso3 by country name
    @PutMapping("/updateIso3ByName")
    public ResponseEntity<String> updateIso3ByName(@RequestParam String name,
                                                   @RequestParam String iso3) {
        int updated = countryService.updateIso3ByName(iso3, name);
        if (updated > 0) {
            return ResponseEntity.ok("Iso3 code updated successfully.");
        }
        return ResponseEntity.badRequest().body("Iso3 code update failed.");
    }

    // Update country name by iso3
    @PutMapping("/updateNameByIso3")
    public ResponseEntity<String> updateNameByIso3(@RequestParam String iso3,
                                                   @RequestParam String name) {
        int updated = countryService.updateNameByIso3(name, iso3);
        if (updated > 0) {
            return ResponseEntity.ok("Country name updated successfully.");
        }
        return ResponseEntity.badRequest().body("Country name update failed.");
    }

    // Delete by iso3
    @DeleteMapping("/deleteIso3/{iso3}")
    public ResponseEntity<String> deleteByIso3(@PathVariable String iso3) {
        int deleted = countryService.deleteByIso3(iso3);
        if (deleted > 0) {
            return ResponseEntity.ok("Country deleted successfully.");
        }
        return ResponseEntity.badRequest().body("Country deletion failed.");
    }

    // Delete by name
    @DeleteMapping("/deleteName/{name}")
    public ResponseEntity<String> deleteByName(@PathVariable String name) {
        int deleted = countryService.deleteByName(name);
        if (deleted > 0) {
            return ResponseEntity.ok("Country deleted successfully.");
        }
        return ResponseEntity.badRequest().body("Country deletion failed.");
    }
}
