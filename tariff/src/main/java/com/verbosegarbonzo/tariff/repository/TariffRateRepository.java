package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.TariffRate;
import com.verbosegarbonzo.tariff.model.TariffRate.TariffRateId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TariffRateRepository extends JpaRepository<TariffRate, TariffRateId> {

    // Read by TariffRateId
    Optional<TariffRate> findById(TariffRateId id);

    // Read list between dates for given composite key excluding date
    @Query("""
      SELECT t FROM TariffRate t
      WHERE t.id.hs6Code = :hs6Code
        AND t.id.importing = :importing
        AND t.id.exporting = :exporting
        AND t.id.date BETWEEN :startDate AND :endDate
    """)
    List<TariffRate> findAllByIdBetweenDates(
        @Param("hs6Code") String hs6Code,
        @Param("importing") String importing,
        @Param("exporting") String exporting,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    // Update rate, expiry, and date by TariffRateId
    @Modifying
    @Transactional
    @Query("""
      UPDATE TariffRate t SET t.rate = :rate, t.expiry = :expiry, t.id.date = :newDate
      WHERE t.id = :id
    """)
    int updateTariffRate(
        @Param("id") TariffRateId id,
        @Param("rate") Double rate,
        @Param("expiry") LocalDate expiry,
        @Param("newDate") LocalDate newDate);
}
