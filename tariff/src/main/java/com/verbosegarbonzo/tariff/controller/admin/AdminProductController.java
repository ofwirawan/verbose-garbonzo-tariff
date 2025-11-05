package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HS6 code is required.");
        }
        boolean exists = productRepository.existsById(product.getHs6Code());
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A product with HS6 code '" + product.getHs6Code() + "' already exists.");
        }
        Product created = productRepository.save(product);
        return ResponseEntity.status(201).body(created);
    }

    // Get all products (paginated) with optional search
    @GetMapping
    public Page<Product> getAllProducts(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        if (search != null && !search.isEmpty()) {
            return productRepository.findByHs6CodeContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                    search, search, pageable);
        }
        return productRepository.findAll(pageable);
    }

    // Get product by hs6Code
    @GetMapping("/{hs6Code}")
    public ResponseEntity<Product> getProductById(@PathVariable String hs6Code) {
        return productRepository.findById(hs6Code)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + hs6Code));
    }

    // Update product by hs6Code
    @PutMapping("/{hs6Code}")
    public ResponseEntity<Product> updateProduct(@PathVariable String hs6Code,
            @Valid @RequestBody Product updatedProduct) {
        Product existingProduct = productRepository.findById(hs6Code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + hs6Code));
        // Check for duplicate HS6 code if updating the code itself (optional, if
        // allowed)
        if (updatedProduct.getHs6Code() != null && !updatedProduct.getHs6Code().equals(hs6Code)) {
            boolean exists = productRepository.existsById(updatedProduct.getHs6Code());
            if (exists) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A product with HS6 code '" + updatedProduct.getHs6Code() + "' already exists.");
            }
            existingProduct.setHs6Code(updatedProduct.getHs6Code());
        }
        existingProduct.setDescription(updatedProduct.getDescription());
        Product saved = productRepository.save(existingProduct);
        return ResponseEntity.ok(saved);
    }

    // Delete product by hs6Code
    @DeleteMapping("/{hs6Code}")
    public ResponseEntity<Void> deleteProductById(@PathVariable String hs6Code) {
        if (!productRepository.existsById(hs6Code)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + hs6Code);
        }
        productRepository.deleteById(hs6Code);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorPayload> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Invalid request");
        return ResponseEntity.badRequest().body(new ErrorPayload("BAD_REQUEST", errorMsg));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorPayload> handleResponseStatusException(ResponseStatusException ex) {
        String errorType = ex.getStatusCode() == HttpStatus.CONFLICT ? "CONFLICT_ERROR"
                : ex.getStatusCode() == HttpStatus.NOT_FOUND ? "NOT_FOUND_ERROR"
                        : ex.getStatusCode() == HttpStatus.BAD_REQUEST ? "BAD_REQUEST"
                                : "REQUEST_ERROR";
        return ResponseEntity.status(ex.getStatusCode())
                .body(new ErrorPayload(errorType, ex.getReason()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorPayload> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorPayload("DATA_INTEGRITY_ERROR",
                        "Product cannot be deleted because it is referenced by other records."));
    }

    record ErrorPayload(String error, String message) {
    }
}
