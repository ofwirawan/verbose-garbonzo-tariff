package com.verbosegarbonzo.tariff.controller;

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
import org.springframework.security.core.userdetails.User;
import org.springframework.test.context.TestPropertySource;


import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.*;
import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.service.UserInfoService;

import java.util.UUID;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN"
})
@DisplayName("Admin Controller Integration Tests")
class AdminControllerTest {
    @LocalServerPort
    private int port;

    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private MeasureRepository measureRepository;

    @Autowired
    private PreferenceRepository preferenceRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SuspensionRepository suspensionRepository;

    @Autowired
    private TransactionRepository transactionRepository;

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

        // Clean database before each test
        countryRepository.deleteAll();
        measureRepository.deleteAll();
        preferenceRepository.deleteAll();
        productRepository.deleteAll();
        suspensionRepository.deleteAll();
        transactionRepository.deleteAll();
        userInfoRepository.deleteAll();
        
        System.out.println(userInfoService.addUser(new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN")));

        // Authenticate using the actual AuthController and get JWT token
        adminJwtToken = jwtService.token("admin@email.com");
        System.out.println("Bearer: " + adminJwtToken);
    }

    @Test
    @DisplayName("Should create country if country does not exist")
    void createCountry_ShouldCreateCountryIfCountryDoesNotExist() {
        String newCountryJSON = """
                              {
                                "countryCode": "NGK",
                                "name": "Neghurtalia",
                                "numericCode": "067",
                                "city": "Neghurti"
                              }
                              """;
        given()
            .auth()
            .oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(newCountryJSON)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(201)
            .contentType(ContentType.JSON)
            .body("numericCode", equalTo("067"))
            .body("countryCode", equalTo("NGK"))
            .body("name", equalTo("Neghurtalia"));

        // Assert
        var countries = countryRepository.findAll();
        assert countries.size() == 1;
        assert countries.get(0).getCountryCode().equals("NGK");
    }

    @Test
    @DisplayName("Should return 400 when creating country with invalid data")
    void createCountry_ShouldReturn400WhenDataIsInvalid() {
        String invalidCountryJSON = """
                              {
                                "countryCode": "",
                                "name": "",
                                "numericCode": "invalid"
                              }
                              """;
        given()
            .auth()
            .oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(invalidCountryJSON)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(400);
    }

    @Test
    @DisplayName("Should return 403 when token is missing")
    void createCountry_ShouldReturn403WhenTokenIsMissing() {
        String newCountryJSON = """
                              {
                                "countryCode": "NGK",
                                "name": "Neghurtalia",
                                "numericCode": "067"
                              }
                              """;
        given()
            .contentType(ContentType.JSON)
            .body(newCountryJSON)
        .when()
            .post("/api/admin/countries")
        .then()
            .statusCode(403);



        var countries = countryRepository.findAll();
        assert countries.size() == 0;
    }

}
