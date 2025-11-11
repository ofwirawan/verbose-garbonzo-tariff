package com.verbosegarbonzo.tariff.filter;

import com.verbosegarbonzo.tariff.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import lombok.extern.slf4j.Slf4j;
import java.io.IOException;

@Component
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;

    public JwtAuthFilter(UserDetailsService userDetailsService, JwtService jwtService) {
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,@NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        log.info("🔍 JWT Filter - Request Path: {}, Auth Header Present: {}", request.getRequestURI(), authHeader != null);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            log.info("🔍 JWT Filter - Token extracted from header (length: {})", token.length());

            try {
                username = jwtService.extractUsername(token);
                log.info("🔍 JWT Filter - Username extracted: {}", username);
            } catch (Exception e) {
                log.error("🔍 JWT Filter - Token extraction failed", e);
            }
        } else if (authHeader != null) {
            log.warn("🔍 JWT Filter - Authorization header present but doesn't start with 'Bearer ': {}", authHeader.substring(0, Math.min(20, authHeader.length())));
        } else {
            log.warn("🔍 JWT Filter - No Authorization header found");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                log.info("🔍 JWT Filter - Loading user details for: {}", username);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                boolean isTokenValid = jwtService.validateToken(token, userDetails);
                log.info("🔍 JWT Filter - Token valid: {}", isTokenValid);

                if (isTokenValid) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("🔍 JWT Filter - Authentication set successfully");
                } else {
                    SecurityContextHolder.clearContext();
                    log.warn("🔍 JWT Filter - Token validation failed");
                }
            } catch (Exception e) {
                log.error("🔍 JWT Filter - Exception during authentication", e);
                SecurityContextHolder.clearContext();
            }
        } else {
            if (username == null) {
                log.warn("🔍 JWT Filter - Username is null");
            }
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                log.info("🔍 JWT Filter - Authentication already set");
            }
        }

        filterChain.doFilter(request, response);

    }
}
