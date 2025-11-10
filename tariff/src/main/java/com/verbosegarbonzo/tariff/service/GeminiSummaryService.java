package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.model.AIRecommendationResponse;
import com.verbosegarbonzo.tariff.model.ProfileType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Service for generating AI-powered summaries using Google Gemini 2.5 API.
 * Enhances ML-generated recommendations with conversational AI insights.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiSummaryService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent}")
    private String geminiApiUrl;

    /**
     * Generate a Gemini 2.5-powered summary of AI recommendations.
     * Tailors the summary based on user profile type.
     *
     * @param recommendation The ML-generated recommendation
     * @param profileType User's profile type
     * @param importerCode Country code of importer
     * @param hs6Code HS6 product code
     * @return Gemini-generated summary
     */
    public String generateGeminiSummary(
            AIRecommendationResponse recommendation,
            ProfileType profileType,
            String importerCode,
            String hs6Code) {

        if (!isGeminiConfigured()) {
            log.warn("❌ Gemini API key not configured - GEMINI_API_KEY environment variable is missing");
            return "";
        }

        try {
            log.info("========================================");
            log.info("✓ Starting Gemini summary generation");
            log.info("  Profile Type: {}", profileType);
            log.info("  Importer Code: {}", importerCode);
            log.info("  HS6 Code: {}", hs6Code);
            log.info("========================================");
            String prompt = buildPrompt(recommendation, profileType, importerCode, hs6Code);
            log.debug("✓ Built prompt (length: {} chars)", prompt.length());
            log.debug("✓ First 500 chars of prompt:\n{}", prompt.substring(0, Math.min(500, prompt.length())));

            String response = callGeminiAPI(prompt);
            log.info("✓ Successfully generated Gemini summary (length: {} chars)", response.length());
            return response;
        } catch (Exception e) {
            log.error("❌ Error generating Gemini summary: {}", e.getMessage(), e);
            return ""; // Return empty string on error - frontend handles gracefully
        }
    }

    /**
     * Check if Gemini API is properly configured.
     */
    private boolean isGeminiConfigured() {
        boolean configured = geminiApiKey != null && !geminiApiKey.isEmpty() && !geminiApiKey.equals("");
        if (!configured) {
            log.warn("Gemini config check: apiKey=null? {}, isEmpty? {}",
                geminiApiKey == null,
                geminiApiKey != null && geminiApiKey.isEmpty());
        } else {
            log.debug("Gemini config check: ✓ API key is configured (length: {})", geminiApiKey.length());
        }
        return configured;
    }

    /**
     * Build the prompt for Gemini based on user profile and recommendations.
     */
    private String buildPrompt(
            AIRecommendationResponse recommendation,
            ProfileType profileType,
            String importerCode,
            String hs6Code) {

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a trade and tariff expert. ");
        prompt.append("Based on the following tariff analysis, provide a brief, actionable summary.\n\n");

        prompt.append("TARIFF ANALYSIS RESULTS:\n");
        prompt.append("- Product Code (HS6): ").append(hs6Code).append("\n");
        prompt.append("- Importing Country: ").append(importerCode).append("\n");
        prompt.append("- Current Tariff Rate: ").append(String.format("%.2f%%", recommendation.getCurrentRate())).append("\n");
        prompt.append("- Potential Savings: ").append(String.format("%.2f%%", recommendation.getPotentialSavingsPercent())).append("\n");
        prompt.append("- Average Confidence: ").append(recommendation.getAverageConfidence()).append("%\n");
        prompt.append("- ML Analysis: ").append(recommendation.getExplanation()).append("\n");

        if (!recommendation.getOptimalPeriods().isEmpty()) {
            prompt.append("\nOPTIMAL PERIODS:\n");
            recommendation.getOptimalPeriods().forEach(period ->
                prompt.append(String.format("  - %s to %s: %.2f%% savings\n",
                    period.getStartDate(), period.getEndDate(), period.getSavingsPercent()))
            );
        }

        // Tailor request based on profile type
        prompt.append("\n");
        switch (profileType) {
            case BUSINESS_OWNER:
                log.info("📊 Building BUSINESS_OWNER specific prompt");
                prompt.append("RESPONSE FORMAT FOR BUSINESS OWNER:\n");
                prompt.append("You are speaking to a business decision-maker. Structure your response as follows:\n");
                prompt.append("1. **Executive Summary** (1-2 sentences): What should they do?\n");
                prompt.append("2. **Key Opportunities** (2-3 bullet points): Specific ROI opportunities and financial benefits\n");
                prompt.append("3. **Risk Factors** (1-2 bullet points): Key risks to monitor\n");
                prompt.append("4. **Recommended Action** (1 sentence): Clear next steps\n");
                prompt.append("Focus entirely on business value, profitability, and immediate action items. Use concrete numbers and percentages. Keep total response under 150 words.");
                break;
            case POLICY_ANALYST:
                log.info("📋 Building POLICY_ANALYST specific prompt");
                prompt.append("RESPONSE FORMAT FOR POLICY ANALYST:\n");
                prompt.append("You are speaking to a policy professional. Structure your response as follows:\n");
                prompt.append("1. **Market Analysis** (2-3 sentences): How do these tariff patterns affect market structure and competition?\n");
                prompt.append("2. **Policy Implications** (2-3 bullet points): What do these patterns suggest about trade policy effectiveness?\n");
                prompt.append("3. **Trade Agreement Impact** (1-2 sentences): How might relevant trade agreements influence these trends?\n");
                prompt.append("4. **Data Insights** (1-2 sentences): What broader trade pattern insights does this reveal?\n");
                prompt.append("Focus on systemic impacts, policy mechanisms, and trade pattern analysis. Include any policy considerations or precedents. Keep total response under 150 words.");
                break;
            case STUDENT:
                log.info("🎓 Building STUDENT specific prompt");
                prompt.append("RESPONSE FORMAT FOR STUDENT:\n");
                prompt.append("You are teaching a student about tariffs and trade. Structure your response as a learning narrative:\n");
                prompt.append("1. **The Basic Concept** (2-3 sentences): Start with a simple explanation of what's happening in this tariff situation\n");
                prompt.append("2. **Why It Matters** (2-3 sentences): Explain the economic principles and real-world consequences\n");
                prompt.append("3. **Trade-offs** (2-3 sentences): What are the pros and cons of this tariff situation for different parties?\n");
                prompt.append("4. **Key Takeaway** (1-2 sentences): What should they remember about this concept?\n");
                prompt.append("Use simple language, avoid jargon, and explain the 'why' behind every statement. Use analogies if helpful. Keep total response under 150 words.");
                break;
        }

        return prompt.toString();
    }

    /**
     * Call the Gemini 2.5 API with the given prompt.
     */
    private String callGeminiAPI(String prompt) {
        try {
            String url = geminiApiUrl + "?key=" + geminiApiKey;
            log.info("📡 Calling Gemini 2.5 API at: {}", geminiApiUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String requestBody = buildGeminiRequest(prompt);
            log.debug("📨 Request body size: {} bytes", requestBody.length());
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

            log.info("🔄 Sending request to Gemini API...");
            String response = restTemplate.postForObject(url, request, String.class);

            if (response == null) {
                log.error("❌ Gemini API returned null response");
                throw new RuntimeException("Gemini API returned null response");
            }

            log.info("✅ Received response from Gemini 2.5 API (size: {} bytes)", response.length());
            log.debug("📩 Raw response: {}", response.substring(0, Math.min(500, response.length())));

            String extractedText = extractTextFromGeminiResponse(response);
            log.info("✅ Extracted text from response (length: {} chars)", extractedText.length());
            return extractedText;

        } catch (RestClientException e) {
            log.error("❌ REST client error calling Gemini API: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error calling Gemini API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to call Gemini API", e);
        }
    }

    /**
     * Build the request body for Gemini 2.5 API.
     */
    private String buildGeminiRequest(String prompt) throws Exception {
        String requestJson = String.format(
            "{\"contents\": [{\"parts\": [{\"text\": \"%s\"}]}]}",
            escapeJsonString(prompt)
        );
        return requestJson;
    }

    /**
     * Extract text content from Gemini API response.
     */
    private String extractTextFromGeminiResponse(String response) throws Exception {
        try {
            JsonNode root = objectMapper.readTree(response);
            log.debug("📊 Parsed JSON response");

            // Navigate: root.candidates[0].content.parts[0].text
            if (!root.has("candidates")) {
                log.error("❌ No 'candidates' field in response. Available fields: {}", root.fieldNames());
                return "";
            }

            JsonNode candidates = root.get("candidates");
            if (!candidates.isArray() || candidates.size() == 0) {
                log.error("❌ 'candidates' is not an array or is empty");
                return "";
            }

            log.debug("✓ Found {} candidates", candidates.size());
            JsonNode candidate = candidates.get(0);

            if (!candidate.has("content")) {
                log.error("❌ No 'content' in first candidate. Available fields: {}", candidate.fieldNames());
                return "";
            }

            JsonNode content = candidate.get("content");
            if (!content.has("parts")) {
                log.error("❌ No 'parts' in content. Available fields: {}", content.fieldNames());
                return "";
            }

            JsonNode parts = content.get("parts");
            if (!parts.isArray() || parts.size() == 0) {
                log.error("❌ 'parts' is not an array or is empty");
                return "";
            }

            log.debug("✓ Found {} parts", parts.size());
            JsonNode part = parts.get(0);

            if (!part.has("text")) {
                log.error("❌ No 'text' in first part. Available fields: {}", part.fieldNames());
                return "";
            }

            String text = part.get("text").asText();
            log.info("✅ Successfully extracted text from Gemini response");
            log.info("   Response preview (first 300 chars): {}", text.substring(0, Math.min(300, text.length())));

            // Format the response for better readability
            String formattedResponse = formatGeminiResponse(text);
            log.info("   Formatted response length: {} chars", formattedResponse.length());
            return formattedResponse;

        } catch (Exception e) {
            log.error("❌ Error parsing Gemini response: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Escape special characters for JSON string.
     */
    private String escapeJsonString(String input) {
        return input
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }

    /**
     * Format Gemini response for better readability in frontend.
     * Preserves structure while making it more readable.
     */
    private String formatGeminiResponse(String text) {
        // If response is already formatted with newlines, keep it as is
        if (text.contains("\n")) {
            return text;
        }

        // Clean up excessive whitespace
        text = text.replaceAll("\\s+", " ").trim();

        // Try to add line breaks after common sentence endings or markers
        // This helps with readability without breaking the content
        text = text.replaceAll("([.!?])\\s+", "$1\n\n");
        text = text.replaceAll("(:\\s*\\d+\\.)", "$1\n");
        text = text.replaceAll("\\*\\*([^*]+)\\*\\*", "\n**$1**\n");

        return text;
    }
}
