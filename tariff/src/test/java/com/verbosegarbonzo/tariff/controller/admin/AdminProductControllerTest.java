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

import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.UserInfoService;
import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.model.UserInfo;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "freight.api.url=https://ship.freightos.com/api/shippingCalculator"
})
@DisplayName("Admin Product Controller Integration Tests")
class AdminProductControllerTest {
    @LocalServerPort
    private int port;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.CountryRepository countryRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.MeasureRepository measureRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.PreferenceRepository preferenceRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.SuspensionRepository suspensionRepository;

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

        // clean in order to avoid FK constraint issues
        measureRepository.deleteAll();
        preferenceRepository.deleteAll();
        suspensionRepository.deleteAll();
        transactionRepository.deleteAll();
        productRepository.deleteAll();
        countryRepository.deleteAll();
        userInfoRepository.deleteAll();

        userInfoService.addUser(new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN", null));
        adminJwtToken = jwtService.token("admin@email.com");
    }

    @Test
    @DisplayName("Create product and get it")
    void createProductAndGet() {
        String payload = """
                {
                  "hs6Code": "123456",
                  "description": "Test product"
                }
                """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/api/admin/products")
        .then()
            .statusCode(201)
            .body("hs6Code", equalTo("123456"))
            .body("description", equalTo("Test product"));

        given()
            .auth().oauth2(adminJwtToken)
        .when()
            .get("/api/admin/products/123456")
        .then()
            .statusCode(200)
            .body("hs6Code", equalTo("123456"));

        assert productRepository.existsById("123456");
    }

    @Test
    @DisplayName("Create duplicate product returns 409")
    void createDuplicateProduct() {
        productRepository.save(new com.verbosegarbonzo.tariff.model.Product("654321", "Existing"));

        String payload = """
                {
                  "hs6Code": "654321",
                  "description": "Dup"
                }
                """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/api/admin/products")
        .then()
            .statusCode(409);
    }
}
