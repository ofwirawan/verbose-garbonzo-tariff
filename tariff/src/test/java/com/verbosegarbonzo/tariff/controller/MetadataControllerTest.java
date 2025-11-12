package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.client.WitsMetadataClient;
import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.JwtService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import static io.restassured.RestAssured.given;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;

import com.verbosegarbonzo.tariff.repository.TransactionRepository;

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
public class MetadataControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @MockitoBean
    private WitsMetadataClient witsMetadataClient;

    private String adminJwtToken;
    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

        // Clean up
        transactionRepository.deleteAll();
        countryRepository.deleteAll();
        productRepository.deleteAll();
        userInfoRepository.deleteAll();

        // Create admin user
        userInfoRepository.save(new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN", null));

        // Generate JWT token
        adminJwtToken = jwtService.token("admin@email.com");
    }

    @Test
    void syncCountries_Success() {
        // Mock the WitsMetadataClient behavior

        given()
            .header("Authorization", "Bearer " + adminJwtToken)
            .contentType(ContentType.JSON)
        .when()
            .post("/api/metadata/countries/sync")
        .then()
            .statusCode(200)
            .body(equalTo("Countries synced successfully!"));

        verify(witsMetadataClient, times(1)).loadCountries();
    }

    @Test
    void syncCountries_Error() {
        // Mock failure
        doThrow(new RuntimeException("API error")).when(witsMetadataClient).loadCountries();

        given()
            .auth()
            .oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
        .when()
            .post("/api/metadata/countries/sync")
        .then()
            .statusCode(500)
            .body(equalTo("Failed to sync countries: API error"));
    }

    @Test
    void syncProducts_Success() {
        // Mock the WitsMetadataClient behavior

        given()
            .header("Authorization", "Bearer " + adminJwtToken)
            .contentType(ContentType.JSON)
        .when()
            .post("/api/metadata/products/sync")
        .then()
            .statusCode(200)
            .body(equalTo("Products synced successfully!"));

        verify(witsMetadataClient, times(1)).loadProducts();
    }

    @Test
    void syncProducts_Error() {
        // Mock failure
        doThrow(new RuntimeException("API error")).when(witsMetadataClient).loadProducts();

        given()
            .header("Authorization", "Bearer " + adminJwtToken)
            .contentType(ContentType.JSON)
        .when()
            .post("/api/metadata/products/sync")
        .then()
            .statusCode(500)
            .body(equalTo("Failed to sync products: API error"));
    }
}