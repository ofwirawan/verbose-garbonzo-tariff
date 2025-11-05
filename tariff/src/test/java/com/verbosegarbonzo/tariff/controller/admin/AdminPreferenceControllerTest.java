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

import com.verbosegarbonzo.tariff.repository.PreferenceRepository;
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
@DisplayName("Admin Preference Controller Integration Tests")
class AdminPreferenceControllerTest {
    @LocalServerPort
    private int port;

    @Autowired
    private PreferenceRepository preferenceRepository;

    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private ProductRepository productRepository;

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

        preferenceRepository.deleteAll();
        countryRepository.deleteAll();
        productRepository.deleteAll();
        userInfoRepository.deleteAll();

        userInfoService.addUser(new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN"));
        adminJwtToken = jwtService.token("admin@email.com");

        // seed importer + exporter + product
        countryRepository.save(new com.verbosegarbonzo.tariff.model.Country("IMP", "CountryA", "001", "City", null));
        countryRepository.save(new com.verbosegarbonzo.tariff.model.Country("EXP", "CountryB", "002", "CityB", null));
        productRepository.save(new com.verbosegarbonzo.tariff.model.Product("PRD001", "Product 1"));
    }

    @Test
    @DisplayName("Create preference")
    void createPreference() {
        String payload = String.format("""
                {
                  "importerCode": "IMP",
                  "exporterCode": "EXP",
                  "productCode": "PRD001",
                  "validFrom": "%s",
                  "prefAdValRate": 2.5
                }
                """, LocalDate.now().toString());

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/api/admin/preferences")
        .then()
            .statusCode(201)
            .body("importerCode", equalTo("IMP"))
            .body("exporterCode", equalTo("EXP"));

        assert preferenceRepository.count() == 1;
    }
}
