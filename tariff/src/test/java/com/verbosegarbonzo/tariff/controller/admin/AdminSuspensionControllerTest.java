package com.verbosegarbonzo.tariff.controller.admin;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import com.verbosegarbonzo.tariff.repository.SuspensionRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.UserInfoService;
import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.model.UserInfo;

import java.time.LocalDate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "freight.api.url=https://ship.freightos.com/api/shippingCalculator"
})
@DisplayName("Admin Suspension Controller Integration Tests")
class AdminSuspensionControllerTest {
    @LocalServerPort
    private int port;

    @Autowired
    private SuspensionRepository suspensionRepository;

    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.MeasureRepository measureRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.PreferenceRepository preferenceRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.TransactionRepository transactionRepository;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private UserInfoService userInfoService;

    @Autowired
    private JwtService jwtService;

    private String adminJwtToken;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

    measureRepository.deleteAll();
    preferenceRepository.deleteAll();
    suspensionRepository.deleteAll();
    transactionRepository.deleteAll();
    productRepository.deleteAll();
    countryRepository.deleteAll();
    userInfoRepository.deleteAll();

        userInfoService.addUser(new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN"));
        adminJwtToken = jwtService.token("admin@email.com");

        // seed importer + product
        countryRepository.save(new com.verbosegarbonzo.tariff.model.Country("IMP", "CountryA", "001", "City", null));
        productRepository.save(new com.verbosegarbonzo.tariff.model.Product("PROD01", "Product 1"));
    }

    @Test
    @DisplayName("Create suspension")
    void createSuspension() {
        String payload = String.format("""
                {
                  "importerCode": "IMP",
                  "productCode": "PROD01",
                  "validFrom": "%s",
                  "validTo": "%s",
                  "suspensionFlag": true,
                  "suspensionNote": "note",
                  "suspensionRate": 0.5
                }
                """, LocalDate.now().toString(), LocalDate.now().plusDays(10).toString());

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/api/admin/suspensions")
        .then()
            .statusCode(201)
            .body("importerCode", equalTo("IMP"))
            .body("productCode", equalTo("PROD01"));

        assert suspensionRepository.count() == 1;
    }
}
