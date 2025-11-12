package com.verbosegarbonzo.tariff.controller;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.model.Transaction;
import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.repository.TransactionRepository;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.JwtService;

import io.restassured.RestAssured;
import static io.restassured.RestAssured.given;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "freight.api.url=https://ship.freightos.com/api/shippingCalculator"
})
public class HistoryControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private ProductRepository productRepository;

    private String adminJwtToken;
    private UserInfo testUser;
    private Country testImporter;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        // Set up RestAssured configuration
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

        // Clean up previous data
        transactionRepository.deleteAll();
        userInfoRepository.deleteAll();
        countryRepository.deleteAll();

        // Create a test user
        testUser = new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN", null);
        userInfoRepository.save(testUser);

        // Generate the JWT token
        adminJwtToken = jwtService.token("admin@email.com");

        // Create a test importer country
        testImporter = new Country("AAA", "CountryA", "001", "City", null);
        countryRepository.save(testImporter);

        // Create mock product
        testProduct = new Product("PROD01", "Product 1");
        productRepository.save(testProduct);
    }

    @Test
    void getAllHistory_WithoutAuth_Returns401() {
        given()
            .when()
                .get("/api/history")
            .then()
                .statusCode(403);  // Unauthorized
                // .body("message", equalTo("Authentication required"));
    }

    @Test
    void getAllHistory_WithAuth_ReturnsEmptyList() {
        given()
            .auth().oauth2(adminJwtToken)
            .when()
                .get("/api/history")
            .then()
                .statusCode(200)
                .contentType("application/json")
                .body("$", hasSize(0));  // No transactions yet
    }

    @Test
    void addHistory_WithoutAuth_Returns401() {
        String requestBody = """
            {
                "t_date": "2025-11-07",
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "importer_code": "AAA",
                "trade_final": "900.00",
                "applied_rate": {"suspension": "0"}
            }
        """;

        given()
            .contentType("application/json")
            .body(requestBody)
            .when()
                .post("/api/history")
            .then()
                .statusCode(403);  // Unauthorized
                // .body("message", equalTo("Authentication required"));
    }

    @Test
    void addHistory_WithAuth_Returns201() {
        String requestBody = """
            {
                "t_date": "2025-11-07",
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "importer_code": "AAA",
                "trade_final": "900.00",
                "applied_rate": {"suspension": "0"}
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(201)
            .body("tradeOriginal", equalTo(1000.00f))
            .body("tradeFinal", equalTo(900.00f))
            .body("importer.countryCode", equalTo("AAA"));
    }

    @Test
    void deleteHistory_WithoutAuth_Returns401() {
        // Assuming a transaction exists already
        Transaction existingTransaction = createTestTransaction();

        given()
            .when()
                .delete("/api/history/" + existingTransaction.getTid())
            .then()
                .statusCode(403);  // Unauthorized
                // .body("message", equalTo("Authentication required"));
    }

    @Test
    void deleteHistory_WithAuth_ReturnsSuccess() {
        // Assuming a transaction exists already
        Transaction existingTransaction = createTestTransaction();

        given()
            .auth().oauth2(adminJwtToken)
            .when()
                .delete("/api/history/" + existingTransaction.getTid())
            .then()
                .statusCode(204);
    }

    private Transaction createTestTransaction() {
        String json = "{\"suspension\": \"0\"}";
        JsonNode applied_rate = null;
        try {
            ObjectMapper mapper = new ObjectMapper();
            applied_rate = mapper.readTree(json);
        } catch(JsonMappingException e) {
            System.out.println("applied_rate error");
        } catch(JsonProcessingException e) {
            System.out.println("applied_rate error");
        }

        Transaction transaction = new Transaction();
        transaction.setUser(testUser);
        transaction.setTDate(LocalDate.now());
        transaction.setImporter(testImporter);
        transaction.setProduct(testProduct);
        transaction.setTradeOriginal(new BigDecimal("1000.00"));
        transaction.setTradeFinal(new BigDecimal("900.00"));
        transaction.setAppliedRate(applied_rate);

        return transactionRepository.save(transaction);
    }
}
