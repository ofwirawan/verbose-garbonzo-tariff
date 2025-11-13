package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.client.WitsMetadataClient;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    private final WitsMetadataClient client;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;

    public MetadataController(WitsMetadataClient client, CountryRepository countryRepository, ProductRepository productRepository) {
        this.client = client;
        this.countryRepository = countryRepository;
        this.productRepository = productRepository;
    }

    /**
     * GET all countries sorted by name
     * Used by frontend to populate country dropdowns
     * Returns all fields from the country table
     */
    @GetMapping("/countries")
    public ResponseEntity<List<Country>> getCountries() {
        try {
            List<Country> countries = countryRepository.findAll();
            return ResponseEntity.ok(countries);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET all products sorted by description
     * Used by frontend to populate product dropdowns
     * Returns hs6code and description fields
     */
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getProducts() {
        try {
            List<Product> products = productRepository.findAll();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/countries/sync")
    public ResponseEntity<String> syncCountries() {
        try {
            client.loadCountries(); //load and save to Supabase
            return ResponseEntity.ok("Countries synced successfully!");
        } catch (Exception e) {
            // String msg = (e.getCause() == null) ? e.getMessage() : (e.getMessage() + " | cause: " + e.getCause());
            return ResponseEntity.internalServerError().body("Failed to sync countries: API error");
        }
    }

    @PostMapping("/products/sync")
    public ResponseEntity<String> syncProducts() {
        try {
            client.loadProducts(); //load and save to Supabase
            return ResponseEntity.ok("Products synced successfully!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to sync products: API error");
        }
    }
}

