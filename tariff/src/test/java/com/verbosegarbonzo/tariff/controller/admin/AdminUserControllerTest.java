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

import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.UserInfoService;
import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.model.UserInfo;

import java.util.UUID;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "freight.api.url=https://ship.freightos.com/api/shippingCalculator"
})
@DisplayName("Admin User Controller Integration Tests")
class AdminUserControllerTest {
    @LocalServerPort
    private int port;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.CountryRepository countryRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.ProductRepository productRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.MeasureRepository measureRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.PreferenceRepository preferenceRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.SuspensionRepository suspensionRepository;

    @Autowired
    private com.verbosegarbonzo.tariff.repository.TransactionRepository transactionRepository;

    @Autowired
    private UserInfoService userInfoService;

    @Autowired
    private JwtService jwtService;

    private String adminJwtToken;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

        // clean all tables to avoid FK conflicts
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
    @DisplayName("Create and fetch user via admin endpoint")
    void createAndFetchUser() {
        String payload = """
                {
                  "name": "Test User",
                  "email": "testuser@example.com",
                  "password": "secret",
                  "roles": "ROLE_USER"
                }
                """;

        var id = given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/api/admin/users")
        .then()
            .statusCode(201)
            .body("email", equalTo("testuser@example.com"))
            .extract()
            .path("uid");

        // fetch
        given()
            .auth().oauth2(adminJwtToken)
        .when()
            .get("/api/admin/users/" + id)
        .then()
            .statusCode(200)
            .body("email", equalTo("testuser@example.com"));

        assert userInfoRepository.count() == 2; // admin + new
    }

    @Test
    @DisplayName("Delete user via admin endpoint")
    void deleteUser() {
        var saved = userInfoRepository.save(new com.verbosegarbonzo.tariff.model.UserInfo(null, "T", "t@e.com", "p", "ROLE_USER", null));
        UUID uid = saved.getUid();

        given()
            .auth().oauth2(adminJwtToken)
        .when()
            .delete("/api/admin/users/" + uid)
        .then()
            .statusCode(204);

        assert userInfoRepository.existsById(uid) == false;
    }
}
