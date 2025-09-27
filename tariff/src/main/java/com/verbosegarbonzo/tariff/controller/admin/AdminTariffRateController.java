package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.dto.BaseTariffRateDTO;
import com.verbosegarbonzo.tariff.service.TariffRateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/tariffrates")
public class AdminTariffRateController {

    private final TariffRateService tariffRateService;

    public AdminTariffRateController(TariffRateService tariffRateService) {
        this.tariffRateService = tariffRateService;
    }

    // Create a new tariff rate
    @PostMapping
    public ResponseEntity<BaseTariffRateDTO> create(@Valid @RequestBody BaseTariffRateDTO dto) {
        BaseTariffRateDTO created = tariffRateService.createTariffRate(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Get tariff rate valid at date or closest before date
    @GetMapping("/findClosest")
    public ResponseEntity<BaseTariffRateDTO> getValidOrClosest(
            @RequestParam String hs6Code,
            @RequestParam String importing,
            @RequestParam String exporting,
            @RequestParam String date) {
        LocalDate queryDate = LocalDate.parse(date);
        Optional<BaseTariffRateDTO> tariffOpt = tariffRateService.findValidOrClosest(hs6Code, importing, exporting, queryDate);
        return tariffOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Search tariff rates by start date range
    @GetMapping("/search")
    public ResponseEntity<List<BaseTariffRateDTO>> searchBetweenStartDates(
            @RequestParam String hs6Code,
            @RequestParam String importing,
            @RequestParam String exporting,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        List<BaseTariffRateDTO> result = tariffRateService.searchByStartDateRange(
                hs6Code, importing, exporting, LocalDate.parse(startDate), LocalDate.parse(endDate));
        return ResponseEntity.ok(result);
    }

    // Update tariff rate fully by id
    @PutMapping("/{id}")
    public ResponseEntity<BaseTariffRateDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody BaseTariffRateDTO dto) {
        try {
            BaseTariffRateDTO updated = tariffRateService.updateTariffRateById(id, dto);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update only rate by id
    @PutMapping("/{id}/rate")
    public ResponseEntity<BaseTariffRateDTO> updateRate(
            @PathVariable Long id,
            @RequestParam Double rate) {
        try {
            BaseTariffRateDTO updated = tariffRateService.updateRate(id, rate);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update only expiry by id
    @PutMapping("/{id}/expiry")
    public ResponseEntity<BaseTariffRateDTO> updateExpiry(
            @PathVariable Long id,
            @RequestParam String expiry) {
        try {
            LocalDate expiryDate = LocalDate.parse(expiry);
            BaseTariffRateDTO updated = tariffRateService.updateExpiry(id, expiryDate);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete tariff rate by id
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            tariffRateService.deleteTariffRateById(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
