package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Suspension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SuspensionRepository extends JpaRepository<Suspension, Long> {}

