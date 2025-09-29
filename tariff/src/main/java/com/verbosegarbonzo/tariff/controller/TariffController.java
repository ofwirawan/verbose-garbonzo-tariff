package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;
import com.verbosegarbonzo.tariff.service.TariffService;
import com.verbosegarbonzo.tariff.exception.RateNotFoundException;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api")
public class TariffController {

    private final TariffService service;

    public TariffController(TariffService service) {
        this.service = service;
    }

    @PostMapping("/calculate")
    public ResponseEntity<CalculateResponse> calculate(@Valid @RequestBody CalculateRequest req) {
        CalculateResponse resp = service.calculate(req);

        //return 201 Created with Location header
        return ResponseEntity
                .created(URI.create("/api/transactions/" + resp.getTransactionId()))
                .body(resp);
    }

    @ExceptionHandler(RateNotFoundException.class)
    public ResponseEntity<?> handleNotFound(RateNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorPayload("RATE_NOT_FOUND", ex.getMessage()));
    }

    record ErrorPayload(String error, String message) {}
}
