package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Transaction;
import com.verbosegarbonzo.tariff.model.UserInfo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
    
    @Query("SELECT t FROM Transaction t WHERE t.user = :user ORDER BY t.tDate DESC")
    List<Transaction> findByUidOrderByTDateDesc(@Param("uid") UserInfo user);
    
    @Query("SELECT t FROM Transaction t WHERE t.user = :user AND t.tid = :tid")
    Transaction findByUidAndTid(@Param("uid") UserInfo user, @Param("tid") Integer tid);
}