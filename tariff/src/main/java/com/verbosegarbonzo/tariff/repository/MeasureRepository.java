package com.verbosegarbonzo.tariff.repository;

import java.time.LocalDate;
import java.util.Optional;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.model.Measure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MeasureRepository extends JpaRepository<Measure, Integer> {
    Optional<Measure> findByImporterAndProductAndValidFrom(Country importer, Product product, LocalDate validFrom);
}
