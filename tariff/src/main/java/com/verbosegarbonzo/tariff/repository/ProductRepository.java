package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    // Search products by description (case insensitive, paginated)
    List<Product> findByDescriptionContainingIgnoreCase(String description, Pageable pageable);

    // Update product description by hs6Code
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.description = :desc WHERE p.hs6Code = :hs6Code")
    int updateDescriptionById(@Param("hs6Code") String hs6Code, @Param("desc") String desc);

    // Delete products with exact description
    @Transactional
    int deleteByDescription(String description);

    // Delete products where description matches (case insensitive LIKE pattern)
    @Modifying
    @Transactional
    @Query("DELETE FROM Product p WHERE LOWER(p.description) LIKE LOWER(CONCAT('%', :desc, '%'))")
    int deleteByDescriptionLike(@Param("desc") String desc);
}



