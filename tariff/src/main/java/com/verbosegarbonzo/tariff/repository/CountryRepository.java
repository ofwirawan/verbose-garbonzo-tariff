package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

public interface CountryRepository extends JpaRepository<Country, String> {

    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO country (country_code, name, numeric_code)
            VALUES (:code, :name, :num)
            ON CONFLICT (country_code) DO UPDATE
              SET name = EXCLUDED.name,
                  numeric_code = EXCLUDED.numeric_code
              -- city and valuation_basis remain unchanged
            """, nativeQuery = true)
    void upsert(@Param("code") String countryCode,
            @Param("name") String name,
            @Param("num") String numericCode);

    // Search by name, country code, or numeric code
    Page<Country> findByNameContainingIgnoreCaseOrCountryCodeContainingIgnoreCaseOrNumericCodeContaining(
            String name, String countryCode, String numericCode, Pageable pageable);

}
