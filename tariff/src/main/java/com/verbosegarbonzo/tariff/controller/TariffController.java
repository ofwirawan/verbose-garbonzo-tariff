package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.dto.TariffCalculationRequest;
import com.verbosegarbonzo.tariff.dto.TariffCalculationResponse;
import com.verbosegarbonzo.tariff.service.TariffCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tariff")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Allow frontend to call this API
public class TariffController {

    private final TariffCalculationService tariffCalculationService;

    @PostMapping("/calculate")
    public ResponseEntity<?> calculateTariff(
            @Valid @RequestBody TariffCalculationRequest request,
            BindingResult bindingResult) {
        
        try {
            log.info("Received tariff calculation request: {} -> {}", 
                     request.getExportingCountry(), request.getImportingCountry());

            // Handle validation errors
            if (bindingResult.hasErrors()) {
                Map<String, Object> errorResponse = createValidationErrorResponse(bindingResult);
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Process the tariff calculation
            TariffCalculationResponse response = tariffCalculationService.calculateTariff(request);

            // Return appropriate HTTP status based on calculation result
            if ("SUCCESS".equals(response.getStatus())) {
                return ResponseEntity.ok(response);
            } else if ("ERROR".equals(response.getStatus())) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            } else {
                return ResponseEntity.ok(response); // For WARNING or other statuses
            }

        } catch (Exception e) {
            log.error("Unexpected error in tariff calculation", e);
            Map<String, Object> errorResponse = createGenericErrorResponse(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Tariff Calculator");
        health.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(health);
    }

    private Map<String, Object> createValidationErrorResponse(BindingResult bindingResult) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "VALIDATION_ERROR");
        errorResponse.put("message", "Invalid input data");
        errorResponse.put("errors", bindingResult.getFieldErrors().stream()
                .collect(Collectors.toMap(
                        error -> error.getField(),
                        error -> error.getDefaultMessage()
                )));
        errorResponse.put("timestamp", java.time.LocalDateTime.now().toString);
        return errorResponse;
    }

    private Map<String, Object> createGenericErrorResponse(Exception e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "ERROR");
        errorResponse.put("message", "An unexpected error occurred");
        errorResponse.put("error", e.getMessage());
        errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
        return errorResponse;
    }
}

