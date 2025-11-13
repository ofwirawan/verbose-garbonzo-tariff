package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.exception.GlobalExceptionHandler.ErrorPayload;
import com.verbosegarbonzo.tariff.model.AuthRequest;
import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;
import com.verbosegarbonzo.tariff.service.JwtService;
import com.verbosegarbonzo.tariff.service.UserInfoService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserInfoRepository userInfoRepository;

    private final UserInfoService service;

    private final JwtService jwtService;

    private final AuthenticationManager authenticationManager;



    @GetMapping("/profile")
    public String profile(@AuthenticationPrincipal org.springframework.security.core.userdetails.User principal){
        return principal.getUsername();
    }

    @PostMapping("/register")
    public String register(@RequestBody UserInfo userInfo) {
        if(userInfoRepository.findByEmail(userInfo.getEmail()).orElse(null) != null) {
             return ResponseEntity.badRequest().body(new ErrorPayload("BAD_REQUEST", "Duplicate email")).toString();
        }

        return service.addUser(userInfo);
    }

    // Removed the role checks here as they are already managed in SecurityConfig

    @PostMapping("/token")
    public String authenticateAndGetToken(@RequestBody AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword()));
        if (authentication.isAuthenticated()) {
            return jwtService.token(authRequest.getUsername());
        } else {
            throw new UsernameNotFoundException("Invalid user request!");
        }
    }
}