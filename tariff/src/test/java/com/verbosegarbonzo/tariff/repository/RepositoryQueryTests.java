package com.verbosegarbonzo.tariff.repository;

import com.verbosegarbonzo.tariff.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class RepositoryQueryTests {

    @Autowired CountryRepository countryRepository;
    @Autowired ProductRepository productRepository;
    @Autowired MeasureRepository measureRepository;
    @Autowired PreferenceRepository preferenceRepository;
    @Autowired SuspensionRepository suspensionRepository;
    @Autowired TransactionRepository transactionRepository;
    @Autowired UserInfoRepository userInfoRepository;

    private Country persistCountry(String code, String num) {
        Country c = Country.builder().countryCode(code).name(code).numericCode(num).city("City,Country").valuationBasis("CIF").build();
        return countryRepository.save(c);
    }

    private Product persistProduct(String hs6) {
        Product p = new Product();
        p.setHs6Code(hs6);
        p.setDescription("Desc");
        return productRepository.save(p);
    }

    @Test
    void measure_findValidRate_matchesDateRange() {
        Country importer = persistCountry("SGP", "702");
        Product product = persistProduct("290531");

        Measure m = new Measure();
        m.setImporter(importer);
        m.setProduct(product);
        m.setValidFrom(LocalDate.of(2024,1,1));
        m.setValidTo(LocalDate.of(2024,12,31));
        m.setMfnAdvalRate(new BigDecimal("5"));
        measureRepository.save(m);

        assertTrue(measureRepository.findValidRate(importer, product, LocalDate.of(2024,6,1)).isPresent());
        assertTrue(measureRepository.findValidRate(importer, product, LocalDate.of(2024,1,1)).isPresent());
        assertTrue(measureRepository.findValidRate(importer, product, LocalDate.of(2024,12,31)).isPresent());
        assertTrue(measureRepository.findValidRate(importer, product, LocalDate.of(2023,12,31)).isEmpty());
        assertTrue(measureRepository.findValidRate(importer, product, LocalDate.of(2025,1,1)).isEmpty());
    }

    @Test
    void preference_findValidRate_matchesAllKeys() {
        Country importer = persistCountry("SGP", "702");
        Country exporter = persistCountry("MYS", "458");
        Product product = persistProduct("290531");

        Preference p = new Preference();
        p.setImporter(importer);
        p.setExporter(exporter);
        p.setProduct(product);
        p.setValidFrom(LocalDate.of(2024,1,1));
        p.setValidTo(LocalDate.of(2024,12,31));
        p.setPrefAdValRate(new BigDecimal("3"));
        preferenceRepository.save(p);

        assertTrue(preferenceRepository.findValidRate(importer, exporter, product, LocalDate.of(2024,6,1)).isPresent());
        assertTrue(preferenceRepository.findValidRate(importer, exporter, product, LocalDate.of(2023,12,31)).isEmpty());
    }

    @Test
    void suspension_findActiveSuspension_requiresFlagTrue() {
        Country importer = persistCountry("SGP", "702");
        Product product = persistProduct("290531");

        Suspension s = new Suspension();
        s.setImporter(importer);
        s.setProduct(product);
        s.setValidFrom(LocalDate.of(2024,1,1));
        s.setValidTo(LocalDate.of(2024,12,31));
        s.setSuspensionFlag(true);
        s.setSuspensionNote("note");
        s.setSuspensionRate(new BigDecimal("0"));
        suspensionRepository.save(s);

        assertTrue(suspensionRepository.findActiveSuspension(importer, product, LocalDate.of(2024,6,1)).isPresent());
    }

    @Test
    void transaction_queries_byUser_andByTid() {
        Country importer = persistCountry("SGP", "702");
        Country exporter = persistCountry("MYS", "458");
        Product product = persistProduct("290531");

        UserInfo user = new UserInfo();
        user.setEmail("u@example.com");
        user.setPassword("x");
        user.setRoles("ROLE_USER");
        user = userInfoRepository.save(user);

        ObjectNode rate = new ObjectMapper().createObjectNode();
        rate.put("mfnAdval", 5);

        Transaction t1 = new Transaction();
        t1.setUser(user);
        t1.setTDate(LocalDate.of(2024, 5, 2));
        t1.setImporter(importer);
        t1.setExporter(exporter);
        t1.setProduct(product);
        t1.setTradeOriginal(new java.math.BigDecimal("100"));
        t1.setTradeFinal(new java.math.BigDecimal("105"));
        t1.setAppliedRate(rate);
        transactionRepository.save(t1);

        Transaction t2 = new Transaction();
        t2.setUser(user);
        t2.setTDate(LocalDate.of(2024, 6, 2));
        t2.setImporter(importer);
        t2.setProduct(product);
        t2.setTradeOriginal(new java.math.BigDecimal("200"));
        t2.setTradeFinal(new java.math.BigDecimal("210"));
        t2.setAppliedRate(rate);
        transactionRepository.save(t2);

        List<Transaction> list = transactionRepository.findByUidOrderByTDateDesc(user);
        assertEquals(2, list.size());
        assertTrue(list.get(0).getTDate().isAfter(list.get(1).getTDate()));

        Transaction loaded = transactionRepository.findByUidAndTid(user, t1.getTid());
        assertNotNull(loaded);
        assertEquals(t1.getTid(), loaded.getTid());
    }
}


