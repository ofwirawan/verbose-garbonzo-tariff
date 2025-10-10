package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    @Query("SELECT t FROM Transaction t WHERE t.uid = :uid ORDER BY t.tDate DESC")
    List<Transaction> findByUidOrderByTDateDesc(@Param("uid") UUID uid);
    
    @Query("SELECT t FROM Transaction t WHERE t.uid = :uid AND t.tid = :tid")
    Transaction findByUidAndTid(@Param("uid") UUID uid, @Param("tid") Long tid);
}