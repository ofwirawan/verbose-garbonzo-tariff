package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Modifying;
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
        """, nativeQuery = true)
    void upsert(@Param("code") String countryCode,
                @Param("name") String name,
                @Param("num") String numericCode);

    //remove previously-synced rows before a fresh load
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM country", nativeQuery = true)
    int deleteAllCountries();
}
