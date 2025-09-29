package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.client.WitsMetadataClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    private final WitsMetadataClient client;

    public MetadataController(WitsMetadataClient client) {
        this.client = client;
    }

    @PostMapping("/countries/sync")
    public ResponseEntity<String> syncCountries() {
        try {
            client.loadCountries(); //load and save to Supabase
            return ResponseEntity.ok("Countries synced successfully!");
        } catch (Exception e) {
            String msg = (e.getCause() == null) ? e.getMessage() : (e.getMessage() + " | cause: " + e.getCause());
            return ResponseEntity.internalServerError().body("Failed to sync countries: " + msg);
        }
    }

    @PostMapping("/products/sync")
    public ResponseEntity<String> syncProducts() {
        try {
            client.loadProducts(); //load and save to Supabase
            return ResponseEntity.ok("Products synced successfully!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to sync: " + e.getMessage());
        }
    }
}

