package com.verbosegarbonzo.tariff.filter;

import com.verbosegarbonzo.tariff.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;

    public JwtAuthFilter(UserDetailsService userDetailsService, JwtService jwtService) {
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        System.out.println("🔍 JWT Filter Debug - Processing request: " + request.getRequestURI());
        System.out.println("🔍 JWT Filter Debug - Request timestamp: " + java.time.LocalDateTime.now());
        System.out.println("🔍 JWT Filter Debug - Thread ID: " + Thread.currentThread().getId());
        System.out.println("🔍 JWT Filter Debug - Auth header present: " + (authHeader != null));
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            System.out.println("🔍 JWT Filter Debug - Full token received: " + token);
            System.out.println("🔍 JWT Filter Debug - Token hash: " + token.hashCode());
            
            try {
                username = jwtService.extractUsername(token);
                System.out.println("🔍 JWT Filter Debug - Username extracted: " + username);
            } catch (Exception e) {
                System.err.println("❌ JWT Filter Debug - Failed to extract username: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("🔍 JWT Filter Debug - No valid Authorization header found");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println("🔍 JWT Filter Debug - Attempting to authenticate user: " + username);
            System.out.println("🔍 JWT Filter Debug - Current SecurityContext: " + SecurityContextHolder.getContext().getAuthentication());
            
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                System.out.println("🔍 JWT Filter Debug - User details loaded successfully: " + userDetails.getUsername());
                
                boolean isTokenValid = jwtService.validateToken(token, userDetails);
                System.out.println("🔍 JWT Filter Debug - Token validation result: " + isTokenValid);
                
                if (isTokenValid) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("✅ JWT Filter Debug - Authentication successful for user: " + username);
                    System.out.println("✅ JWT Filter Debug - SecurityContext set: " + SecurityContextHolder.getContext().getAuthentication().getName());
                } else {
                    System.err.println("❌ JWT Filter Debug - Token validation failed for user: " + username);
                    // Clear any existing authentication
                    SecurityContextHolder.clearContext();
                }
            } catch (Exception e) {
                System.err.println("❌ JWT Filter Debug - Authentication error: " + e.getMessage());
                e.printStackTrace();
                SecurityContextHolder.clearContext();
            }
        } else if (username == null) {
            System.out.println("🔍 JWT Filter Debug - No username extracted from token");
        } else {
            System.out.println("🔍 JWT Filter Debug - User already authenticated: " + SecurityContextHolder.getContext().getAuthentication().getName());
        }
        
        System.out.println("🔍 JWT Filter Debug - Final SecurityContext before controller: " + 
                          (SecurityContextHolder.getContext().getAuthentication() != null ? 
                           SecurityContextHolder.getContext().getAuthentication().getName() : "null"));
        
        filterChain.doFilter(request, response);
        
        System.out.println("🔍 JWT Filter Debug - Request completed for: " + request.getRequestURI());
    }
}
