package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Preference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PreferenceRepository extends JpaRepository<Preference, Long> {

    // Find preference valid at given date
    @Query("""
        SELECT p FROM Preference p
        WHERE p.product.hs6Code = :hs6Code
          AND p.importer.numericCode = :importer
          AND p.exporter.numericCode = :exporter
          AND p.validFrom <= :date
          AND (p.validTo IS NULL OR p.validTo >= :date)
        ORDER BY p.validFrom DESC
    """)
    List<Preference> findValidOrOpenEndedAtDate(
        @Param("hs6Code") String hs6Code,
        @Param("importer") String importer,
        @Param("exporter") String exporter,
        @Param("date") LocalDate date
    );

    // Find closest validFrom before date
    @Query("""
        SELECT p FROM Preference p
        WHERE p.product.hs6Code = :hs6Code
          AND p.importer.numericCode = :importer
          AND p.exporter.numericCode = :exporter
          AND p.validFrom <= :date
        ORDER BY p.validFrom DESC
    """)
    List<Preference> findClosestValidFromBefore(
        @Param("hs6Code") String hs6Code,
        @Param("importer") String importer,
        @Param("exporter") String exporter,
        @Param("date") LocalDate date
    );

    // Find all between validFrom dates
    @Query("""
        SELECT p FROM Preference p
        WHERE p.product.hs6Code = :hs6Code
          AND p.importer.numericCode = :importer
          AND p.exporter.numericCode = :exporter
          AND p.validFrom BETWEEN :startDate AND :endDate
        ORDER BY p.validFrom ASC
    """)
    List<Preference> findAllByValidFromBetween(
        @Param("hs6Code") String hs6Code,
        @Param("importer") String importer,
        @Param("exporter") String exporter,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    // Update prefAdValRate by preferenceId
    @Modifying
    @Transactional
    @Query("""
        UPDATE Preference p SET p.prefAdValRate = :rate WHERE p.preferenceId = :id
    """)
    int updatePrefAdValRateById(
        @Param("id") Long id,
        @Param("rate") BigDecimal rate
    );

    // Update validTo by preferenceId
    @Modifying
    @Transactional
    @Query("""
        UPDATE Preference p SET p.validTo = :validTo WHERE p.preferenceId = :id
    """)
    int updateValidToById(
        @Param("id") Long id,
        @Param("validTo") LocalDate validTo
    );

    // Update rate and validTo by preferenceId
    @Modifying
    @Transactional
    @Query("""
        UPDATE Preference p SET p.prefAdValRate = :rate, p.validTo = :validTo WHERE p.preferenceId = :id
    """)
    int updateRateAndValidToById(
        @Param("id") Long id,
        @Param("rate") BigDecimal rate,
        @Param("validTo") LocalDate validTo
    );
}
