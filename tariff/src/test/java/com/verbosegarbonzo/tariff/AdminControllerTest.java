package com.verbosegarbonzo.tariff;

import static io.restassured.RestAssured.given;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import com.verbosegarbonzo.tariff.repository.*;



@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN"
})
@DisplayName("Book Controller Real Server Integration Tests")
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

        // Authenticate using the actual AuthController and get JWT token
        adminJwtToken = authenticateAndGetToken("admin", "goodpassword");
    }

    private String authenticateAndGetToken(String username, String password) {
        String loginJson = String.format("""
                {
                    "username": "%s",
                    "password": "%s"
                }
                """, username, password);

        return given()
                .contentType(ContentType.JSON)
                .body(loginJson)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");
    }

}
