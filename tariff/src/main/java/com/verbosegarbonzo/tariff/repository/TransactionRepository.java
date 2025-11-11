package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Transaction;
import com.verbosegarbonzo.tariff.model.UserInfo;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.time.LocalDate;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
    
    @Query("SELECT t FROM Transaction t WHERE t.user = :user ORDER BY t.tDate DESC")
    List<Transaction> findByUidOrderByTDateDesc(@Param("user") UserInfo user);

    @Query("SELECT t FROM Transaction t WHERE t.user = :user AND t.tid = :tid")
    Transaction findByUidAndTid(@Param("user") UserInfo user, @Param("tid") Integer tid);

    // Pattern queries for AI personalization
    @Query("""
        SELECT t.product.hs6Code, COUNT(t) as frequency, AVG(t.totalLandedCost) as avgCost
        FROM Transaction t
        WHERE t.user = :user
        GROUP BY t.product.hs6Code
        ORDER BY COUNT(t) DESC
        """)
    List<Object[]> getUserProductPatterns(@Param("user") UserInfo user);
}