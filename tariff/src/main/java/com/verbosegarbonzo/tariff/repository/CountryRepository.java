package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CountryRepository extends JpaRepository<Country, String> {

    List<Country> findByIsActiveTrueOrderByCountryName();

    List<Country> findByCountryNameContainingIgnoreCaseAndIsActiveTrue(String countryName);

    List<Country> findByRegionAndIsActiveTrueOrderByCountryName(String region);
}
