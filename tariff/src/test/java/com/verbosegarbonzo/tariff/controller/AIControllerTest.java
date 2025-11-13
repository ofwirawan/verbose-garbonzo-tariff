package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.AIRecommendationResponse;
import com.verbosegarbonzo.tariff.model.ProfileType;
import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.AIRecommendationService;
import com.verbosegarbonzo.tariff.service.GeminiSummaryService;
import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.service.UserInfoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import java.math.BigDecimal;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.h2.console.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "logging.level.org.springframework.security=WARN",
        "logging.level.csd.security=WARN",
        "spring.jackson.serialization.write-dates-as-timestamps=false"
})
public class AIControllerTest {

    @LocalServerPort
    private int port;

    @MockitoBean
    private AIRecommendationService aiRecommendationService;

    @Autowired
    private UserInfoRepository userInfoRepository;

    @MockitoBean
    private GeminiSummaryService geminiSummaryService;

    @Autowired
    private UserInfoService userInfoService;

    @Autowired
    private JwtService jwtService;

    private String userJwt;
    private String studentJwt;
    @SuppressWarnings("unused")
    private UserInfo testUser;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

        userInfoRepository.deleteAll();

        // Create test user with BUSINESS_OWNER profile
        userInfoService.addUser(new UserInfo(null, "testuser", "test@example.com", "password123", "ROLE_USER", ProfileType.BUSINESS_OWNER));

        // Create student user
        userInfoService.addUser(new UserInfo(null, "studentuser", "student@example.com", "password123", "ROLE_USER", ProfileType.STUDENT));

        userJwt = jwtService.token("test@example.com");
        studentJwt = jwtService.token("student@example.com");
        testUser = userInfoRepository.findByEmail("test@example.com").orElse(null);
    }

    @Test
    void getRecommendation_Success_WithBusinessOwnerProfile() {
        // Mock AI recommendation response
        AIRecommendationResponse mockResponse = AIRecommendationResponse.builder()
                .explanation("Best time to import is in Q2")
                .currentRate(new BigDecimal("0.10"))
                .potentialSavings(new BigDecimal("500.00"))
                .potentialSavingsPercent(new BigDecimal("5.0"))
                .averageConfidence(85)
                .modelVersion("1.0")
                .hasInsufficientData(false)
                .build();

        when(aiRecommendationService.getTimingRecommendation(
                anyString(), anyString(), anyString(), any(ProfileType.class)))
                .thenReturn(mockResponse);

        Map<String, Object> request = Map.of(
                "importerCode", "USA",
                "exporterCode", "CHN",
                "hs6Code", "123456"
        );

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/recommendation")
                .then()
                .statusCode(200)
                .body("explanation", equalTo("Best time to import is in Q2"))
                .body("currentRate", equalTo(0.10f))
                .body("potentialSavings", equalTo(500.00f))
                .body("averageConfidence", equalTo(85))
                .body("hasInsufficientData", equalTo(false));
    }

    @Test
    void getRecommendation_Success_WithStudentProfile() {
        // Mock AI recommendation response
        AIRecommendationResponse mockResponse = AIRecommendationResponse.builder()
                .explanation("Educational analysis for trade timing")
                .currentRate(new BigDecimal("0.15"))
                .potentialSavings(new BigDecimal("200.00"))
                .potentialSavingsPercent(new BigDecimal("2.5"))
                .averageConfidence(75)
                .modelVersion("1.0")
                .hasInsufficientData(false)
                .build();

        when(aiRecommendationService.getTimingRecommendation(
                anyString(), anyString(), anyString(), any(ProfileType.class)))
                .thenReturn(mockResponse);

        Map<String, Object> request = Map.of(
                "importerCode", "DEU",
                "exporterCode", "JPN",
                "hs6Code", "654321"
        );

        given()
                .header("Authorization", "Bearer " + studentJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/recommendation")
                .then()
                .statusCode(200)
                .body("explanation", equalTo("Educational analysis for trade timing"))
                .body("averageConfidence", equalTo(75));
    }

    @Test
    void getRecommendation_Success_WithDefaultProfile() {
        // Create user without profile type
        userInfoService.addUser(new UserInfo(null, "newuser", "newuser@example.com", "password123", "ROLE_USER", null));

        String newUserJwt = jwtService.token("newuser@example.com");

        AIRecommendationResponse mockResponse = AIRecommendationResponse.builder()
                .explanation("Default recommendation")
                .currentRate(new BigDecimal("0.12"))
                .averageConfidence(80)
                .modelVersion("1.0")
                .hasInsufficientData(false)
                .build();

        when(aiRecommendationService.getTimingRecommendation(
                anyString(), anyString(), anyString(), any(ProfileType.class)))
                .thenReturn(mockResponse);

        Map<String, Object> request = Map.of(
                "importerCode", "GBR",
                "exporterCode", "IND",
                "hs6Code", "789012"
        );

        given()
                .header("Authorization", "Bearer " + newUserJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/recommendation")
                .then()
                .statusCode(200)
                .body("explanation", equalTo("Default recommendation"));
    }

    @Test
    void getRecommendation_Unauthenticated_Returns403() {
        Map<String, Object> request = Map.of(
                "importerCode", "USA",
                "exporterCode", "CHN",
                "hs6Code", "123456"
        );

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/recommendation")
                .then()
                .statusCode(403);
    }

    @Test
    void getRecommendation_ServiceThrowsException_Returns500() {
        when(aiRecommendationService.getTimingRecommendation(
                anyString(), anyString(), anyString(), any(ProfileType.class)))
                .thenThrow(new RuntimeException("Service unavailable"));

        Map<String, Object> request = Map.of(
                "importerCode", "USA",
                "exporterCode", "CHN",
                "hs6Code", "123456"
        );

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/recommendation")
                .then()
                .statusCode(500);
    }

    @Test
    void getGeminiSummary_Success() {
        // Create policy analyst user
        userInfoService.addUser(new UserInfo(null, "policyuser", "policy@example.com", "password123", "ROLE_USER", ProfileType.POLICY_ANALYST));

        String policyJwt = jwtService.token("policy@example.com");

        // Mock Gemini summary
        String mockSummary = "This is a comprehensive analysis of the tariff timing recommendations...";
        when(geminiSummaryService.generateGeminiSummary(
                any(AIRecommendationResponse.class), any(ProfileType.class), anyString(), anyString()))
                .thenReturn(mockSummary);

        Map<String, Object> recommendation = Map.of(
                "explanation", "Test explanation",
                "currentRate", 0.10,
                "averageConfidence", 85,
                "modelVersion", "1.0",
                "hasInsufficientData", false
        );

        Map<String, Object> request = Map.of(
                "importerCode", "USA",
                "hs6Code", "123456",
                "exporterCode", "CHN",
                "recommendation", recommendation
        );

        given()
                .header("Authorization", "Bearer " + policyJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/gemini-summary")
                .then()
                .statusCode(200)
                .body("summary", equalTo(mockSummary))
                .body("profileType", equalTo("POLICY_ANALYST"))
                .body("success", equalTo(true));
    }

    @Test
    void getGeminiSummary_EmptySummary_ReturnsFalseSuccess() {
        // Mock empty summary
        when(geminiSummaryService.generateGeminiSummary(
                any(AIRecommendationResponse.class), any(ProfileType.class), anyString(), anyString()))
                .thenReturn("");

        Map<String, Object> recommendation = Map.of(
                "explanation", "Test explanation",
                "currentRate", 0.10,
                "averageConfidence", 85,
                "modelVersion", "1.0",
                "hasInsufficientData", false
        );

        Map<String, Object> request = Map.of(
                "importerCode", "USA",
                "hs6Code", "123456",
                "recommendation", recommendation
        );

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/gemini-summary")
                .then()
                .statusCode(200)
                .body("summary", equalTo(""))
                .body("success", equalTo(false));
    }

    @Test
    void getGeminiSummary_Unauthenticated_Returns403() {
        Map<String, Object> recommendation = Map.of(
                "explanation", "Test explanation",
                "currentRate", 0.10
        );

        Map<String, Object> request = Map.of(
                "importerCode", "USA",
                "hs6Code", "123456",
                "recommendation", recommendation
        );

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/gemini-summary")
                .then()
                .statusCode(403);
    }

    @Test
    void getGeminiSummary_ServiceThrowsException_Returns500WithFailureResponse() {
        when(geminiSummaryService.generateGeminiSummary(
                any(AIRecommendationResponse.class), any(ProfileType.class), anyString(), anyString()))
                .thenThrow(new RuntimeException("Gemini API error"));

        Map<String, Object> recommendation = Map.of(
                "explanation", "Test explanation",
                "currentRate", 0.10,
                "averageConfidence", 85,
                "modelVersion", "1.0",
                "hasInsufficientData", false
        );

        Map<String, Object> request = Map.of(
                "importerCode", "USA",
                "hs6Code", "123456",
                "recommendation", recommendation
        );

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/gemini-summary")
                .then()
                .statusCode(500)
                .body("summary", equalTo(""))
                .body("success", equalTo(false));
    }

    @Test
    void getGeminiSummary_InvalidRequest_MissingRequiredFields_Returns400() {
        // Request missing required fields (importerCode and hs6Code are @NotBlank)
        Map<String, Object> request = Map.of(
                "recommendation", Map.of("explanation", "test")
        );

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/gemini-summary")
                .then()
                .statusCode(400);
    }

    @Test
    void getGeminiSummary_InvalidRequest_EmptyFields_Returns400() {
        Map<String, Object> recommendation = Map.of(
                "explanation", "Test explanation"
        );

        Map<String, Object> request = Map.of(
                "importerCode", "",
                "hs6Code", "",
                "recommendation", recommendation
        );

        given()
                .header("Authorization", "Bearer " + userJwt)
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/ai/gemini-summary")
                .then()
                .statusCode(400);
    }
}
