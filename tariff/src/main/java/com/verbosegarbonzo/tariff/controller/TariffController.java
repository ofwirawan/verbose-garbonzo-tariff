package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;
import com.verbosegarbonzo.tariff.service.TariffService;

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

}
