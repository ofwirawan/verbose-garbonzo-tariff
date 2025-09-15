package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.dto.*;
import com.verbosegarbonzo.tariff.entity.Country;
import com.verbosegarbonzo.tariff.service.TariffCalculationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tariff")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tariff Calculator", description = "APIs for tariff calculation and management")
@CrossOrigin(origins = "*")
public class TariffController {

    private final TariffCalculationService tariffCalculationService;

    @PostMapping("/calculate")
    @Operation(summary = "Calculate tariff cost", 
               description = "Calculate tariff cost based on trade information. HS code is optional for detailed classification.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tariff calculated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input parameters"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<TariffCalculationResponse> calculateTariff(
            @Valid @RequestBody TariffCalculationRequest request) {
        log.info("Received tariff calculation request: {}", request);
        
        try {
            TariffCalculationResponse response = tariffCalculationService.calculateTariff(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error calculating tariff", e);
            throw new RuntimeException("Failed to calculate tariff: " + e.getMessage());
        }
    }

    @PostMapping("/save")
    @Operation(summary = "Save calculation", 
               description = "Save a tariff calculation to user's history")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Calculation saved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid calculation data"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<TariffCalculationResponse> saveCalculation(
            @Valid @RequestBody TariffCalculationResponse calculation) {
        log.info("Saving calculation: {}", calculation);
        
        try {
            TariffCalculationResponse response = tariffCalculationService.saveCalculationFromResponse(calculation);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error saving calculation", e);
            throw new RuntimeException("Failed to save calculation: " + e.getMessage());
        }
    }

    @GetMapping("/countries")
    @Operation(summary = "Get countries list", 
               description = "Retrieve list of all countries")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Countries retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<Country>> getCountries() {
        log.info("Fetching countries list");
        
        try {
            List<Country> countries = tariffCalculationService.getAllCountries();
            return ResponseEntity.ok(countries);
        } catch (Exception e) {
            log.error("Error fetching countries", e);
            throw new RuntimeException("Failed to fetch countries: " + e.getMessage());
        }
    }

    @GetMapping("/history")
    @Operation(summary = "Get calculation history", 
               description = "Retrieve user's calculation history")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "History retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<TariffCalculationResponse>> getCalculationHistory(
            @Parameter(description = "User ID")
            @RequestParam(defaultValue = "default-user") String userId) {
        log.info("Fetching calculation history for user: {}", userId);
        
        try {
            List<TariffCalculationResponse> history = tariffCalculationService.getCalculationHistory(userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error fetching calculation history", e);
            throw new RuntimeException("Failed to fetch calculation history: " + e.getMessage());
        }
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get analytics data", 
               description = "Retrieve analytics data for dashboard")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Analytics data retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<AnalyticsResponse> getAnalyticsData() {
        log.info("Fetching analytics data");
        
        try {
            AnalyticsResponse analytics = tariffCalculationService.getAnalyticsData();
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            log.error("Error fetching analytics data", e);
            throw new RuntimeException("Failed to fetch analytics data: " + e.getMessage());
        }
    }
}
