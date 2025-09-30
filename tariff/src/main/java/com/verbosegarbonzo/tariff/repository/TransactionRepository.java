package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Integer> {}
