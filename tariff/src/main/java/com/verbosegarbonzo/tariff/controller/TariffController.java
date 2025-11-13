package com.verbosegarbonzo.tariff.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;
import com.verbosegarbonzo.tariff.service.TariffService;

import jakarta.validation.Valid;

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
                .ok().body(resp);
    }

    @PostMapping("/calculate/batch")
    public ResponseEntity<List<CalculateResponse>> calculateBatch(@Valid @RequestBody List<CalculateRequest> requests) {
        List<CalculateResponse> responses = requests.stream()
                .map(service::calculate)
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok().body(responses);
    }

}
