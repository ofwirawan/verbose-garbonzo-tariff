package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.model.Suspension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface SuspensionRepository extends JpaRepository<Suspension, Integer> {

    // Find suspension - no exporter means to-the-world
    @Query("""
        SELECT s FROM Suspension s
        WHERE s.importer = :importer
          AND s.product = :hs6
          AND s.suspensionFlag = true
          AND s.validFrom <= :date
          AND (s.validTo IS NULL OR s.validTo >= :date)
        """)
    Optional<Suspension> findActiveSuspension(
        @Param("importer") Country importer,
        @Param("hs6") Product hs6,
        @Param("date") LocalDate date
    );

    Optional<Suspension> findByImporterAndProductAndValidFrom(
        Country importer,
        Product product,
        LocalDate validFrom);

    // Search by importer code or product code
    Page<Suspension> findByImporterCountryCodeContainingIgnoreCaseOrProductHs6CodeContainingIgnoreCase(
            String importerCode, String productCode, Pageable pageable);
}
