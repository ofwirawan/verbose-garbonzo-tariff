package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.service.UserInfoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

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
public class UserControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserInfoService userInfoService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserInfoRepository userInfoRepository;

    private String userJwt;
    private UserInfo testUser;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

        userInfoRepository.deleteAll();

        // Create a test user and token
        userInfoService.addUser(new UserInfo(null, "testuser", "test@example.com", "password123", "ROLE_USER"));

        userJwt = jwtService.token("test@example.com");
        testUser = userInfoRepository.findByEmail("test@example.com").orElse(null);
    }

    @Test
    void addNewUser_Success() {
        Map<String, Object> newUser = Map.of(
                "username", "newuser",
                "email", "new@example.com",
                "password", "password123",
                "roles", "ROLE_USER");

        given()
                .contentType(ContentType.JSON)
                .body(newUser)
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200)
                .body(containsString("User added successfully"));
    }

    // @Test
    // void addNewUser_DuplicateEmail_Returns400() {
    //     // Try to add user with same email as testUser
    //     Map<String, Object> duplicate = Map.of(
    //             "username", "dupuser",
    //             "email", testUser.getEmail(),
    //             "password", "password123",
    //             "roles", "ROLE_USER");

    //     given()
    //             .contentType(ContentType.JSON)
    //             .body(duplicate)
    //             .when()
    //             .post("/auth/register")
    //             .then()
    //             .statusCode(400);
    // }

    @Test
    void generateToken_ValidCredentials() {
        Map<String, Object> req = Map.of(
                "username", testUser.getEmail(),
                "password", "password123");

        given()
                .contentType(ContentType.JSON)
                .body(req)
                .when()
                .post("/auth/token")
                .then()
                .statusCode(200)
                // .body(notNull())
                .body(notNullValue());
    }

    @Test
    void generateToken_InvalidCredentials() {
        Map<String, Object> req = Map.of(
                "username", testUser.getEmail(),
                "password", "wrongpassword");

        given()
                .contentType(ContentType.JSON)
                .body(req)
                .when()
                .post("/auth/token")
                .then()
                .statusCode(403);
    }

    @Test
    void userProfile_WithAuth_ReturnsEmail() {
        given()
                .header("Authorization", "Bearer " + userJwt)
                .when()
                .get("/auth/profile")
                .then()
                .statusCode(200)
                .body(equalTo(testUser.getEmail()));
    }

    @Test
    void userProfile_WithoutAuth_Returns403() {
        given()
                .when()
                .get("/auth/profile")
                .then()
                .statusCode(403);
    }
}