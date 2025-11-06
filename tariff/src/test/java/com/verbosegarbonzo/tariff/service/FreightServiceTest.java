package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FreightServiceTest {

    private CountryRepository countryRepository;
    private FreightService freightService;

    @BeforeEach
    void setup() {
        countryRepository = mock(CountryRepository.class);
        freightService = new FreightService(countryRepository);
    }

    @Test
    void calculateFreight_missingImporter_throwsIAE() {
        when(countryRepository.findById("SGP")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () ->
                freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }

    @Test
    void calculateFreight_missingCity_throwsISE() {
        Country importer = Country.builder().countryCode("SGP").name("Singapore").numericCode("702").city(null).build();
        Country exporter = Country.builder().countryCode("MYS").name("Malaysia").numericCode("458").city("Kuala Lumpur,Malaysia").build();

        when(countryRepository.findById("SGP")).thenReturn(Optional.of(importer));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(exporter));

        assertThrows(IllegalStateException.class, () ->
                freightService.calculateFreight("air", "SGP", "MYS", 10.0));
    }
}


