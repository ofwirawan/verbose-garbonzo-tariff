package com.verbosegarbonzo.tariff.controller.admin;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.PreferenceRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.repository.SuspensionRepository;
import com.verbosegarbonzo.tariff.repository.TransactionRepository;
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
@DisplayName("Admin Measure Controller Integration Tests")
class AdminMeasureControllerTest {
    @LocalServerPort
    private int port;

    @Autowired
    private MeasureRepository measureRepository;

    @Autowired
    private CountryRepository countryRepository;

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

        // clean all tables to avoid FK conflicts
        // Delete dependent entities first (those with foreign keys) before deleting referenced entities
        suspensionRepository.deleteAll();   // FK to Country
        transactionRepository.deleteAll();  // FK to UserInfo, Product
        measureRepository.deleteAll();      // FK to Country, Product
        preferenceRepository.deleteAll();   // FK to Country (importer/exporter), Product
        userInfoRepository.deleteAll();
        productRepository.deleteAll();
        countryRepository.deleteAll();

        userInfoService.addUser(new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN", null));
        adminJwtToken = jwtService.token("admin@email.com");

        // seed country and product
        countryRepository.save(new com.verbosegarbonzo.tariff.model.Country("IMP", "CountryA", "001", "City", null));
        productRepository.save(new com.verbosegarbonzo.tariff.model.Product("PROD01", "Product 1"));
    }

    @AfterEach
    void tearDown() {
        // Delete dependent entities first before deleting referenced entities
        suspensionRepository.deleteAll();   // FK to Country
        transactionRepository.deleteAll();  // FK to UserInfo, Product
        measureRepository.deleteAll();      // FK to Country, Product
        preferenceRepository.deleteAll();   // FK to Country (importer/exporter), Product
        userInfoRepository.deleteAll();
        productRepository.deleteAll();
        countryRepository.deleteAll();
    }

    @Test
    @DisplayName("Create measure")
    void createMeasure() {
        String payload = String.format("""
                {
                  "importerCode": "IMP",
                  "productCode": "PROD01",
                  "validFrom": "%s",
                  "mfnAdvalRate": 1.23,
                  "specificRatePerKg": 0.45
                }
                """, LocalDate.now().toString());

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/api/admin/measures")
        .then()
            .statusCode(201)
            .body("importerCode", equalTo("IMP"))
            .body("productCode", equalTo("PROD01"));

        assert measureRepository.count() == 1;
    }

    @Test
    @DisplayName("Create duplicate measure returns 409")
    void duplicateMeasureConflict() {
        // create first
        var m = new com.verbosegarbonzo.tariff.model.Measure();
        m.setImporter(countryRepository.findById("IMP").get());
        m.setProduct(productRepository.findById("PROD01").get());
        m.setValidFrom(LocalDate.now());
        measureRepository.save(m);

        String payload = String.format("""
                {
                  "importerCode": "IMP",
                  "productCode": "PROD01",
                  "validFrom": "%s",
                  "mfnAdvalRate": 1.23,
                  "specificRatePerKg": 0.45
                }
                """, LocalDate.now().toString());

        given()
            .auth().oauth2(adminJwtToken)
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/api/admin/measures")
        .then()
            .statusCode(409);
    }
}
