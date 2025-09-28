package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Measure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MeasureRepository extends JpaRepository<Measure, Long> {

    // Find measures valid at given date (validfrom <= date and (validto is null or
    // validto >= date))
    // Ordered by validfrom descending so newest valid measure is first
    @Query("""
                SELECT m FROM Measure m
                WHERE m.product.hs6Code = :hs6Code
                  AND m.importer.numericCode = :importer
                  AND m.validfrom <= :date
                  AND (m.validto IS NULL OR m.validto >= :date)
                ORDER BY m.validfrom DESC
            """)
    List<Measure> findValidOrOpenEndedAtDate(
            @Param("hs6Code") String hs6Code,
            @Param("importer") String importer,
            @Param("date") LocalDate date);

    // Find measure with closest validfrom before the date (fallback)
    @Query("""
                SELECT m FROM Measure m
                WHERE m.product.hs6Code = :hs6Code
                  AND m.importer.numericCode = :importer
                  AND m.validfrom <= :date
                ORDER BY m.validfrom DESC
            """)
    List<Measure> findClosestValidFromBefore(
            @Param("hs6Code") String hs6Code,
            @Param("importer") String importer,
            @Param("date") LocalDate date);

    // Find measures with validfrom between dates inclusive
    @Query("""
                SELECT m FROM Measure m
                WHERE m.product.hs6Code = :hs6Code
                  AND m.importer.numericCode = :importer
                  AND m.validfrom BETWEEN :startDate AND :endDate
                ORDER BY m.validfrom ASC
            """)
    List<Measure> findAllByValidFromBetween(
            @Param("hs6Code") String hs6Code,
            @Param("importer") String importer,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Update mfnAdValRate by measureId
    @Modifying
    @Transactional
    @Query("""
                UPDATE Measure m SET m.mfnAdValRate = :rate WHERE m.measureId = :id
            """)
    int updateMfnAdValRateById(@Param("id") Long id, @Param("rate") java.math.BigDecimal rate);

    // Update validto by measureId
    @Modifying
    @Transactional
    @Query("""
                UPDATE Measure m SET m.validto = :validto WHERE m.measureId = :id
            """)
    int updateValidToById(
            @Param("id") Long id,
            @Param("validto") LocalDate validto);
}
