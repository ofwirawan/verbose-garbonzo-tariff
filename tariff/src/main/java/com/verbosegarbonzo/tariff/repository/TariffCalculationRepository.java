package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.entity.TariffCalculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TariffCalculationRepository extends JpaRepository<TariffCalculation, Long> {

    // Find by user ID for calculation history
    List<TariffCalculation> findByUserIdOrderByCreatedAtDesc(String userId);

    // Find by date range for analytics
    List<TariffCalculation> findByTradeDateBetweenOrderByTradeDate(LocalDate startDate, LocalDate endDate);

    // Find by country for analytics
    List<TariffCalculation> findByImportingCountryOrExportingCountryOrderByCreatedAtDesc(
            String importingCountry, String exportingCountry);

    // Analytics queries
    @Query("SELECT tc.importingCountry, AVG(tc.tariffRate), COUNT(tc) " +
           "FROM TariffCalculation tc " +
           "WHERE tc.createdAt >= :startDate " +
           "GROUP BY tc.importingCountry " +
           "ORDER BY AVG(tc.tariffRate) DESC")
    List<Object[]> findAvgTariffRateByCountry(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT tc.tradeDate, AVG(tc.tariffRate) " +
           "FROM TariffCalculation tc " +
           "WHERE tc.tradeDate >= :startDate " +
           "GROUP BY tc.tradeDate " +
           "ORDER BY tc.tradeDate")
    List<Object[]> findTariffTrends(@Param("startDate") LocalDate startDate);

    @Query("SELECT COUNT(tc) FROM TariffCalculation tc WHERE tc.createdAt >= :startDate")
    Long countCalculationsSince(@Param("startDate") LocalDateTime startDate);
}
