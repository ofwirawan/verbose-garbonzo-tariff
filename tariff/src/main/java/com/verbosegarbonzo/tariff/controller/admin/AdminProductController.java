package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.service.ProductService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    // Search products by description or hs6Code, with pagination
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam String q,
                                                        @RequestParam int page,
                                                        @RequestParam int size) {
        List<Product> products = productService.searchProducts(q, PageRequest.of(page, size));
        return ResponseEntity.ok(products);
    }

    // Upsert product (insert or update)
    @PostMapping("/upsert")
    public ResponseEntity<String> upsertProduct(@RequestBody Product product) {
        productService.upsert(product.getHs6Code(), product.getDescription());
        return ResponseEntity.ok("Product upserted successfully.");
    }

    // Delete product by HS6 code
    @DeleteMapping("/delete/{hs6}")
    public ResponseEntity<String> deleteProduct(@PathVariable String hs6) {
        boolean deleted = productService.deleteByHs6(hs6);
        if (deleted) {
            return ResponseEntity.ok("Product deleted successfully.");
        } else {
            return ResponseEntity.badRequest().body("Product deletion failed or not found.");
        }
    }
}


