package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.dto.UserProfileDTO;
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
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserInfoRepository userInfoRepository;

    private final UserInfoService service;

    private final JwtService jwtService;

    private final AuthenticationManager authenticationManager;



    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> profile(@AuthenticationPrincipal org.springframework.security.core.userdetails.User principal){
        String email = principal.getUsername();

        UserInfo user = userInfoRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        UserProfileDTO profileDTO = new UserProfileDTO(
            user.getUid(),
            user.getName(),
            user.getEmail(),
            user.getRoles(),
            user.getProfileType() != null ? user.getProfileType().name() : null
        );

        return ResponseEntity.ok(profileDTO);
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
    public ResponseEntity<?> authenticateAndGetToken(@RequestBody AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword()));
        if (authentication.isAuthenticated()) {
            String accessToken = jwtService.token(authRequest.getUsername());
            String refreshToken = jwtService.createRefreshToken(authRequest.getUsername());

            Map<String, String> response = new HashMap<>();
            response.put("accessToken", accessToken);
            response.put("refreshToken", refreshToken);

            return ResponseEntity.ok(response);
        } else {
            throw new UsernameNotFoundException("Invalid user request!");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(new ErrorPayload("UNAUTHORIZED", "Missing or invalid refresh token"));
        }

        String refreshToken = authHeader.substring(7);
        String newAccessToken = jwtService.refreshAccessToken(refreshToken);

        if (newAccessToken != null) {
            Map<String, String> response = new HashMap<>();
            response.put("accessToken", newAccessToken);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(new ErrorPayload("UNAUTHORIZED", "Invalid or expired refresh token"));
        }
    }

    @PutMapping("/profile/update-name")
    public ResponseEntity<UserProfileDTO> updateProfileName(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
            @RequestBody java.util.Map<String, String> request) {
        String email = principal.getUsername();
        String newName = request.get("name");

        if (newName == null || newName.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        UserInfo user = userInfoRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        user.setName(newName.trim());
        userInfoRepository.save(user);

        UserProfileDTO profileDTO = new UserProfileDTO(
            user.getUid(),
            user.getName(),
            user.getEmail(),
            user.getRoles(),
            user.getProfileType() != null ? user.getProfileType().name() : null
        );

        return ResponseEntity.ok(profileDTO);
    }

    @PutMapping("/profile/update-type")
    public ResponseEntity<UserProfileDTO> updateProfileType(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
            @RequestBody java.util.Map<String, Object> request) {
        String email = principal.getUsername();
        Object profileTypeObj = request.get("profileType");
        String profileTypeStr = profileTypeObj != null ? profileTypeObj.toString() : null;

        System.out.println("[UpdateProfileType] Email: " + email);
        System.out.println("[UpdateProfileType] Received profileType: " + profileTypeStr);

        UserInfo user = userInfoRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        if (profileTypeStr != null && !profileTypeStr.isEmpty() && !profileTypeStr.equals("null")) {
            try {
                com.verbosegarbonzo.tariff.model.ProfileType profileType =
                    com.verbosegarbonzo.tariff.model.ProfileType.valueOf(profileTypeStr.toUpperCase());
                user.setProfileType(profileType);
                System.out.println("[UpdateProfileType] Set profile type to: " + profileType);
            } catch (IllegalArgumentException e) {
                System.out.println("[UpdateProfileType] Invalid profile type: " + profileTypeStr);
                e.printStackTrace();
                return ResponseEntity.badRequest().build();
            }
        } else {
            user.setProfileType(null);
            System.out.println("[UpdateProfileType] Profile type set to null");
        }

        UserInfo savedUser = userInfoRepository.save(user);
        System.out.println("[UpdateProfileType] Saved user profile type: " + savedUser.getProfileType());

        UserProfileDTO profileDTO = new UserProfileDTO(
            savedUser.getUid(),
            savedUser.getName(),
            savedUser.getEmail(),
            savedUser.getRoles(),
            savedUser.getProfileType() != null ? savedUser.getProfileType().name() : null
        );

        System.out.println("[UpdateProfileType] Returning DTO with profile type: " + profileDTO.getProfileType());
        return ResponseEntity.ok(profileDTO);
    }
}