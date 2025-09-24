package com.verbosegarbonzo.tariff.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import com.verbosegarbonzo.tariff.model.Product;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> { //gives you CRUD methods for DB

    List<Product> findTop10ByDescriptionContainingIgnoreCase(String keyword);
    //auto generate a SQL query like:
    //select * from products where lower(description) like '%keyword%' limit 10;

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO products (hs6code, description)
        VALUES (:hs6, :desc)
        ON CONFLICT (hs6code) DO UPDATE SET description = EXCLUDED.description
        """, nativeQuery = true)
    void upsert(@Param("hs6") String hs6, @Param("desc") String desc);
}
