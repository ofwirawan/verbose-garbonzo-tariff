package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Product;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, String> {

    /**
     * Find product by HS6 code with caching.
     * Product data is static and rarely changes, so caching is beneficial.
     */
    @Override
    @Cacheable(value = "productData", key = "#id")
    Optional<Product> findById(@org.springframework.lang.NonNull String id);


    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO product (hs6code, description)
        VALUES (:hs6, :desc)
        ON CONFLICT (hs6code) DO UPDATE SET description = EXCLUDED.description
        """, nativeQuery = true)
    void upsert(@Param("hs6") String hs6, @Param("desc") String desc);

    //remove previously-synced rows before a fresh load
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM product", nativeQuery = true)
    int deleteAllProduct();

    // Search by hs6Code or description
    Page<Product> findByHs6CodeContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String hs6Code, String description, Pageable pageable);
}
