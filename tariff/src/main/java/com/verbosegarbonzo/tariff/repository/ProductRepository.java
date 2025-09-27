package com.verbosegarbonzo.tariff.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Pageable;
import com.verbosegarbonzo.tariff.model.Product;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> {

    // 1. Search for products by description (case insensitive, with pagination)
    List<Product> findByDescriptionContainingIgnoreCase(String description, Pageable pageable);

    // 2. Update product description given product ID (hs6Code)
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.description = :desc WHERE p.hs6Code = :hs6Code")
    int updateDescriptionById(@Param("hs6Code") String hs6Code, @Param("desc") String desc);

    // 3a. Delete products with exact description
    @Transactional
    int deleteByDescription(String description);

    // 3b. Delete products matching description pattern (LIKE, case insensitive)
    @Modifying
    @Transactional
    @Query("DELETE FROM Product p WHERE LOWER(p.description) LIKE LOWER(CONCAT('%', :desc, '%'))")
    int deleteByDescriptionLike(@Param("desc") String desc);
}


