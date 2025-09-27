package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.TariffRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TariffRateRepository extends JpaRepository<TariffRate, Long> {

    // Find tariff rate valid at given date (startDate <= date and (expiry is null or expiry >= date))
    // Ordered by startDate descending so the newest valid tariff is first
    @Query("""
        SELECT t FROM TariffRate t
        WHERE t.hs6Code = :hs6Code
          AND t.importingCountry.numericCode = :importing
          AND t.exportingCountry.numericCode = :exporting
          AND t.startDate <= :date
          AND (t.expiry IS NULL OR t.expiry >= :date)
        ORDER BY t.startDate DESC
    """)
    List<TariffRate> findValidOrOpenEndedAtDate(
        @Param("hs6Code") String hs6Code,
        @Param("importing") String importing,
        @Param("exporting") String exporting,
        @Param("date") LocalDate date);

    // Find the tariff rate with startDate closest and before the date (fallback if no valid tariff found)
    @Query("""
        SELECT t FROM TariffRate t
        WHERE t.hs6Code = :hs6Code
          AND t.importingCountry.numericCode = :importing
          AND t.exportingCountry.numericCode = :exporting
          AND t.startDate <= :date
        ORDER BY t.startDate DESC
    """)
    List<TariffRate> findClosestStartDateBefore(
        @Param("hs6Code") String hs6Code,
        @Param("importing") String importing,
        @Param("exporting") String exporting,
        @Param("date") LocalDate date);

    // Find tariff rates whose startDate is between startDate and endDate, inclusive
    @Query("""
        SELECT t FROM TariffRate t
        WHERE t.hs6Code = :hs6Code
          AND t.importingCountry.numericCode = :importing
          AND t.exportingCountry.numericCode = :exporting
          AND t.startDate BETWEEN :startDate AND :endDate
        ORDER BY t.startDate ASC
    """)
    List<TariffRate> findAllByStartDateBetween(
        @Param("hs6Code") String hs6Code,
        @Param("importing") String importing,
        @Param("exporting") String exporting,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    // Update only rate by surrogate ID
    @Modifying
    @Transactional
    @Query("""
        UPDATE TariffRate t SET t.rate = :rate WHERE t.id = :id
    """)
    int updateTariffRateRate(
        @Param("id") Long id,
        @Param("rate") Double rate);

    // Update only expiry by surrogate ID
    @Modifying
    @Transactional
    @Query("""
        UPDATE TariffRate t SET t.expiry = :expiry WHERE t.id = :id
    """)
    int updateTariffRateExpiry(
        @Param("id") Long id,
        @Param("expiry") LocalDate expiry);

    // Update both rate and expiry by surrogate ID
    @Modifying
    @Transactional
    @Query("""
        UPDATE TariffRate t SET t.rate = :rate, t.expiry = :expiry WHERE t.id = :id
    """)
    int updateTariffRateRateAndExpiry(
        @Param("id") Long id,
        @Param("rate") Double rate,
        @Param("expiry") LocalDate expiry);
}
