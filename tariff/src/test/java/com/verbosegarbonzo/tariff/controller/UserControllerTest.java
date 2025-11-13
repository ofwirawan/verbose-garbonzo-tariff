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
        userInfoService.addUser(new UserInfo(null, "testuser", "test@example.com", "password123", "ROLE_USER", null));

        userJwt = jwtService.token("test@example.com");
        testUser = userInfoRepository.findByEmail("test@example.com").orElse(null);
    }

    @Test
    void addNewUser_Success() {
        Map<String, Object> newUser = Map.of(
                "name", "newuser",
                "email", "new@example.com",
                "password", "password123",
                "roles", "ROLE_USER");

        given()
                .relaxedHTTPSValidation()
                .contentType(ContentType.JSON)
                .body(newUser)
                .when()
                .post("/api/auth/register")
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
                .post("/api/auth/token")
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
                .post("/api/auth/token")
                .then()
                .statusCode(401);
    }

    @Test
    void userProfile_WithAuth_ReturnsEmail() {
        given()
                .header("Authorization", "Bearer " + userJwt)
                .when()
                .get("/api/auth/profile")
                .then()
                .statusCode(200)
                .body("email", equalTo(testUser.getEmail()))
                .body("uid", notNullValue())
                .body("name", notNullValue())
                .body("roles", equalTo("ROLE_USER"));
    }

    @Test
    void userProfile_WithoutAuth_Returns403() {
        given()
                .when()
                .get("/api/auth/profile")
                .then()
                .statusCode(403);
    }

    @Test
    void updateProfileName_WithAuth_Success() {
        String newName = "Updated Test User";
        Map<String, String> updateRequest = Map.of("name", newName);

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/auth/profile/update-name")
                .then()
                .statusCode(200)
                .body("email", equalTo(testUser.getEmail()))
                .body("name", equalTo(newName))
                .body("uid", notNullValue())
                .body("roles", equalTo("ROLE_USER"));
    }

    @Test
    void updateProfileName_WithoutAuth_Returns403() {
        Map<String, String> updateRequest = Map.of("name", "Updated Name");

        given()
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/auth/profile/update-name")
                .then()
                .statusCode(403);
    }

    @Test
    void updateProfileName_EmptyName_ReturnsBadRequest() {
        Map<String, String> updateRequest = Map.of("name", "");

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/auth/profile/update-name")
                .then()
                .statusCode(400);
    }

    @Test
    void updateProfileType_WithAuth_Success() {
        Map<String, String> updateRequest = Map.of("profileType", "BUSINESS_OWNER");

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/auth/profile/update-type")
                .then()
                .statusCode(200)
                .body("email", equalTo(testUser.getEmail()))
                .body("profileType", equalTo("BUSINESS_OWNER"))
                .body("uid", notNullValue())
                .body("roles", equalTo("ROLE_USER"));
    }

    @Test
    void updateProfileType_ToMultipleTypes_Success() {
        // Test updating to POLICY_ANALYST
        Map<String, String> updateRequest1 = Map.of("profileType", "POLICY_ANALYST");

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(updateRequest1)
                .when()
                .put("/api/auth/profile/update-type")
                .then()
                .statusCode(200)
                .body("profileType", equalTo("POLICY_ANALYST"));

        // Test updating to STUDENT
        Map<String, String> updateRequest2 = Map.of("profileType", "STUDENT");

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(updateRequest2)
                .when()
                .put("/api/auth/profile/update-type")
                .then()
                .statusCode(200)
                .body("profileType", equalTo("STUDENT"));
    }

    @Test
    void updateProfileType_WithoutAuth_Returns403() {
        Map<String, String> updateRequest = Map.of("profileType", "BUSINESS_OWNER");

        given()
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/auth/profile/update-type")
                .then()
                .statusCode(403);
    }

    @Test
    void updateProfileType_InvalidType_ReturnsBadRequest() {
        Map<String, String> updateRequest = Map.of("profileType", "INVALID_TYPE");

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/auth/profile/update-type")
                .then()
                .statusCode(400);
    }

    @Test
    void updateProfileType_SetToNull_Success() {
        // First set a profile type
        Map<String, String> updateRequest1 = Map.of("profileType", "BUSINESS_OWNER");
        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(updateRequest1)
                .when()
                .put("/api/auth/profile/update-type")
                .then()
                .statusCode(200);

        // Now set it to null
        Map<String, String> updateRequest2 = Map.of("profileType", "null");

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(updateRequest2)
                .when()
                .put("/api/auth/profile/update-type")
                .then()
                .statusCode(200)
                .body("profileType", nullValue());
    }
}