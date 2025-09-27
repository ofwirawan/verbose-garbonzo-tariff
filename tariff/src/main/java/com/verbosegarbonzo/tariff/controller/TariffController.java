package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.dto.BaseRateCalculateResponse;
import com.verbosegarbonzo.tariff.model.*;
import com.verbosegarbonzo.tariff.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.verbosegarbonzo.tariff.service.TariffService.RateNotFoundException;
import com.verbosegarbonzo.tariff.service.TariffService.ExternalServiceException;

@RestController
@RequestMapping("/api")
public class TariffController {

    private final TariffService service;

    public TariffController(TariffService service) {
        this.service = service;
    }

    @PostMapping("/calculate")
    public ResponseEntity<CalculateResponse> calculate(@Valid @RequestBody CalculateRequest req) {
        return ResponseEntity.ok(service.calculate(req)); //does the external api call and tariff calculation.
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
