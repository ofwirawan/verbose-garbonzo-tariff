package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    // Search products with pagination
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam String q,
                                                        @RequestParam int page,
                                                        @RequestParam int size) {
        List<Product> products = productService.searchProducts(q, PageRequest.of(page, size));
        return ResponseEntity.ok(products);
    }

    // Upsert product (create or update)
    @PostMapping("/upsert")
    public ResponseEntity<Product> upsertProduct(@Valid @RequestBody Product product) {
        Product upserted = productService.upsert(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(upserted);
    }

    // Get product by HS6 code
    @GetMapping("/{hs6}")
    public ResponseEntity<Product> getById(@PathVariable("hs6") String hs6Code) {
        try {
            Product product = productService.getById(hs6Code);
            return ResponseEntity.ok(product);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update product
    @PutMapping("/{hs6}")
    public ResponseEntity<Product> update(@PathVariable("hs6") String hs6Code,
                                          @Valid @RequestBody Product product) {
        try {
            Product updated = productService.update(hs6Code, product);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete product by HS6 code
    @DeleteMapping("/{hs6}")
    public ResponseEntity<Void> delete(@PathVariable("hs6") String hs6Code) {
        try {
            productService.deleteById(hs6Code);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}



