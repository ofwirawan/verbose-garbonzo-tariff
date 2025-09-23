package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.client.WitsMetadataClient;
import com.verbosegarbonzo.tariff.model.CountryRef;
import com.verbosegarbonzo.tariff.model.ProductRef;
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
    public ResponseEntity<List<CountryRef>> countries(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) { //ignore queries < 2 chars
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(client.searchCountries(query.trim()));
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductRef>> products(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) { //ignore queries < 2 chars
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(client.searchProducts(query.trim()));
    }
}
