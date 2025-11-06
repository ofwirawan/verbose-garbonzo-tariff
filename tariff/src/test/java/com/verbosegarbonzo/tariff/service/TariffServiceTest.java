package com.verbosegarbonzo.tariff.service;
import com.verbosegarbonzo.tariff.config.WitsProperties;
import com.verbosegarbonzo.tariff.exception.InvalidRateException;
import com.verbosegarbonzo.tariff.exception.InvalidRequestException;
import com.verbosegarbonzo.tariff.exception.RateNotFoundException;
import com.verbosegarbonzo.tariff.exception.WeightRequiredException;
import com.verbosegarbonzo.tariff.model.*;
import com.verbosegarbonzo.tariff.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TariffServiceTest {

    
    private PreferenceRepository preferenceRepository;
    private MeasureRepository measureRepository;
    private SuspensionRepository suspensionRepository;
    private CountryRepository countryRepository;
    private ProductRepository productRepository;
    private WebClient webClient;
    private WitsProperties witsProperties;
    private FreightService freightService;
    private TariffService tariffService;

    private Country importer;
    private Country exporter;
    private Product product;

    @BeforeEach
    void setUp() {
        preferenceRepository = mock(PreferenceRepository.class);
        measureRepository = mock(MeasureRepository.class);
        suspensionRepository = mock(SuspensionRepository.class);
        countryRepository = mock(CountryRepository.class);
        productRepository = mock(ProductRepository.class);
        webClient = mock(WebClient.class, RETURNS_DEEP_STUBS);
        witsProperties = mock(WitsProperties.class, RETURNS_DEEP_STUBS);
        freightService = mock(FreightService.class);

        tariffService = new TariffService(
                preferenceRepository,
                measureRepository,
                suspensionRepository,
                countryRepository,
                productRepository,
                webClient,
                witsProperties,
                freightService);

        importer = Country.builder().countryCode("SGP").name("Singapore").numericCode("702").valuationBasis("CIF").build();
        exporter = Country.builder().countryCode("MYS").name("Malaysia").numericCode("458").valuationBasis("FOB").build();
        product = new Product();
        product.setHs6Code("290531");

        when(countryRepository.findById("SGP")).thenReturn(Optional.of(importer));
        when(countryRepository.findById("MYS")).thenReturn(Optional.of(exporter));
        when(productRepository.findById("290531")).thenReturn(Optional.of(product));
    }

    private CalculateRequest baseRequest() {
        CalculateRequest req = new CalculateRequest();
        req.setHs6("290531");
        req.setImporterCode("SGP");
        req.setExporterCode("MYS");
        req.setTransactionDate(LocalDate.of(2024,1,10));
        req.setTradeOriginal(new BigDecimal("100.00"));
        return req;
    }

    @Test
    void validateRequest_missingFields_throwInvalidRequest() {
        CalculateRequest req = new CalculateRequest();
        InvalidRequestException ex = assertThrows(InvalidRequestException.class, () -> tariffService.calculate(req));
        assertTrue(ex.getMessage().contains("HS6 code is required"));
    }

    @Test
    void preferencePath_appliesPreferentialRate_andReturnsWarningsForWeight() {
        CalculateRequest req = baseRequest();
        req.setNetWeight(new BigDecimal("5"));

        Preference pref = new Preference();
        pref.setPrefAdValRate(new BigDecimal("10"));

        when(preferenceRepository.findValidRate(importer, exporter, product, req.getTransactionDate()))
                .thenReturn(Optional.of(pref));

        CalculateResponse resp = tariffService.calculate(req);
        assertEquals(new BigDecimal("110.00"), resp.getTradeFinal());
        assertNotNull(resp.getWarnings());
        assertFalse(resp.getWarnings().isEmpty());

        com.fasterxml.jackson.databind.JsonNode applied = resp.getAppliedRate();
        assertTrue(applied.has("prefAdval"));
    }

    @Test
    void suspensionPath_appliesSuspensionRate_andWarnsOnWeightIgnored() {
        CalculateRequest req = baseRequest();
        req.setNetWeight(new BigDecimal("2"));

        when(preferenceRepository.findValidRate(any(), any(), any(), any())).thenReturn(Optional.empty());

        Suspension susp = new Suspension();
        susp.setSuspensionRate(new BigDecimal("5"));
        when(suspensionRepository.findActiveSuspension(importer, product, req.getTransactionDate()))
                .thenReturn(Optional.of(susp));

        CalculateResponse resp = tariffService.calculate(req);
        assertEquals(new BigDecimal("105.00"), resp.getTradeFinal());
        assertTrue(resp.getAppliedRate().has("suspension") || resp.getAppliedRate().isObject());
        assertNotNull(resp.getWarnings());
        assertFalse(resp.getWarnings().isEmpty());
    }

    @Test
    void measurePath_advaloremOnly_usesPercentage() {
        CalculateRequest req = baseRequest();

        when(preferenceRepository.findValidRate(any(), any(), any(), any())).thenReturn(Optional.empty());
        when(suspensionRepository.findActiveSuspension(any(), any(), any())).thenReturn(Optional.empty());

        Measure m = new Measure();
        m.setMfnAdvalRate(new BigDecimal("7.5"));
        when(measureRepository.findValidRate(importer, product, req.getTransactionDate()))
                .thenReturn(Optional.of(m));

        CalculateResponse resp = tariffService.calculate(req);
        assertEquals(new BigDecimal("107.50"), resp.getTradeFinal());
        assertTrue(resp.getAppliedRate().has("mfnAdval"));
    }

    @Test
    void measurePath_specificOnly_requiresWeight() {
        CalculateRequest req = baseRequest();

        when(preferenceRepository.findValidRate(any(), any(), any(), any())).thenReturn(Optional.empty());
        when(suspensionRepository.findActiveSuspension(any(), any(), any())).thenReturn(Optional.empty());

        Measure m = new Measure();
        m.setSpecificRatePerKg(new BigDecimal("2.00"));
        when(measureRepository.findValidRate(importer, product, req.getTransactionDate()))
                .thenReturn(Optional.of(m));

        assertThrows(WeightRequiredException.class, () -> tariffService.calculate(req));
    }

    @Test
    void measurePath_invalidRates_throwInvalidRateException() {
        CalculateRequest req = baseRequest();

        when(preferenceRepository.findValidRate(any(), any(), any(), any())).thenReturn(Optional.empty());
        when(suspensionRepository.findActiveSuspension(any(), any(), any())).thenReturn(Optional.empty());

        Measure m = new Measure();
        m.setMfnAdvalRate(new BigDecimal("-1"));
        when(measureRepository.findValidRate(importer, product, req.getTransactionDate()))
                .thenReturn(Optional.of(m));

        assertThrows(InvalidRateException.class, () -> tariffService.calculate(req));
    }

    @Test
    void whenNoDataAnywhere_throwRateNotFound() {
        CalculateRequest req = baseRequest();

        when(preferenceRepository.findValidRate(any(), any(), any(), any())).thenReturn(Optional.empty());
        when(suspensionRepository.findActiveSuspension(any(), any(), any())).thenReturn(Optional.empty());
        when(measureRepository.findValidRate(any(), any(), any())).thenReturn(Optional.empty());

        // Make WITS numeric codes present but parsing returns nulls internally
        importer.setNumericCode("702");
        exporter.setNumericCode("458");

        assertThrows(RateNotFoundException.class, () -> tariffService.calculate(req));
    }

    @Test
    void includeFreight_addsFreightCostUnderCIF_andHandlesFailuresAsFOB() {
        CalculateRequest req = baseRequest();
        req.setIncludeFreight(true);
        req.setFreightMode("air");

        when(preferenceRepository.findValidRate(any(), any(), any(), any())).thenReturn(Optional.empty());
        when(suspensionRepository.findActiveSuspension(any(), any(), any())).thenReturn(Optional.empty());

        Measure m = new Measure();
        m.setMfnAdvalRate(new BigDecimal("0"));
        when(measureRepository.findValidRate(importer, product, req.getTransactionDate()))
                .thenReturn(Optional.of(m));

        FreightService.FreightDetails details = new FreightService.FreightDetails(10.0, 20.0, 30.0, 5);
        when(freightService.calculateFreight("air", "SGP", "MYS", 100.0)).thenReturn(details);

        CalculateResponse resp = tariffService.calculate(req);
        assertEquals(new BigDecimal("120.00"), resp.getTotalLandedCost());
        assertEquals("CIF", resp.getValuationBasisApplied());

        // Now make freight fail; valuation should become FOB
        when(freightService.calculateFreight(anyString(), anyString(), anyString(), anyDouble()))
                .thenThrow(new RuntimeException("down"));

        CalculateResponse resp2 = tariffService.calculate(req);
        assertEquals("FOB", resp2.getValuationBasisApplied());
        assertNotNull(resp2.getWarnings());
        assertFalse(resp2.getWarnings().isEmpty());
    }
}


