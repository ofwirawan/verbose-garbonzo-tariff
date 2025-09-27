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

    // Search countries by name, iso3 code, or numeric code (partial match, case insensitive for name & iso3)
    @Query("""
        SELECT c FROM Country c
        WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(c.iso3) LIKE LOWER(CONCAT('%', :query, '%'))
           OR c.numericCode LIKE CONCAT('%', :query, '%')
        """)
    List<Country> searchCountries(@Param("query") String query);

    // Update iso3 code and name by numericCode (primary key)
    @Modifying
    @Transactional
    @Query("UPDATE Country c SET c.iso3 = :iso3, c.name = :name WHERE c.numericCode = :numericCode")
    int updateCountry(@Param("numericCode") String numericCode, @Param("iso3") String iso3, @Param("name") String name);

    // Update iso3 code by country name
    @Modifying
    @Transactional
    @Query("UPDATE Country c SET c.iso3 = :iso3 WHERE c.name = :name")
    int updateIso3ByName(@Param("iso3") String iso3, @Param("name") String name);

    // Update country name by iso3 code
    @Modifying
    @Transactional
    @Query("UPDATE Country c SET c.name = :name WHERE c.iso3 = :iso3")
    int updateNameByIso3(@Param("name") String name, @Param("iso3") String iso3);

    // Delete by iso3 code
    @Modifying
    @Transactional
    @Query("DELETE FROM Country c WHERE c.iso3 = :iso3")
    int deleteByIso3(@Param("iso3") String iso3);

    // Delete by country name
    @Modifying
    @Transactional
    @Query("DELETE FROM Country c WHERE c.name = :name")
    int deleteByName(@Param("name") String name);
}
