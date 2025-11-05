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
import static org.mockito.ArgumentMatchers.notNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.h2.console.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "logging.level.org.springframework.security=WARN",
    "logging.level.csd.security=WARN",
    "spring.jackson.serialization.write-dates-as-timestamps=false"
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
    userJwt = jwtService.generateToken("test@example.com");
    }

    @Test
    void addNewUser_Success() {
    Map<String, Object> newUser = Map.of(
        "username", "newuser",
        "email", "new@example.com",
        "password", "password123",
        "roles", new String[]{"ROLE_USER"}
    );

    given()
        .contentType(ContentType.JSON)
        .body(newUser)
    .when()
        .post("/auth/addNewUser")
    .then()
        .statusCode(200)
        .body(containsString("User added successfully"));
    }

    @Test
    void addNewUser_DuplicateEmail_Returns400() {
    // Try to add user with same email as testUser
    Map<String, Object> duplicate = Map.of(
        "username", "dupuser",
        "email", testUser.getEmail(),
        "password", "password123",
        "roles", new String[]{"ROLE_USER"}
    );

    given()
        .contentType(ContentType.JSON)
        .body(duplicate)
    .when()
        .post("/auth/addNewUser")
    .then()
        .statusCode(400);
    }

    @Test
    void generateToken_ValidCredentials() {
    Map<String, Object> req = Map.of(
        "username", testUser.getEmail(),
        "password", "password123"
    );

    given()
        .contentType(ContentType.JSON)
        .body(req)
    .when()
        .post("/auth/generateToken")
    .then()
        .statusCode(200)
        .body(notNull())
        .body(notNullValue());
    }

    @Test
    void generateToken_InvalidCredentials() {
    Map<String, Object> req = Map.of(
        "username", testUser.getEmail(),
        "password", "wrongpassword"
    );

    given()
        .contentType(ContentType.JSON)
        .body(req)
    .when()
        .post("/auth/generateToken")
    .then()
        .statusCode(401);
    }

    @Test
    void userProfile_WithAuth_ReturnsEmail() {
    given()
        .header("Authorization", "Bearer " + userJwt)
    .when()
        .get("/auth/user/userProfile")
    .then()
        .statusCode(200)
        .body(equalTo(testUser.getEmail()));
    }

    @Test
    void userProfile_WithoutAuth_Returns401() {
    given()
    .when()
        .get("/auth/user/userProfile")
    .then()
        .statusCode(401);
    }
}