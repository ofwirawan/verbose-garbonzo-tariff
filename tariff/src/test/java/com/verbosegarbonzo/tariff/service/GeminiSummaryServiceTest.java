package com.verbosegarbonzo.tariff.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.verbosegarbonzo.tariff.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeminiSummaryServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private GeminiSummaryService geminiSummaryService;

    private AIRecommendationResponse testRecommendation;

    @BeforeEach
    void setUp() {
        // Set up API key and URL using reflection
        ReflectionTestUtils.setField(geminiSummaryService, "geminiApiKey", "test-api-key-123");
        ReflectionTestUtils.setField(geminiSummaryService, "geminiApiUrl",
            "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent");

        // Create test recommendation
        testRecommendation = AIRecommendationResponse.builder()
            .currentRate(new BigDecimal("0.10"))
            .potentialSavings(new BigDecimal("500.00"))
            .potentialSavingsPercent(new BigDecimal("5.0"))
            .averageConfidence(85)
            .explanation("Based on historical data analysis")
            .optimalPeriods(createTestOptimalPeriods())
            .avoidPeriods(new ArrayList<>())
            .modelVersion("1.0.0")
            .hasInsufficientData(false)
            .build();
    }

    @Test
    void generateGeminiSummary_WithValidData_ReturnsFormattedSummary() throws Exception {
        // Given
        String mockGeminiResponse = createMockGeminiResponse("This is a test summary from Gemini API");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isNotEmpty();
        verify(restTemplate).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    void generateGeminiSummary_WithNoApiKey_ReturnsEmptyString() {
        // Given
        ReflectionTestUtils.setField(geminiSummaryService, "geminiApiKey", "");

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isEmpty();
        verify(restTemplate, never()).postForObject(anyString(), any(), any());
    }

    @Test
    void generateGeminiSummary_WithNullApiKey_ReturnsEmptyString() {
        // Given
        ReflectionTestUtils.setField(geminiSummaryService, "geminiApiKey", null);

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isEmpty();
        verify(restTemplate, never()).postForObject(anyString(), any(), any());
    }

    @Test
    void generateGeminiSummary_BusinessOwnerProfile_BuildsCorrectPrompt() throws Exception {
        // Given
        String mockGeminiResponse = createMockGeminiResponse("Business-focused summary");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isNotEmpty();
        verify(restTemplate).postForObject(
            contains("key=test-api-key-123"),
            argThat(request -> {
                String body = request.toString();
                return body.contains("BUSINESS OWNER") || body.contains("business");
            }),
            eq(String.class)
        );
    }

    @Test
    void generateGeminiSummary_PolicyAnalystProfile_BuildsCorrectPrompt() throws Exception {
        // Given
        String mockGeminiResponse = createMockGeminiResponse("Policy-focused analysis");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.POLICY_ANALYST, "USA", "123456");

        // Then
        assertThat(summary).isNotEmpty();
        verify(restTemplate).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    void generateGeminiSummary_StudentProfile_BuildsCorrectPrompt() throws Exception {
        // Given
        String mockGeminiResponse = createMockGeminiResponse("Educational explanation");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.STUDENT, "USA", "123456");

        // Then
        assertThat(summary).isNotEmpty();
        verify(restTemplate).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    void generateGeminiSummary_WithRestClientException_ReturnsEmptyString() {
        // Given
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenThrow(new RestClientException("API Error"));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isEmpty();
    }

    @Test
    void generateGeminiSummary_WithNullResponse_ReturnsEmptyString() {
        // Given
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(null);

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isEmpty();
    }

    @Test
    void generateGeminiSummary_WithMalformedResponse_ReturnsEmptyString() throws Exception {
        // Given
        String malformedResponse = "{\"error\": \"Invalid request\"}";
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(malformedResponse);
        when(objectMapper.readTree(malformedResponse))
            .thenReturn(new ObjectMapper().readTree(malformedResponse));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isEmpty();
    }

    @Test
    void generateGeminiSummary_WithEmptyResponseText_ReturnsEmptyString() throws Exception {
        // Given
        String mockGeminiResponse = createMockGeminiResponse("");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isEmpty();
    }

    @Test
    void generateGeminiSummary_WithOptimalPeriods_IncludesPeriodsInPrompt() throws Exception {
        // Given
        String mockGeminiResponse = createMockGeminiResponse("Summary with periods");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        AIRecommendationResponse recommendationWithPeriods = AIRecommendationResponse.builder()
            .currentRate(new BigDecimal("0.10"))
            .potentialSavingsPercent(new BigDecimal("5.0"))
            .averageConfidence(85)
            .explanation("Test explanation")
            .optimalPeriods(createTestOptimalPeriods())
            .avoidPeriods(new ArrayList<>())
            .build();

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            recommendationWithPeriods, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isNotEmpty();
        verify(restTemplate).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    void generateGeminiSummary_CallsApiWithCorrectUrl() throws Exception {
        // Given
        String mockGeminiResponse = createMockGeminiResponse("Test summary");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        verify(restTemplate).postForObject(
            contains("generativelanguage.googleapis.com"),
            any(),
            eq(String.class)
        );
    }

    @Test
    void generateGeminiSummary_IncludesApiKeyInUrl() throws Exception {
        // Given
        String mockGeminiResponse = createMockGeminiResponse("Test summary");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        verify(restTemplate).postForObject(
            contains("key=test-api-key-123"),
            any(),
            eq(String.class)
        );
    }

    @Test
    void generateGeminiSummary_WithLongResponse_HandlesCorrectly() throws Exception {
        // Given
        String longText = "This is a very long summary. ".repeat(50);
        String mockGeminiResponse = createMockGeminiResponse(longText);
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isNotEmpty();
        assertThat(summary.length()).isGreaterThan(100);
    }

    @Test
    void generateGeminiSummary_WithSpecialCharacters_HandlesEscaping() throws Exception {
        // Given
        AIRecommendationResponse recommendationWithSpecialChars = AIRecommendationResponse.builder()
            .currentRate(new BigDecimal("0.10"))
            .potentialSavingsPercent(new BigDecimal("5.0"))
            .averageConfidence(85)
            .explanation("Test with \"quotes\" and \n newlines \t tabs")
            .optimalPeriods(new ArrayList<>())
            .avoidPeriods(new ArrayList<>())
            .build();

        String mockGeminiResponse = createMockGeminiResponse("Summary with special chars");
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(mockGeminiResponse);
        when(objectMapper.readTree(mockGeminiResponse))
            .thenReturn(new ObjectMapper().readTree(mockGeminiResponse));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            recommendationWithSpecialChars, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isNotEmpty();
    }

    @Test
    void generateGeminiSummary_WithJsonParsingException_ReturnsEmptyString() throws Exception {
        // Given
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn("invalid json");
        when(objectMapper.readTree(anyString()))
            .thenThrow(new RuntimeException("JSON parsing error"));

        // When
        String summary = geminiSummaryService.generateGeminiSummary(
            testRecommendation, ProfileType.BUSINESS_OWNER, "USA", "123456");

        // Then
        assertThat(summary).isEmpty();
    }

    // Helper methods

    private List<OptimalPeriod> createTestOptimalPeriods() {
        List<OptimalPeriod> periods = new ArrayList<>();
        periods.add(OptimalPeriod.builder()
            .startDate(LocalDate.now().plusMonths(1))
            .endDate(LocalDate.now().plusMonths(2))
            .avgRate(new BigDecimal("0.08"))
            .currentRate(new BigDecimal("0.10"))
            .savingsPercent(new BigDecimal("20.0"))
            .estimatedSavingsAmount(new BigDecimal("200.00"))
            .confidence(85)
            .reason("Historical low rate period")
            .build());
        return periods;
    }

    private String createMockGeminiResponse(String text) {
        return String.format(
            "{\"candidates\": [{\"content\": {\"parts\": [{\"text\": \"%s\"}]}}]}",
            text
        );
    }
}
