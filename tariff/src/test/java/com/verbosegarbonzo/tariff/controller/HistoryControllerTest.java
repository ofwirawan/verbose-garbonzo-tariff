package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.model.Transaction;
import com.verbosegarbonzo.tariff.model.UserInfo;

import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.repository.TransactionRepository;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;

import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.service.UserInfoService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "spring.jackson.serialization.write-dates-as-timestamps=false",
        "freight.api.url=https://ship.freightos.com/api/shippingCalculator"
})
public class HistoryControllerTest {
    
    @LocalServerPort
    private int port;

    @Autowired
    private UserInfoService userInfoService;

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
    private Country testExporter;

    
    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

        // Clean up
        transactionRepository.deleteAll();
        countryRepository.deleteAll();
        userInfoRepository.deleteAll();
        
        // Create test user
        testUser =  new UserInfo(null, "admin", "admin@email.com", "goodpassword", "ROLE_ADMIN");
        System.out.println(userInfoService.addUser(testUser));

        // Authenticate using the actual AuthController and get JWT token
        adminJwtToken = jwtService.token("admin@email.com");
        System.out.println("Bearer: " + adminJwtToken);
        
        // Create test countries
        testImporter = new com.verbosegarbonzo.tariff.model.Country("AAA", "CountryA", "001", "City", null);
        testImporter = countryRepository.save(testImporter);
        
        testExporter = new com.verbosegarbonzo.tariff.model.Country("BBB", "CountryB", "002", "CityB", null);
        testExporter = countryRepository.save(testExporter);

        Product testProduct = new Product("PROD01", "Product 1");
        productRepository.save(testProduct);
        
    }

    @Test
    void getAllHistory_WithoutAuth_Returns403() {
        given()
            .when()
                .get("/api/history")
            .then()
                .statusCode(403);
    }
    
    @Test
    void getAllHistory_WithAuth_ReturnsEmptyList() {  
        given()
            .auth()
            .oauth2(adminJwtToken)
        .when()
            .get("/api/history")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", empty());
    }
    
    @Test
    void addHistory_WithoutAuth_Returns403() {
       String requestBody = String.format("""
               {
                "t_date": "%s",
                "hs6code": "%s",
                "trade_original": "1000.00",
                "importer_code": "AAA",
                "trade_final": "900.00"
               }
               """, LocalDate.now().toString(), LocalDate.now().toString());
            
        
        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
            .when()
                .post("/api/history")
            .then()
                .statusCode(403);
    }
    
    @Test
    void addHistory_WithAuth_CreatesTransaction() {
        // Prepare request body
        String requestBody = String.format("""
               {
                "t_date": "%s",
                "hs6code": "PROD01",
                "trade_original": "1000.00",
                "importer_code": "%s",
                "trade_final": "900.00",
                "applied_rate": {"suspension" : "0"}
               }
               """, LocalDate.now().toString() ,testImporter.getCountryCode());
        
        // Add transaction
        given()
            .auth()
            .oauth2(adminJwtToken)
            .contentType("application/json")
            .body(requestBody)
        .when()
            .post("/api/history")
        .then()
            .statusCode(201);
        
        // Verify transaction was created
        var transactions = transactionRepository.findByUidOrderByTDateDesc(testUser);
        assert transactions.size() == 1;
        Transaction saved = transactions.get(0);

        assert (saved.getUser().getEmail()).equals(testUser.getEmail());
        assert (saved.getImporter().getCountryCode()).equals(testImporter.getCountryCode());
        assert (saved.getExporter().getCountryCode()).equals(testExporter.getCountryCode());
        assert (saved.getTradeOriginal()).equals(new BigDecimal("1000.00"));
        assert (saved.getTradeFinal()).equals(new BigDecimal("900.00"));
    }
}
