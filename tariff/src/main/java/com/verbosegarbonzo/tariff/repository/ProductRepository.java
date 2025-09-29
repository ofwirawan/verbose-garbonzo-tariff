package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Product;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, String> { 


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
}
