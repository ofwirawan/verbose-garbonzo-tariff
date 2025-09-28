package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CountryRepository extends JpaRepository<Country, String> {

    // Search countries by name, iso3code, or numericCode (partial match, case insensitive for name & iso3code)
    @Query("""
        SELECT c FROM Country c
        WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(c.iso3code) LIKE LOWER(CONCAT('%', :query, '%'))
           OR c.numericCode LIKE CONCAT('%', :query, '%')
        """)
    List<Country> searchCountries(@Param("query") String query);

    // Update iso3code and name by numericCode (primary key)
    @Modifying
    @Transactional
    @Query("UPDATE Country c SET c.iso3code = :iso3code, c.name = :name WHERE c.numericCode = :numericCode")
    int updateCountry(@Param("numericCode") String numericCode, @Param("iso3code") String iso3code, @Param("name") String name);

    // Delete by iso3code
    @Modifying
    @Transactional
    @Query("DELETE FROM Country c WHERE c.iso3code = :iso3code")
    int deleteByIso3code(@Param("iso3code") String iso3code);

    // Delete by country name
    @Modifying
    @Transactional
    @Query("DELETE FROM Country c WHERE c.name = :name")
    int deleteByName(@Param("name") String name);
}
