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

import com.verbosegarbonzo.tariff.repository.*;
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
@DisplayName("Admin Transaction Controller Integration Tests")
class AdminTransactionControllerTest {
    @LocalServerPort
    private int port;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private MeasureRepository measureRepository;

    @Autowired
    private PreferenceRepository preferenceRepository;

    @Autowired
    private SuspensionRepository suspensionRepository;

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

        // seed user (other than admin), country and product
        userInfoRepository.save(new com.verbosegarbonzo.tariff.model.UserInfo(null, "U", "u@x.com", "p", "ROLE_USER"));
        countryRepository.save(new com.verbosegarbonzo.tariff.model.Country("IMP", "CountryA", "001", "City", null));
        productRepository.save(new com.verbosegarbonzo.tariff.model.Product("PROD01", "Product 1"));
    }

    @Test
    @DisplayName("Create transaction")
    void createTransaction() {
        var user = userInfoRepository.findByEmail("admin@email.com").get();
        String payload = String.format("""
                {
                  "user": "%s",
                  "tDate": "%s",
                  "importer": "IMP",
                  "product": "PROD01",
                  "tradeOriginal": 100.5,
                  "netWeight": 10.0,
                  "tradeFinal": 80.0,
                  "appliedRate": {}
                }
                """, user.getUid().toString(), LocalDate.now().toString());

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/api/admin/transactions")
        .then()
            .statusCode(201)
            .body("importer", equalTo("IMP"))
            .body("product", equalTo("PROD01"));

        assert transactionRepository.count() == 1;
    }
}
