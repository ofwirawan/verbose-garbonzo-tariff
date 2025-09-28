package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Suspension;
import com.verbosegarbonzo.tariff.repository.SuspensionRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin/suspensions")
public class AdminSuspensionController {

    private final SuspensionRepository suspensionRepository;

    public AdminSuspensionController(SuspensionRepository suspensionRepository) {
        this.suspensionRepository = suspensionRepository;
    }

    // Create new Suspension
    @PostMapping
    public ResponseEntity<Suspension> createSuspension(@Valid @RequestBody Suspension suspension) {
        Suspension created = suspensionRepository.save(suspension);
        return ResponseEntity.status(201).body(created);
    }

    // Get Suspension by ID
    @GetMapping("/{id}")
    public ResponseEntity<Suspension> getSuspensionById(@PathVariable Long id) {
        return suspensionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get active suspensions by importer, product, and date
    @GetMapping("/active")
    public List<Suspension> findActiveSuspensions(@RequestParam String importer,
                                                  @RequestParam String hs6Code,
                                                  @RequestParam LocalDate date) {
        return suspensionRepository.findActiveSuspensions(importer, hs6Code, date);
    }

    // Update suspensionFlag and suspensionNote by ID
    @PutMapping("/{id}/flag-note")
    public ResponseEntity<String> updateFlagAndNote(@PathVariable Long id,
                                                    @RequestParam Boolean flag,
                                                    @RequestParam String note) {
        int updated = suspensionRepository.updateFlagAndNoteById(id, flag, note);
        if (updated == 1) {
            return ResponseEntity.ok("Suspension flag and note updated");
        }
        return ResponseEntity.notFound().build();
    }

    // Update validTo date by ID
    @PutMapping("/{id}/validto")
    public ResponseEntity<String> updateValidTo(@PathVariable Long id, @RequestParam LocalDate validTo) {
        int updated = suspensionRepository.updateValidToById(id, validTo);
        if (updated == 1) {
            return ResponseEntity.ok("Suspension validTo updated");
        }
        return ResponseEntity.notFound().build();
    }

    // Delete Suspension by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSuspensionById(@PathVariable Long id) {
        try {
            suspensionRepository.deleteById(id);
            return ResponseEntity.ok("Deleted suspension with id: " + id);
        } catch (NoSuchElementException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}

