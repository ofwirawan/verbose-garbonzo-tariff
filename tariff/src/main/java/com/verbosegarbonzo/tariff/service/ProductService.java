package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Create a new product. Throws if product already exists
    @Transactional
    public Product create(Product product) {
        if (productRepository.existsById(product.getHs6Code())) {
            throw new IllegalArgumentException("Product with hs6Code already exists");
        }
        return productRepository.save(product);
    }

    // Update existing product description by id
    @Transactional
    public Product update(String hs6Code, String newDescription) {
        int updatedCount = productRepository.updateDescriptionById(hs6Code, newDescription);
        if (updatedCount == 0) {
            throw new NoSuchElementException("Product not found for id: " + hs6Code);
        }
        return productRepository.findById(hs6Code).orElseThrow();
    }

    // Search products by description (case insensitive)
    @Transactional(readOnly = true)
    public List<Product> searchByDescription(String description, int page, int size) {
        return productRepository.findByDescriptionContainingIgnoreCase(description, PageRequest.of(page, size));
    }

    // Delete products by exact description
    @Transactional
    public int deleteByDescription(String description) {
        return productRepository.deleteByDescription(description);
    }

    // Delete products by description pattern
    @Transactional
    public int deleteByDescriptionLike(String descriptionPattern) {
        return productRepository.deleteByDescriptionLike(descriptionPattern);
    }

    // Delete products by id
    @Transactional
    public void deleteById(String hs6Code) {
        if (!productRepository.existsById(hs6Code)) {
            throw new NoSuchElementException("Product not found with id: " + hs6Code);
        }
        productRepository.deleteById(hs6Code);
    }

    // Get product by id
    @Transactional(readOnly = true)
    public Product getById(String hs6Code) {
        return productRepository.findById(hs6Code).orElseThrow(() -> new NoSuchElementException("Product not found"));
    }
}
