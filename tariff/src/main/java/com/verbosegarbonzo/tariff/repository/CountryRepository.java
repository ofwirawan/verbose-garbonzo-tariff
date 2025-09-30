package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CountryRepository extends JpaRepository<Country, String> {}
