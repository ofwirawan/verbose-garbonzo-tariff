package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}