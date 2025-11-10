package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Preference;
import com.verbosegarbonzo.tariff.model.Product;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

@Repository
public interface PreferenceRepository extends JpaRepository<Preference, Integer> {
    @Query("""
        SELECT p FROM Preference p
        WHERE p.importer = :importer
          AND p.exporter = :exporter
          AND p.product = :hs6
          AND p.validFrom <= :date
          AND (p.validTo IS NULL OR p.validTo >= :date)
        """)
    Optional<Preference> findValidRate(
        @Param("importer") Country importer,
        @Param("exporter") Country exporter,
        @Param("hs6") Product hs6,
        @Param("date") LocalDate date);

    Optional<Preference> findByImporterAndExporterAndProductAndValidFrom(
        Country importer,
        Country exporter,
        Product product,
        LocalDate validFrom);

    // Search by importer code, exporter code, or product code
    Page<Preference> findByImporterCountryCodeContainingIgnoreCaseOrExporterCountryCodeContainingIgnoreCaseOrProductHs6CodeContainingIgnoreCase(
            String importerCode, String exporterCode, String productCode, Pageable pageable);

    // Time-series queries for AI model training
    @Query("""
        SELECT p FROM Preference p
        WHERE p.importer.countryCode = :importerCode
          AND p.exporter.countryCode = :exporterCode
          AND p.product.hs6Code = :hs6Code
          AND p.validFrom >= :startDate
          AND p.validFrom <= :endDate
        ORDER BY p.validFrom ASC
        """)
    List<Preference> findHistoricalPreferences(
        @Param("importerCode") String importerCode,
        @Param("exporterCode") String exporterCode,
        @Param("hs6Code") String hs6Code,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);
}
