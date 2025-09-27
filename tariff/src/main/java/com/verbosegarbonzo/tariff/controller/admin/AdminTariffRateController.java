package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.TariffRate;
import com.verbosegarbonzo.tariff.service.TariffRateService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;


@RestController
@RequestMapping("/api/admin/tariffrates")
public class AdminTariffRateController {

    private final TariffRateService tariffRateService;

    public AdminTariffRateController(TariffRateService tariffRateService) {
        this.tariffRateService = tariffRateService;
    }

    @PostMapping
    public ResponseEntity<TariffRate> create(@RequestBody TariffRate tariffRate) {
        TariffRate created = tariffRateService.create(tariffRate);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{hs6Code}/{importing}/{exporting}/{date}")
    public ResponseEntity<TariffRate> getById(
        @PathVariable String hs6Code, 
        @PathVariable String importing,
        @PathVariable String exporting,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        TariffRate tariffRate = tariffRateService.getById(hs6Code, importing, exporting, date);
        return ResponseEntity.ok(tariffRate);
    }

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

    @PutMapping("/{hs6Code}/{importing}/{exporting}/{date}")
    public ResponseEntity<String> update(
        @PathVariable String hs6Code,
        @PathVariable String importing,
        @PathVariable String exporting,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestBody TariffRate rateUpdate) {

        boolean success = tariffRateService.updateTariffRate(hs6Code, importing, exporting, date,
            rateUpdate.getRate(), rateUpdate.getExpiry(), rateUpdate.getId().getDate());

        if (success) {
            return ResponseEntity.ok("Tariff rate updated successfully");
        } else {
            return ResponseEntity.badRequest().body("Update failed or tariff rate not found");
        }
    }

    @DeleteMapping("/{hs6Code}/{importing}/{exporting}/{date}")
    public ResponseEntity<String> delete(
        @PathVariable String hs6Code,
        @PathVariable String importing,
        @PathVariable String exporting,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        boolean deleted = tariffRateService.delete(hs6Code, importing, exporting, date);
        if (deleted) {
            return ResponseEntity.ok("Tariff rate deleted successfully");
        } else {
            return ResponseEntity.badRequest().body("Tariff rate not found");
        }
    }
}

