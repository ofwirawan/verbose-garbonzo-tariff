package com.verbosegarbonzo.tariff.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setup() {
        jwtService = new JwtService();
        // Generate a random HS256 key and set as base64 secret
        javax.crypto.SecretKey key = io.jsonwebtoken.security.Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
        String base64 = Base64.getEncoder().encodeToString(key.getEncoded());
        ReflectionTestUtils.setField(jwtService, "jwtsecret", base64);
        ReflectionTestUtils.invokeMethod(jwtService, "init");
    }

    @Test
    void token_roundtrip_extractsUsername_andValidates() {
        String token = jwtService.token("user@example.com");
        assertNotNull(token);
        assertEquals("user@example.com", jwtService.extractUsername(token));

        org.springframework.security.core.userdetails.UserDetails details =
                org.springframework.security.core.userdetails.User.withUsername("user@example.com").password("x").roles("USER").build();

        assertTrue(jwtService.validateToken(token, details));
    }
}


