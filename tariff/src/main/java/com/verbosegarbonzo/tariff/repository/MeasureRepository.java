package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Measure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface MeasureRepository extends JpaRepository<Measure, Integer> {
    @Query("""
        SELECT m FROM Measure m
        WHERE m.importerCode = :importer
          AND m.productCode = :hs6
          AND m.validFrom <= :date
          AND (m.validTo IS NULL OR m.validTo >= :date)
        """)
    Optional<Measure> findValidRate(
        @Param("importer") String importer,
        @Param("hs6") String hs6,
        @Param("date") LocalDate date);
}
