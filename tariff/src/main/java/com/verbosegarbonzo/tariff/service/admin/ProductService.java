package com.verbosegarbonzo.tariff.service.admin;

import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Create a new product
    @Transactional
    public Product create(Product product) {
        return productRepository.save(product);
    }

    // Get all products (paginated)
    @Transactional(readOnly = true)
    public Page<Product> getAll(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    // Get product by hs6Code
    @Transactional(readOnly = true)
    public Product getByHs6Code(String hs6Code) {
        return productRepository.findById(hs6Code)
                .orElseThrow(() -> new NoSuchElementException("Product not found with hs6Code: " + hs6Code));
    }

    // Update product by hs6Code
    @Transactional
    public Product update(String hs6Code, Product updatedProduct) {
        Product existingProduct = getByHs6Code(hs6Code);
        existingProduct.setDescription(updatedProduct.getDescription());
        return productRepository.save(existingProduct);
    }

    // Delete product by hs6Code
    @Transactional
    public void deleteByHs6Code(String hs6Code) {
        if (!productRepository.existsById(hs6Code)) {
            throw new NoSuchElementException("Product not found with hs6Code: " + hs6Code);
        }
        productRepository.deleteById(hs6Code);
    }
}
