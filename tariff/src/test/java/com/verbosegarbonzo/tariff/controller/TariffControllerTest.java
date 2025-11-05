package com.verbosegarbonzo.tariff.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;
import com.verbosegarbonzo.tariff.service.TariffService;
import com.verbosegarbonzo.tariff.exception.RateNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.mockito.Mock;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "spring.jackson.serialization.write-dates-as-timestamps=false"
})
public class TariffControllerTest {

    @LocalServerPort
    private int port;

    @Mock
    private TariffService tariffService;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void calculate_Success() {
        // Mock response
        Long transactionId = 12345L;
        UUID userId = UUID.randomUUID();
        
        CalculateResponse mockResponse = new CalculateResponse();
        mockResponse.setTransactionId(transactionId);
        mockResponse.setUid(userId);
        mockResponse.setHs6("123456");
        mockResponse.setImporterCode("USA");
        mockResponse.setExporterCode("CHN");
        mockResponse.setTransactionDate(LocalDate.now());
        mockResponse.setTradeOriginal(new BigDecimal("1000.00"));
        mockResponse.setTradeFinal(new BigDecimal("1100.00")); // Original + duty
        
        // Create appliedRate as JsonNode
        ObjectNode rateNode = objectMapper.createObjectNode();
        rateNode.put("advalorem", "0.10");
        mockResponse.setAppliedRate(rateNode);

        when(tariffService.calculate(any(CalculateRequest.class))).thenReturn(mockResponse);

        Map<String, Object> request = Map.of(
            "importerCode", "USA",
            "exporterCode", "CHN",
            "hs6", "123456",
            "tradeOriginal", "1000.00",
            "transactionDate", LocalDate.now().toString()
        );

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/calculate")
        .then()
            .statusCode(201)
            .header("Location", equalTo("/api/transactions/" + transactionId))
            .body("transactionId", equalTo(transactionId.intValue()))
            .body("tradeFinal", equalTo(1100.00f))
            .body("appliedRate.advalorem", equalTo("0.10"));
    }

    @Test
    void calculate_RateNotFound() {
        when(tariffService.calculate(any(CalculateRequest.class)))
            .thenThrow(new RateNotFoundException("No tariff rate found for the given parameters"));

        Map<String, Object> request = Map.of(
            "importerCode", "USA",
            "exporterCode", "CHN",
            "hs6", "999999",
            "tradeOriginal", "1000.00",
            "transactionDate", LocalDate.now().toString()
        );

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/calculate")
        .then()
            .statusCode(404)
            .body("error", equalTo("RATE_NOT_FOUND"))
            .body("message", equalTo("No tariff rate found for the given parameters"));
    }

    @Test
    void calculate_InvalidRequest_Returns400() {
        // Request missing required fields
        Map<String, Object> request = Map.of(
            "importerCode", "USA"
            // Missing hs6, tradeOriginal which are required
        );

        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/calculate")
        .then()
            .statusCode(400);
    }
}