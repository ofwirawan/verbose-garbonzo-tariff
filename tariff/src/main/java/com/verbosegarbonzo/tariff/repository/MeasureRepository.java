package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.model.Product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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
}
