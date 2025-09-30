package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.exception.InvalidRequestException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;

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
        if (product.getHs6Code() == null || product.getHs6Code().isEmpty()) {
            throw new InvalidRequestException("HS6 code is required.");
        }
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
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + hs6Code));
    }

    // Update product by hs6Code
    @PutMapping("/{hs6Code}")
    public ResponseEntity<Product> updateProduct(@PathVariable String hs6Code,
            @Valid @RequestBody Product updatedProduct) {
        Product existingProduct = productRepository.findById(hs6Code)
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + hs6Code));
        existingProduct.setDescription(updatedProduct.getDescription());
        Product saved = productRepository.save(existingProduct);
        return ResponseEntity.ok(saved);
    }

    // Delete product by hs6Code
    @DeleteMapping("/{hs6Code}")
    public ResponseEntity<Void> deleteProductById(@PathVariable String hs6Code) {
        if (!productRepository.existsById(hs6Code)) {
            throw new InvalidRequestException("Product not found: " + hs6Code);
        }
        productRepository.deleteById(hs6Code);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Invalid request");
        return ResponseEntity.badRequest().body(errorMsg);
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<String> handleInvalidRequest(InvalidRequestException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
