package com.verbosegarbonzo.tariff.service;

import java.util.Base64;
import java.util.Date;

import javax.crypto.SecretKey;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

class JwtServiceTest {

    private JwtService jwtService;
    private String validSecret;

    @BeforeEach
    void setup() {
        jwtService = new JwtService();
        // Generate a random HS256 key and set as base64 secret
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        validSecret = Base64.getEncoder().encodeToString(key.getEncoded());
        ReflectionTestUtils.setField(jwtService, "jwtsecret", validSecret);
        ReflectionTestUtils.invokeMethod(jwtService, "init");
    }

    @Test
    void token_roundtrip_extractsUsername_andValidates() {
        // Given
        String email = "user@example.com";

        // When
        String token = jwtService.token(email);

        // Then
        assertNotNull(token);
        assertEquals(email, jwtService.extractUsername(token));

        UserDetails details = User.withUsername(email)
                .password("x")
                .roles("USER")
                .build();

        assertTrue(jwtService.validateToken(token, details));
    }

    @Test
    void token_generatesValidJwt() {
        // Given
        String email = "test@example.com";

        // When
        String token = jwtService.token(email);

        // Then
        assertThat(token).isNotNull();
        assertThat(token).contains("."); // JWT has 3 parts separated by dots
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void extractUsername_withValidToken_returnsCorrectUsername() {
        // Given
        String email = "admin@example.com";
        String token = jwtService.token(email);

        // When
        String extractedUsername = jwtService.extractUsername(token);

        // Then
        assertThat(extractedUsername).isEqualTo(email);
    }

    @Test
    void extractUsername_withDifferentEmails_returnsCorrectUsernames() {
        // Given
        String email1 = "user1@example.com";
        String email2 = "user2@example.com";

        // When
        String token1 = jwtService.token(email1);
        String token2 = jwtService.token(email2);

        // Then
        assertThat(jwtService.extractUsername(token1)).isEqualTo(email1);
        assertThat(jwtService.extractUsername(token2)).isEqualTo(email2);
        assertThat(token1).isNotEqualTo(token2);
    }

    @Test
    void extractExpiration_withValidToken_returnsExpirationDate() {
        // Given
        String email = "user@example.com";
        String token = jwtService.token(email);

        // When
        Date expiration = jwtService.extractExpiration(token);

        // Then
        assertThat(expiration).isNotNull();
        assertThat(expiration).isAfter(new Date());

        // Token should expire in approximately 30 minutes (within 31 minutes to account
        // for test execution time)
        long expirationTime = expiration.getTime() - System.currentTimeMillis();
        assertThat(expirationTime).isLessThanOrEqualTo(31 * 60 * 1000); // 31 minutes in milliseconds
        assertThat(expirationTime).isGreaterThan(29 * 60 * 1000); // At least 29 minutes
    }

    @Test
    void validateToken_withValidTokenAndMatchingUser_returnsTrue() {
        // Given
        String email = "user@example.com";
        String token = jwtService.token(email);
        UserDetails userDetails = User.withUsername(email)
                .password("password")
                .roles("USER")
                .build();

        // When
        Boolean isValid = jwtService.validateToken(token, userDetails);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    void validateToken_withValidTokenAndNonMatchingUser_returnsFalse() {
        // Given
        String email = "user@example.com";
        String token = jwtService.token(email);
        UserDetails userDetails = User.withUsername("different@example.com")
                .password("password")
                .roles("USER")
                .build();

        // When
        Boolean isValid = jwtService.validateToken(token, userDetails);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_withExpiredToken_returnsFalse() {
        // Given
        String email = "user@example.com";

        // Create an already expired token
        String expiredToken = Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis() - 2000))
                .setExpiration(new Date(System.currentTimeMillis() - 1000)) // Expired 1 second ago
                .signWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(validSecret)), SignatureAlgorithm.HS256)
                .compact();

        UserDetails userDetails = User.withUsername(email)
                .password("password")
                .roles("USER")
                .build();

        // When & Then
        assertThatThrownBy(() -> {
            jwtService.validateToken(expiredToken, userDetails);
        }).isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void extractUsername_withInvalidToken_throwsException() {
        // Given
        String invalidToken = "invalid.token.here";

        // When & Then
        assertThatThrownBy(() -> {
            jwtService.extractUsername(invalidToken);
        }).isInstanceOf(MalformedJwtException.class);
    }

    @Test
    void extractUsername_withTokenSignedByDifferentKey_throwsSignatureException() {
        // Given
        SecretKey differentKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        String tokenWithDifferentKey = Jwts.builder()
                .setSubject("user@example.com")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 30))
                .signWith(differentKey, SignatureAlgorithm.HS256)
                .compact();

        // When & Then
        assertThatThrownBy(() -> {
            jwtService.extractUsername(tokenWithDifferentKey);
        }).isInstanceOf(SignatureException.class);
    }

    @Test
    void token_withSpecialCharactersInEmail_generatesValidToken() {
        // Given
        String email = "user+test@example.com";

        // When
        String token = jwtService.token(email);

        // Then
        assertThat(token).isNotNull();
        assertThat(jwtService.extractUsername(token)).isEqualTo(email);
    }

    @Test
    void token_withLongEmail_generatesValidToken() {
        // Given
        String email = "verylongemailaddressthatcontainsmanycharsacters@verylongdomainname.com";

        // When
        String token = jwtService.token(email);

        // Then
        assertThat(token).isNotNull();
        assertThat(jwtService.extractUsername(token)).isEqualTo(email);
    }

    @Test
    void extractClaim_withCustomClaimExtractor_extractsCorrectValue() {
        // Given
        String email = "user@example.com";
        String token = jwtService.token(email);

        // When
        String subject = jwtService.extractClaim(token, Claims::getSubject);
        Date issuedAt = jwtService.extractClaim(token, Claims::getIssuedAt);

        // Then
        assertThat(subject).isEqualTo(email);
        assertThat(issuedAt).isNotNull();
        assertThat(issuedAt).isBeforeOrEqualTo(new Date());
    }

    @Test
    void token_generatedAtDifferentTimes_haveDifferentIssuedAt() throws InterruptedException {
        // Given
        String email = "user@example.com";

        // When
        String token1 = jwtService.token(email);
        Thread.sleep(1000); // Small delay to ensure different timestamps
        String token2 = jwtService.token(email);

        // Then
        Date issuedAt1 = jwtService.extractClaim(token1, Claims::getIssuedAt);
        Date issuedAt2 = jwtService.extractClaim(token2, Claims::getIssuedAt);

        assertThat(token1).isNotEqualTo(token2);
        assertThat(issuedAt2).isAfter(issuedAt1);
    }

    @Test
    void validateToken_withInvalidUsername_returnsFalse() {
        // Given
        String email = "user@example.com";
        String token = jwtService.token(email);
        UserDetails userDetails = User.withUsername("invalid")
                .password("password")
                .roles("USER")
                .build();

        // When
        Boolean isValid = jwtService.validateToken(token, userDetails);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    void token_withEmptyEmail_generatesTokenWithEmptySubject() {
        // Given
        String email = "";

        // When
        String token = jwtService.token(email);

        // Then
        assertThat(token).isNotNull();
        assertThat(jwtService.extractUsername(token)).isEqualTo(email);
    }

    @Test
    void extractExpiration_ensuresTokenExpiresIn30Minutes() {
        // Given
        String email = "user@example.com";

        // When
        String token = jwtService.token(email);
        Date issuedAt = jwtService.extractClaim(token, Claims::getIssuedAt);
        Date expiration = jwtService.extractExpiration(token);

        assertThat(expiration.getTime()).isEqualTo(issuedAt.getTime() + (30 * 60 * 1000));
    }

    @Test
    void validateToken_withMultipleRoles_validatesSuccessfully() {
        // Given
        String email = "admin@example.com";
        String token = jwtService.token(email);
        UserDetails userDetails = User.withUsername(email)
                .password("password")
                .roles("USER", "ADMIN")
                .build();

        // When
        Boolean isValid = jwtService.validateToken(token, userDetails);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    void extractUsername_withMalformedToken_throwsException() {
        // Given
        String malformedToken = "eyJhbGciOiJIUzI1NiJ9.malformed.signature";

        // When & Then
        assertThatThrownBy(() -> {
            jwtService.extractUsername(malformedToken);
        }).isInstanceOf(SignatureException.class);
    }
}
