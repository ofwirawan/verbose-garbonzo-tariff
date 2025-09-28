package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Suspension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SuspensionRepository extends JpaRepository<Suspension, Long> {
    // Find list of active suspensions
    @Query("""
        SELECT s FROM Suspension s
        WHERE s.importer.numericCode = :importer
          AND s.product.hs6Code = :hs6Code
          AND s.validFrom <= :date
          AND (s.validTo IS NULL OR s.validTo >= :date)
          AND s.suspensionFlag = true
        ORDER BY s.validFrom DESC
    """)
    List<Suspension> findActiveSuspensions(
        @Param("importer") String importer,
        @Param("hs6Code") String hs6Code,
        @Param("date") LocalDate date);

    // Updating flag and note by suspensionId
    @Modifying
    @Transactional
    @Query("""
        UPDATE Suspension s SET s.suspensionFlag = :flag, s.suspensionNote = :note WHERE s.suspensionId = :id
    """)
    int updateFlagAndNoteById(
        @Param("id") Long id,
        @Param("flag") Boolean flag,
        @Param("note") String note);

    // Update validTo date by suspensioId
    @Modifying
    @Transactional
    @Query("""
        UPDATE Suspension s SET s.validTo = :validTo WHERE s.suspensionId = :id
    """)
    int updateValidToById(
        @Param("id") Long id,
        @Param("validTo") LocalDate validTo);
}

