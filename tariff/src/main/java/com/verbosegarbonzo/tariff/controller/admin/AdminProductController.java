package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    @Autowired
    private ProductService productService;

    // Create new product
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        Product created = productService.create(product);
        return ResponseEntity.status(201).body(created);
    }

    // Update product description by id
    @PutMapping("/{hs6Code}/description")
    public ResponseEntity<Product> updateDescription(
            @PathVariable String hs6Code,
            @RequestBody String description) {
        try {
            Product updated = productService.update(hs6Code, description);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Search products by description with pagination
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(
            @RequestParam String description,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<Product> products = productService.searchByDescription(description, page, size);
        return ResponseEntity.ok(products);
    }

    // Delete products by exact description
    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteByDescription(@RequestParam String description) {
        int deletedCount = productService.deleteByDescription(description);
        return ResponseEntity.ok("Deleted " + deletedCount + " products with description: " + description);
    }

    // Delete products by description like (pattern match)
    @DeleteMapping("/delete-like")
    public ResponseEntity<String> deleteByDescriptionLike(@RequestParam String pattern) {
        int deletedCount = productService.deleteByDescriptionLike(pattern);
        return ResponseEntity.ok("Deleted " + deletedCount + " products matching description pattern: " + pattern);
    }

    // Delete product by ID
    @DeleteMapping("/{hs6Code}")
    public ResponseEntity<String> deleteProductById(@PathVariable String hs6Code) {
        try {
            productService.deleteById(hs6Code);
            return ResponseEntity.ok("Product deleted with id: " + hs6Code);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get product by ID
    @GetMapping("/{hs6Code}")
    public ResponseEntity<Product> getProductById(@PathVariable String hs6Code) {
        try {
            Product product = productService.getById(hs6Code);
            return ResponseEntity.ok(product);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
