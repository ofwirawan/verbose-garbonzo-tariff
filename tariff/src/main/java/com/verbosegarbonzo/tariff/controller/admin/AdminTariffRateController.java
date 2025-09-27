package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.TariffRate;
import com.verbosegarbonzo.tariff.service.TariffRateService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin/tariffrates")
public class AdminTariffRateController {

    private final TariffRateService tariffRateService;

    public AdminTariffRateController(TariffRateService tariffRateService) {
        this.tariffRateService = tariffRateService;
    }

    // Create new tariff rate
    @PostMapping
    public ResponseEntity<TariffRate> create(@Valid @RequestBody TariffRate tariffRate) {
        TariffRate created = tariffRateService.create(tariffRate);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Read tariff rate by composite key
    @GetMapping("/{hs6Code}/{importing}/{exporting}/{date}")
    public ResponseEntity<TariffRate> getById(
            @PathVariable String hs6Code,
            @PathVariable String importing,
            @PathVariable String exporting,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            TariffRate tariffRate = tariffRateService.getById(hs6Code, importing, exporting, date);
            return ResponseEntity.ok(tariffRate);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // List tariff rates in date range for given keys
    @GetMapping("/search")
    public ResponseEntity<List<TariffRate>> search(
            @RequestParam String hs6Code,
            @RequestParam String importing,
            @RequestParam String exporting,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<TariffRate> rates = tariffRateService.findAllByIdBetweenDates(hs6Code, importing, exporting, startDate, endDate);
        return ResponseEntity.ok(rates);
    }

    // Update tariff rate by composite key
    @PutMapping("/{hs6Code}/{importing}/{exporting}/{date}")
    public ResponseEntity<String> update(
            @PathVariable String hs6Code,
            @PathVariable String importing,
            @PathVariable String exporting,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody TariffRate rateUpdate) {
        boolean updated = tariffRateService.updateTariffRate(
                hs6Code,
                importing,
                exporting,
                date,
                rateUpdate.getRate(),
                rateUpdate.getExpiry(),
                rateUpdate.getId().getDate());
        if (updated) {
            return ResponseEntity.ok("Tariff rate updated successfully");
        } else {
            return ResponseEntity.badRequest().body("Tariff rate not found or update failed");
        }
    }

    // Delete tariff rate by composite key
    @DeleteMapping("/{hs6Code}/{importing}/{exporting}/{date}")
    public ResponseEntity<String> delete(
            @PathVariable String hs6Code,
            @PathVariable String importing,
            @PathVariable String exporting,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            tariffRateService.deleteById(hs6Code, importing, exporting, date);
            return ResponseEntity.ok("Tariff rate deleted successfully");
        } catch (NoSuchElementException e) {
            return ResponseEntity.badRequest().body("Tariff rate not found");
        }
    }
}
