package com.verbosegarbonzo.tariff.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.equalTo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.verbosegarbonzo.tariff.exception.RateNotFoundException;
import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;
import com.verbosegarbonzo.tariff.service.TariffService;

import io.restassured.RestAssured;
import static io.restassured.RestAssured.given;
import io.restassured.http.ContentType;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "spring.jackson.serialization.write-dates-as-timestamps=false",
        "freight.api.url=https://ship.freightos.com/api/shippingCalculator"
})
public class TariffControllerTest {

    @LocalServerPort
    private int port;

    @MockitoBean
    private TariffService tariffService;

    @BeforeEach
    @SuppressWarnings("unused")
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
                "transactionDate", LocalDate.now().toString());

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/calculate")
                .then()
                .statusCode(200)
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
                "transactionDate", LocalDate.now().toString());

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
        // Request with invalid data (empty strings violate @NotBlank)
        Map<String, Object> request = Map.of(
                "importerCode", "",
                "hs6", "",
                "tradeOriginal", "100",
                "transactionDate", LocalDate.now().toString()
        // Empty strings should fail @NotBlank validation
        );

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/calculate")
                .then()
                .statusCode(400);
    }

    @Test
    void calculateBatch_SingleRequest_Success() {
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
        mockResponse.setTradeFinal(new BigDecimal("1100.00"));

        // Create appliedRate as JsonNode
        ObjectNode rateNode = objectMapper.createObjectNode();
        rateNode.put("advalorem", "0.10");
        mockResponse.setAppliedRate(rateNode);

        when(tariffService.calculate(any(CalculateRequest.class))).thenReturn(mockResponse);

        String jsonString = String.format("[{\"importerCode\":\"USA\","
            + "\"exporterCode\": \"CHN\","
            + "\"hs6\": \"123456\","
            + "\"tradeOriginal\" : \"1000.00\","
            + "\"transactionDate\": \"%s\"}]", LocalDate.now().toString());

        given()
                .contentType(ContentType.JSON)
                .body(jsonString)
                .when()
                .post("/api/calculate/batch")
                .then()
                .statusCode(200)
                .body("size()", equalTo(1))
                .body("[0].transactionId", equalTo(transactionId.intValue()))
                .body("[0].tradeFinal", equalTo(1100.00f))
                .body("[0].appliedRate.advalorem", equalTo("0.10"));
    }

    @Test
    void calculateBatch_MultipleRequests_Success() {
        // Mock responses for different requests
        CalculateResponse mockResponse1 = new CalculateResponse();
        mockResponse1.setTransactionId(11111L);
        mockResponse1.setUid(UUID.randomUUID());
        mockResponse1.setHs6("123456");
        mockResponse1.setImporterCode("USA");
        mockResponse1.setExporterCode("CHN");
        mockResponse1.setTransactionDate(LocalDate.now());
        mockResponse1.setTradeOriginal(new BigDecimal("1000.00"));
        mockResponse1.setTradeFinal(new BigDecimal("1100.00"));
        ObjectNode rateNode1 = objectMapper.createObjectNode();
        rateNode1.put("advalorem", "0.10");
        mockResponse1.setAppliedRate(rateNode1);

        CalculateResponse mockResponse2 = new CalculateResponse();
        mockResponse2.setTransactionId(22222L);
        mockResponse2.setUid(UUID.randomUUID());
        mockResponse2.setHs6("654321");
        mockResponse2.setImporterCode("DEU");
        mockResponse2.setExporterCode("JPN");
        mockResponse2.setTransactionDate(LocalDate.now());
        mockResponse2.setTradeOriginal(new BigDecimal("2000.00"));
        mockResponse2.setTradeFinal(new BigDecimal("2300.00"));
        ObjectNode rateNode2 = objectMapper.createObjectNode();
        rateNode2.put("advalorem", "0.15");
        mockResponse2.setAppliedRate(rateNode2);

        CalculateResponse mockResponse3 = new CalculateResponse();
        mockResponse3.setTransactionId(33333L);
        mockResponse3.setUid(UUID.randomUUID());
        mockResponse3.setHs6("789012");
        mockResponse3.setImporterCode("GBR");
        mockResponse3.setExporterCode("IND");
        mockResponse3.setTransactionDate(LocalDate.now());
        mockResponse3.setTradeOriginal(new BigDecimal("500.00"));
        mockResponse3.setTradeFinal(new BigDecimal("525.00"));
        ObjectNode rateNode3 = objectMapper.createObjectNode();
        rateNode3.put("advalorem", "0.05");
        mockResponse3.setAppliedRate(rateNode3);

        when(tariffService.calculate(any(CalculateRequest.class)))
                .thenReturn(mockResponse1, mockResponse2, mockResponse3);

        String jsonString = String.format("["
            + "{\"importerCode\":\"USA\",\"exporterCode\":\"CHN\",\"hs6\":\"123456\",\"tradeOriginal\":\"1000.00\",\"transactionDate\":\"%s\"},"
            + "{\"importerCode\":\"DEU\",\"exporterCode\":\"JPN\",\"hs6\":\"654321\",\"tradeOriginal\":\"2000.00\",\"transactionDate\":\"%s\"},"
            + "{\"importerCode\":\"GBR\",\"exporterCode\":\"IND\",\"hs6\":\"789012\",\"tradeOriginal\":\"500.00\",\"transactionDate\":\"%s\"}"
            + "]", LocalDate.now().toString(), LocalDate.now().toString(), LocalDate.now().toString());

        given()
                .contentType(ContentType.JSON)
                .body(jsonString)
                .when()
                .post("/api/calculate/batch")
                .then()
                .statusCode(200)
                .body("size()", equalTo(3))
                .body("[0].transactionId", equalTo(11111))
                .body("[0].tradeFinal", equalTo(1100.00f))
                .body("[1].transactionId", equalTo(22222))
                .body("[1].tradeFinal", equalTo(2300.00f))
                .body("[2].transactionId", equalTo(33333))
                .body("[2].tradeFinal", equalTo(525.00f));
    }

    @Test
    void calculateBatch_EmptyList_Success() {
        String jsonString = "[]";

        given()
                .contentType(ContentType.JSON)
                .body(jsonString)
                .when()
                .post("/api/calculate/batch")
                .then()
                .statusCode(200)
                .body("size()", equalTo(0));
    }

    @Test
    void calculateBatch_InvalidRequest_MissingRequiredFields() {
        // Request with missing required fields
        String jsonString = "[{\"importerCode\":\"USA\",\"hs6\":\"123456\"}]";

        given()
                .contentType(ContentType.JSON)
                .body(jsonString)
                .when()
                .post("/api/calculate/batch")
                .then()
                .statusCode(400);
    }

    @Test
    void calculateBatch_InvalidRequest_EmptyFields() {
        // Request with empty strings that violate @NotBlank
        String jsonString = String.format("[{\"importerCode\":\"\",\"exporterCode\":\"\",\"hs6\":\"\",\"tradeOriginal\":\"100\",\"transactionDate\":\"%s\"}]",
            LocalDate.now().toString());

        given()
                .contentType(ContentType.JSON)
                .body(jsonString)
                .when()
                .post("/api/calculate/batch")
                .then()
                .statusCode(400);
    }

    @Test
    void calculateBatch_InvalidRequest_InvalidDataType() {
        // Request with invalid data type for tradeOriginal
        String jsonString = String.format("[{\"importerCode\":\"USA\",\"exporterCode\":\"CHN\",\"hs6\":\"123456\",\"tradeOriginal\":\"invalid\",\"transactionDate\":\"%s\"}]",
            LocalDate.now().toString());

        given()
                .contentType(ContentType.JSON)
                .body(jsonString)
                .when()
                .post("/api/calculate/batch")
                .then()
                .statusCode(403);
    }

    @Test
    void calculateBatch_ServiceThrowsRateNotFoundException() {
        when(tariffService.calculate(any(CalculateRequest.class)))
                .thenThrow(new RateNotFoundException("No tariff rate found for the given parameters"));

        String jsonString = String.format("[{\"importerCode\":\"USA\",\"exporterCode\":\"CHN\",\"hs6\":\"999999\",\"tradeOriginal\":\"1000.00\",\"transactionDate\":\"%s\"}]",
            LocalDate.now().toString());

        given()
                .contentType(ContentType.JSON)
                .body(jsonString)
                .when()
                .post("/api/calculate/batch")
                .then()
                .statusCode(404)
                .body("error", equalTo("RATE_NOT_FOUND"))
                .body("message", equalTo("No tariff rate found for the given parameters"));
    }

}