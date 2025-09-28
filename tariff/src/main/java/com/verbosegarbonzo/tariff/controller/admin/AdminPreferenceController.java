package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Preference;
import com.verbosegarbonzo.tariff.repository.PreferenceRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/preferences")
public class AdminPreferenceController {

    private final PreferenceRepository preferenceRepository;

    public AdminPreferenceController(PreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    // Create new preference
    @PostMapping
    public ResponseEntity<Preference> createPreference(@Valid @RequestBody Preference preference) {
        Preference created = preferenceRepository.save(preference);
        return ResponseEntity.status(201).body(created);
    }

    // Get preference by id
    @GetMapping("/{id}")
    public ResponseEntity<Preference> getPreferenceById(@PathVariable Long id) {
        return preferenceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get all preferences
    @GetMapping
    public List<Preference> getAllPreferences() {
        return preferenceRepository.findAll();
    }

    // Search valid or open-ended preferences at given date
    @GetMapping("/search")
    public List<Preference> searchValidPreferences(@RequestParam String hs6Code,
                                                   @RequestParam String importer,
                                                   @RequestParam String exporter,
                                                   @RequestParam LocalDate date) {
        return preferenceRepository.findValidOrOpenEndedAtDate(hs6Code, importer, exporter, date);
    }

    // Find closest validFrom before date
    @GetMapping("/closest-validfrom")
    public List<Preference> findClosestValidFromBefore(@RequestParam String hs6Code,
                                                       @RequestParam String importer,
                                                       @RequestParam String exporter,
                                                       @RequestParam LocalDate date) {
        return preferenceRepository.findClosestValidFromBefore(hs6Code, importer, exporter, date);
    }

    // Find preferences with validFrom between dates
    @GetMapping("/between")
    public List<Preference> findAllByValidFromBetween(@RequestParam String hs6Code,
                                                      @RequestParam String importer,
                                                      @RequestParam String exporter,
                                                      @RequestParam LocalDate startDate,
                                                      @RequestParam LocalDate endDate) {
        return preferenceRepository.findAllByValidFromBetween(hs6Code, importer, exporter, startDate, endDate);
    }

    // Update prefAdValRate by preference ID
    @PutMapping("/{id}/rate")
    public ResponseEntity<String> updatePrefAdValRate(@PathVariable Long id, @RequestParam BigDecimal rate) {
        int updated = preferenceRepository.updatePrefAdValRateById(id, rate);
        if (updated == 1) {
            return ResponseEntity.ok("Preference prefAdValRate updated");
        }
        return ResponseEntity.notFound().build();
    }

    // Update validTo by preference ID
    @PutMapping("/{id}/validto")
    public ResponseEntity<String> updateValidTo(@PathVariable Long id, @RequestParam LocalDate validTo) {
        int updated = preferenceRepository.updateValidToById(id, validTo);
        if (updated == 1) {
            return ResponseEntity.ok("Preference validTo updated");
        }
        return ResponseEntity.notFound().build();
    }

    // Update both prefAdValRate and validTo by preference ID
    @PutMapping("/{id}/rate-validto")
    public ResponseEntity<String> updateRateAndValidTo(@PathVariable Long id, 
                                                      @RequestParam BigDecimal rate,
                                                      @RequestParam LocalDate validTo) {
        int updated = preferenceRepository.updateRateAndValidToById(id, rate, validTo);
        if (updated == 1) {
            return ResponseEntity.ok("Preference rate and validTo updated");
        }
        return ResponseEntity.notFound().build();
    }

    // Delete preference by id
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePreferenceById(@PathVariable Long id) {
        if (preferenceRepository.existsById(id)) {
            preferenceRepository.deleteById(id);
            return ResponseEntity.ok("Deleted preference with id: " + id);
        }
        return ResponseEntity.notFound().build();
    }
}

