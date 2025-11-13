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

    @Test
    void getAllHistory_WithAuth_ReturnsTransactionsList() {
        // Create multiple transactions
        createTestTransaction();
        createTestTransaction();
        Transaction transaction3 = createTestTransaction();

        given()
            .auth().oauth2(adminJwtToken)
            .when()
                .get("/api/history")
            .then()
                .statusCode(200)
                .contentType("application/json")
                .body("$", hasSize(3))
                .body("[0].tradeOriginal", equalTo(1000.00f))
                .body("[0].tradeFinal", equalTo(900.00f));
    }

    @Test
    void addHistory_MissingRequiredField_TDate_Returns400() {
        String requestBody = """
            {
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "importer_code": "AAA",
                "trade_final": "900.00"
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(400)
            .body("message", equalTo("t_date is required"));
    }

    @Test
    void addHistory_MissingRequiredField_Hs6Code_Returns400() {
        String requestBody = """
            {
                "t_date": "2025-11-07",
                "trade_original": "1000.00",
                "importer_code": "AAA",
                "trade_final": "900.00"
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(400)
            .body("message", equalTo("hs6code is required"));
    }

    @Test
    void addHistory_MissingRequiredField_TradeOriginal_Returns400() {
        String requestBody = """
            {
                "t_date": "2025-11-07",
                "hs6code": "PROD01",
                "importer_code": "AAA",
                "trade_final": "900.00"
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(400)
            .body("message", equalTo("trade_original is required"));
    }

    @Test
    void addHistory_MissingRequiredField_ImporterCode_Returns400() {
        String requestBody = """
            {
                "t_date": "2025-11-07",
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "trade_final": "900.00"
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(400)
            .body("message", equalTo("importer_code is required"));
    }

    @Test
    void addHistory_MissingRequiredField_TradeFinal_Returns400() {
        String requestBody = """
            {
                "t_date": "2025-11-07",
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "importer_code": "AAA"
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(400)
            .body("message", equalTo("trade_final is required"));
    }

    @Test
    void addHistory_WithOptionalFields_Returns201() {
        // Create exporter country
        Country testExporter = new Country("BBB", "CountryB", "002", "City2", null);
        countryRepository.save(testExporter);

        String requestBody = """
            {
                "t_date": "2025-11-07",
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "importer_code": "AAA",
                "exporter_code": "BBB",
                "trade_final": "950.00",
                "net_weight": "500.50",
                "applied_rate": {"advalorem": "0.05"},
                "freight_cost": "50.00",
                "freight_type": "air",
                "insurance_rate": "0.02",
                "insurance_cost": "20.00",
                "total_landed_cost": "1020.00",
                "warnings": ["Warning 1", "Warning 2"]
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
            .body("tradeFinal", equalTo(950.00f))
            .body("netWeight", equalTo(500.50f))
            .body("freightCost", equalTo(50.00f))
            .body("freightType", equalTo("air"))
            .body("insuranceRate", equalTo(0.02f))
            .body("insuranceCost", equalTo(20.00f))
            .body("totalLandedCost", equalTo(1020.00f))
            .body("importer.countryCode", equalTo("AAA"))
            .body("exporter.countryCode", equalTo("BBB"));
    }

    @Test
    void addHistory_InvalidCountryCode_Returns500() {
        String requestBody = """
            {
                "t_date": "2025-11-07",
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "importer_code": "INVALID",
                "trade_final": "900.00"
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(500);
    }

    @Test
    void addHistory_InvalidProductCode_Returns500() {
        String requestBody = """
            {
                "t_date": "2025-11-07",
                "hs6code": "INVALID_PROD",
                "trade_original": "1000.00",
                "importer_code": "AAA",
                "trade_final": "900.00"
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(500);
    }

    @Test
    void deleteHistory_NonExistentTransaction_Returns404() {
        given()
            .auth().oauth2(adminJwtToken)
            .when()
                .delete("/api/history/99999")
            .then()
                .statusCode(404)
                .body("message", equalTo("Transaction not found or access denied"));
    }

    @Test
    void deleteHistory_TransactionBelongsToAnotherUser_Returns404() {
        // Create another user
        UserInfo anotherUser = new UserInfo(null, "otheruser", "other@email.com", "password", "ROLE_USER", null);
        userInfoRepository.save(anotherUser);

        // Create transaction for another user
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

        Transaction otherTransaction = new Transaction();
        otherTransaction.setUser(anotherUser);
        otherTransaction.setTDate(LocalDate.now());
        otherTransaction.setImporter(testImporter);
        otherTransaction.setProduct(testProduct);
        otherTransaction.setTradeOriginal(new BigDecimal("1000.00"));
        otherTransaction.setTradeFinal(new BigDecimal("900.00"));
        otherTransaction.setAppliedRate(applied_rate);
        Transaction savedTransaction = transactionRepository.save(otherTransaction);

        // Try to delete with admin token (should not be able to delete another user's transaction)
        given()
            .auth().oauth2(adminJwtToken)
            .when()
                .delete("/api/history/" + savedTransaction.getTid())
            .then()
                .statusCode(404)
                .body("message", equalTo("Transaction not found or access denied"));
    }

    @Test
    void addHistory_NullRequiredField_TDate_Returns400() {
        String requestBody = """
            {
                "t_date": null,
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "importer_code": "AAA",
                "trade_final": "900.00"
            }
        """;

        given()
            .auth().oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(400)
            .body("message", equalTo("t_date is required"));
    }

    @Test
    void getAllHistory_MultipleUsers_ReturnsOnlyCurrentUserTransactions() {
        // Create another user
        UserInfo anotherUser = new UserInfo(null, "otheruser", "other@email.com", "password", "ROLE_USER", null);
        userInfoRepository.save(anotherUser);
        String otherUserToken = jwtService.token("other@email.com");

        // Create transactions for current user
        createTestTransaction();
        createTestTransaction();

        // Create transaction for other user
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

        Transaction otherTransaction = new Transaction();
        otherTransaction.setUser(anotherUser);
        otherTransaction.setTDate(LocalDate.now());
        otherTransaction.setImporter(testImporter);
        otherTransaction.setProduct(testProduct);
        otherTransaction.setTradeOriginal(new BigDecimal("2000.00"));
        otherTransaction.setTradeFinal(new BigDecimal("1800.00"));
        otherTransaction.setAppliedRate(applied_rate);
        transactionRepository.save(otherTransaction);

        // Verify admin user only sees their own transactions
        given()
            .auth().oauth2(adminJwtToken)
            .when()
                .get("/api/history")
            .then()
                .statusCode(200)
                .body("$", hasSize(2));

        // Verify other user only sees their own transaction
        given()
            .auth().oauth2(otherUserToken)
            .when()
                .get("/api/history")
            .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].tradeOriginal", equalTo(2000.00f));
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
