package com.verbosegarbonzo.tariff.exception;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    public record ErrorPayload(String error, String message) {

    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorPayload> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Invalid request");
        return ResponseEntity.badRequest().body(new ErrorPayload("BAD_REQUEST", errorMsg));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorPayload> handleResponseStatusException(ResponseStatusException ex) {
        String errorType = ex.getStatusCode() == HttpStatus.CONFLICT ? "CONFLICT_ERROR"
                : ex.getStatusCode() == HttpStatus.NOT_FOUND ? "NOT_FOUND_ERROR"
                        : "REQUEST_ERROR";
        return ResponseEntity.status(ex.getStatusCode())
                .body(new ErrorPayload(errorType, ex.getReason()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorPayload> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorPayload("DATA_INTEGRITY_ERROR",
                        "Country cannot be deleted because it is referenced by other records."));
    }

    @ExceptionHandler({ AuthenticationException.class, BadCredentialsException.class })
    public ResponseEntity<Object> handleAuthentication(AuthenticationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("error", "Authentication Failed");
        body.put("message", "Invalid username or password");

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "Access Denied");
        body.put("message", "You don't have permission to access this resource");

        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(RateNotFoundException.class)
    public ResponseEntity<?> handleNotFound(RateNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorPayload("RATE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<?> handleInvalidRequest(InvalidRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorPayload("INVALID_REQUEST", ex.getMessage()));
    }
}
