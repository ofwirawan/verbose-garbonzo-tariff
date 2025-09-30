package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductRepository productRepository;

    public AdminProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Create new product
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        Product created = productRepository.save(product);
        return ResponseEntity.status(201).body(created);
    }

    // Get all products (paginated)
    @GetMapping
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    // Get product by hs6Code
    @GetMapping("/{hs6Code}")
    public ResponseEntity<Product> getProductById(@PathVariable String hs6Code) {
        return productRepository.findById(hs6Code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update product by hs6Code
    @PutMapping("/{hs6Code}")
    public ResponseEntity<Product> updateProduct(@PathVariable String hs6Code,
            @Valid @RequestBody Product updatedProduct) {
        return productRepository.findById(hs6Code)
                .map(existingProduct -> {
                    existingProduct.setDescription(updatedProduct.getDescription());
                    Product saved = productRepository.save(existingProduct);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete product by hs6Code
    @DeleteMapping("/{hs6Code}")
    public ResponseEntity<Void> deleteProductById(@PathVariable String hs6Code) {
        if (productRepository.existsById(hs6Code)) {
            productRepository.deleteById(hs6Code);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
