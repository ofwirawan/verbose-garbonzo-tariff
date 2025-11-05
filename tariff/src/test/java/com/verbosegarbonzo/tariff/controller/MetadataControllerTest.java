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
import org.mockito.Mock;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ExtendWith(MockitoExtension.class)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "spring.jackson.serialization.write-dates-as-timestamps=false"
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

    @Mock
    private WitsMetadataClient witsMetadataClient;

    private String adminJwtToken;
    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

        // Clean up
        countryRepository.deleteAll();
        productRepository.deleteAll();
        userInfoRepository.deleteAll();

        // Create admin user
        userInfoRepository.save(new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN"));

        // Generate JWT token
        adminJwtToken = jwtService.generateToken("admin@email.com");
    }

    @Test
    void syncCountries_Success() {
        // Mock the WitsMetadataClient behavior
        doNothing().when(witsMetadataClient).loadCountries();

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
            .header("Authorization", "Bearer " + adminJwtToken)
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
        doNothing().when(witsMetadataClient).loadProducts();

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