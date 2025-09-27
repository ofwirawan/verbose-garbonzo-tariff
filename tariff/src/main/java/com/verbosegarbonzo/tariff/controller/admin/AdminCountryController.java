package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.service.CountryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/countries")
public class AdminCountryController {

    private final CountryService countryService;

    public AdminCountryController(CountryService countryService) {
        this.countryService = countryService;
    }

    // Search countries by name, iso3 code, or numeric code
    @GetMapping("/search")
    public ResponseEntity<List<Country>> searchCountries(@RequestParam String query) {
        List<Country> results = countryService.searchCountries(query);
        return ResponseEntity.ok(results);
    }

    // Update both iso3 and name by numericCode
    @PutMapping("/update")
    public ResponseEntity<String> updateCountry(@RequestParam String numericCode,
                                                @RequestParam String iso3,
                                                @RequestParam String name) {
        int updated = countryService.updateCountry(numericCode, iso3, name);
        if (updated > 0) {
            return ResponseEntity.ok("Country updated successfully.");
        } else {
            return ResponseEntity.badRequest().body("Failed to update country.");
        }
    }

    // Update iso3 by country name
    @PutMapping("/updateIso3ByName")
    public ResponseEntity<String> updateIso3ByName(@RequestParam String name,
                                                    @RequestParam String iso3) {
        int updated = countryService.updateIso3ByName(iso3, name);
        if (updated > 0) {
            return ResponseEntity.ok("Iso3 code updated successfully.");
        } else {
            return ResponseEntity.badRequest().body("Failed to update iso3 code.");
        }
    }

    // Update country name by iso3 code
    @PutMapping("/updateNameByIso3")
    public ResponseEntity<String> updateNameByIso3(@RequestParam String iso3,
                                                   @RequestParam String name) {
        int updated = countryService.updateNameByIso3(name, iso3);
        if (updated > 0) {
            return ResponseEntity.ok("Country name updated successfully.");
        } else {
            return ResponseEntity.badRequest().body("Failed to update country name.");
        }
    }

    // Delete country by iso3 code
    @DeleteMapping("/deleteIso3/{iso3}")
    public ResponseEntity<String> deleteByIso3(@PathVariable String iso3) {
        int deleted = countryService.deleteByIso3(iso3);
        if (deleted > 0) {
            return ResponseEntity.ok("Country deleted successfully.");
        } else {
            return ResponseEntity.badRequest().body("Failed to delete country.");
        }
    }

    // Delete country by name
    @DeleteMapping("/deleteName/{name}")
    public ResponseEntity<String> deleteByName(@PathVariable String name) {
        int deleted = countryService.deleteByName(name);
        if (deleted > 0) {
            return ResponseEntity.ok("Country deleted successfully.");
        } else {
            return ResponseEntity.badRequest().body("Failed to delete country.");
        }
    }
}
