package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Create or update (upsert) product
    @Transactional
    public Product upsert(Product product) {
        productRepository.upsert(product.getHs6Code(), product.getDescription());
        return productRepository.findById(product.getHs6Code())
                .orElseThrow(() -> new NoSuchElementException("Product not found after upsert"));
    }

    // Get product by HS6 code (primary key)
    public Product getById(String hs6Code) {
        return productRepository.findById(hs6Code)
                .orElseThrow(() -> new NoSuchElementException("Product not found with hs6Code " + hs6Code));
    }

    // Search products by description or hs6Code with pagination
    public List<Product> searchProducts(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable);
    }

    // Update product fully (replace fields)
    @Transactional
    public Product update(String hs6Code, Product updatedProduct) {
        Product existing = getById(hs6Code);
        existing.setDescription(updatedProduct.getDescription());
        // Add other fields if any
        return productRepository.save(existing);
    }

    // Delete product by HS6 code
    @Transactional
    public void deleteById(String hs6Code) {
        if (!productRepository.existsById(hs6Code)) {
            throw new NoSuchElementException("Product not found with hs6Code " + hs6Code);
        }
        productRepository.deleteById(hs6Code);
    }
}

