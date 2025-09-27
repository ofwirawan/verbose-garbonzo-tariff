package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.client.WitsMetadataClient;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/metadata")
public class MetadataController {
//lightweight type-ahead search for countries and HS6 products

    private final WitsMetadataClient client;

    public MetadataController(WitsMetadataClient client) {
        this.client = client;
    }

    @GetMapping("/countries")
    public ResponseEntity<List<Country>> countries(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) { //ignore queries < 2 chars
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(client.searchCountries(query.trim()));
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> products(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) { //ignore queries < 2 chars
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(client.searchProducts(query.trim()));
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

