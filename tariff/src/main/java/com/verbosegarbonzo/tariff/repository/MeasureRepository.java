package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.model.Product;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MeasureRepository extends JpaRepository<Measure, Integer> {
    @Query("""
        SELECT m FROM Measure m
        WHERE m.importer = :importer
          AND m.product = :hs6
          AND m.validFrom <= :date
          AND (m.validTo IS NULL OR m.validTo >= :date)
        """)
    Optional<Measure> findValidRate(
        @Param("importer") Country importer,
        @Param("hs6") Product hs6,
        @Param("date") LocalDate date);

    // Search by importer code or product code
    Page<Measure> findByImporterCountryCodeContainingIgnoreCaseOrProductHs6CodeContainingIgnoreCase(
            String importerCode, String productCode, Pageable pageable);

    // Time-series queries for AI model training
    @Query("""
        SELECT m FROM Measure m
        WHERE m.importer.countryCode = :importerCode
          AND m.product.hs6Code = :hs6Code
          AND m.validFrom >= :startDate
          AND m.validFrom <= :endDate
        ORDER BY m.validFrom ASC
        """)
    List<Measure> findHistoricalRates(
        @Param("importerCode") String importerCode,
        @Param("hs6Code") String hs6Code,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    // Count historical records to check data availability
    @Query("""
        SELECT COUNT(m) FROM Measure m
        WHERE m.importer.countryCode = :importerCode
          AND m.product.hs6Code = :hs6Code
        """)
    long countHistoricalRecords(
        @Param("importerCode") String importerCode,
        @Param("hs6Code") String hs6Code);
}
