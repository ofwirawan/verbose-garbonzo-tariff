package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin/measures")
public class AdminMeasureController {

    private final MeasureRepository measureRepository;

    public AdminMeasureController(MeasureRepository measureRepository) {
        this.measureRepository = measureRepository;
    }

    // Create new Measure
    @PostMapping
    public ResponseEntity<Measure> createMeasure(@Valid @RequestBody Measure measure) {
        Measure created = measureRepository.save(measure);
        return ResponseEntity.status(201).body(created);
    }

    // Get a Measure by ID
    @GetMapping("/{id}")
    public ResponseEntity<Measure> getMeasureById(@PathVariable Long id) {
        return measureRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get all Measures
    @GetMapping
    public List<Measure> getAllMeasures() {
        return measureRepository.findAll();
    }

    // Find valid or open-ended Measures at given date
    @GetMapping("/search")
    public List<Measure> findValidMeasuresAtDate(@RequestParam String hs6Code,
            @RequestParam String importer,
            @RequestParam LocalDate date) {
        return measureRepository.findValidOrOpenEndedAtDate(hs6Code, importer, date);
    }

    // Find closest validFrom before date
    @GetMapping("/closest-validfrom")
    public List<Measure> findClosestValidFromBefore(@RequestParam String hs6Code,
            @RequestParam String importer,
            @RequestParam LocalDate date) {
        return measureRepository.findClosestValidFromBefore(hs6Code, importer, date);
    }

    // Find Measures between validFrom dates
    @GetMapping("/between")
    public List<Measure> findAllByValidFromBetween(@RequestParam String hs6Code,
            @RequestParam String importer,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return measureRepository.findAllByValidFromBetween(hs6Code, importer, startDate, endDate);
    }

    // Update mfnAdValRate by measure ID
    @PutMapping("/{id}/rate")
    public ResponseEntity<String> updateMfnAdValRate(@PathVariable Long id, @RequestParam java.math.BigDecimal rate) {
        int updatedRows = measureRepository.updateMfnAdValRateById(id, rate);
        if (updatedRows == 1) {
            return ResponseEntity.ok("Measure mfnAdValRate updated");
        }
        return ResponseEntity.notFound().build();
    }

    // Update validTo field of Measure
    @PutMapping("/{id}/validto")
    public ResponseEntity<String> updateValidTo(@PathVariable Long id,
            @RequestParam LocalDate validto) {
        int updatedRows = measureRepository.updateValidToById(id, validto);
        if (updatedRows == 1) {
            return ResponseEntity.ok("Measure validTo updated");
        }
        return ResponseEntity.notFound().build();
    }

    // Delete Measure by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMeasureById(@PathVariable Long id) {
        try {
            measureRepository.deleteById(id);
            return ResponseEntity.ok("Deleted measure with id: " + id);
        } catch (NoSuchElementException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
