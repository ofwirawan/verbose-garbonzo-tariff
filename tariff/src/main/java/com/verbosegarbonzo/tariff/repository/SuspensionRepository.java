package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Suspension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface SuspensionRepository extends JpaRepository<Suspension, Integer> {

    @Query("""
        SELECT s FROM Suspension s
        WHERE s.importerCode = :importer
          AND (:exporter IS NULL OR s.exporterCode = :exporter OR s.exporterCode IS NULL)
          AND s.productCode = :hs6
          AND s.suspensionFlag = true
          AND s.validFrom <= :date
          AND (s.validTo IS NULL OR s.validTo >= :date)
        """)
    Optional<Suspension> findActiveSuspension(
        @Param("importer") String importer,
        @Param("exporter") String exporter,
        @Param("hs6") String hs6,
        @Param("date") LocalDate date
    );
}
