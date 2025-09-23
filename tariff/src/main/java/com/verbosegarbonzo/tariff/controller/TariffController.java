package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;
import com.verbosegarbonzo.tariff.service.TariffService;
import com.verbosegarbonzo.tariff.service.TariffService.RateNotFoundException;
import com.verbosegarbonzo.tariff.service.TariffService.ExternalServiceException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tariff")
public class TariffController {

    private final TariffService service;

    public TariffController(TariffService service) {
        this.service = service;
    }

    @PostMapping("/calculate")
    public ResponseEntity<CalculateResponse> calculate(@Valid @RequestBody CalculateRequest req) {
        return ResponseEntity.ok(service.calculate(req)); //does the WITS call and tariff calculation.
    }

    @ExceptionHandler(RateNotFoundException.class)
    public ResponseEntity<?> handleNotFound(RateNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorPayload("RATE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<?> handleExternal(ExternalServiceException ex) {
        return ResponseEntity.status(502).body(new ErrorPayload("EXTERNAL_SERVICE_ERROR", ex.getMessage()));
    }

    record ErrorPayload(String error, String message) {}
}
