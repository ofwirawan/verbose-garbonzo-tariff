package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Preference;
import com.verbosegarbonzo.tariff.model.Product;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
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
}
