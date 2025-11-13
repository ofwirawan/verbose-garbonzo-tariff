package com.verbosegarbonzo.tariff.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void handleValidationException_withFieldError_returnsBadRequest() {
        // Given
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "fieldName", "must not be blank");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleValidationException(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("BAD_REQUEST");
        assertThat(response.getBody().message()).isEqualTo("fieldName: must not be blank");
    }

    @Test
    void handleValidationException_withMultipleErrors_returnsFirstError() {
        // Given
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError error1 = new FieldError("object", "field1", "error1");
        FieldError error2 = new FieldError("object", "field2", "error2");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(error1, error2));

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleValidationException(ex);

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("field1: error1");
    }

    @Test
    void handleValidationException_withNoErrors_returnsDefaultMessage() {
        // Given
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of());

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleValidationException(ex);

        // Then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Invalid request");
    }

    @Test
    void handleResponseStatusException_withConflict_returnsConflictError() {
        // Given
        ResponseStatusException ex = new ResponseStatusException(
            HttpStatus.CONFLICT, "Resource already exists");

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleResponseStatusException(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("CONFLICT_ERROR");
        assertThat(response.getBody().message()).isEqualTo("Resource already exists");
    }

    @Test
    void handleResponseStatusException_withNotFound_returnsNotFoundError() {
        // Given
        ResponseStatusException ex = new ResponseStatusException(
            HttpStatus.NOT_FOUND, "Resource not found");

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleResponseStatusException(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("NOT_FOUND_ERROR");
        assertThat(response.getBody().message()).isEqualTo("Resource not found");
    }

    @Test
    void handleResponseStatusException_withOtherStatus_returnsRequestError() {
        // Given
        ResponseStatusException ex = new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Bad request");

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleResponseStatusException(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("REQUEST_ERROR");
    }

    @Test
    void handleDataIntegrityViolation_returnsConflict() {
        // Given
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
            "Integrity constraint violation");

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleDataIntegrityViolation(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("DATA_INTEGRITY_ERROR");
        assertThat(response.getBody().message())
            .isEqualTo("Country cannot be deleted because it is referenced by other records.");
    }

    @Test
    void handleAuthentication_withAuthenticationException_returnsUnauthorized() {
        // Given
        AuthenticationException ex = new BadCredentialsException("Invalid credentials");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleAuthentication(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.get("status")).isEqualTo(401);
        assertThat(body.get("error")).isEqualTo("Authentication Failed");
        assertThat(body.get("message")).isEqualTo("Invalid username or password");
        assertThat(body.get("timestamp")).isInstanceOf(LocalDateTime.class);
    }

    @Test
    void handleAuthentication_withBadCredentials_returnsUnauthorized() {
        // Given
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleAuthentication(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.get("error")).isEqualTo("Authentication Failed");
    }

    @Test
    void handleAccessDenied_returnsUnauthorized() {
        // Given
        AccessDeniedException ex = new AccessDeniedException("Access denied");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleAccessDenied(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body.get("status")).isEqualTo(403);
        assertThat(body.get("error")).isEqualTo("Access Denied");
        assertThat(body.get("message"))
            .isEqualTo("You don't have permission to access this resource");
        assertThat(body.get("timestamp")).isInstanceOf(LocalDateTime.class);
    }

    @Test
    void handleNotFound_withRateNotFoundException_returnsNotFound() {
        // Given
        RateNotFoundException ex = new RateNotFoundException("No tariff rate found");

        // When
        ResponseEntity<?> response = exceptionHandler.handleNotFound(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(GlobalExceptionHandler.ErrorPayload.class);

        GlobalExceptionHandler.ErrorPayload payload =
            (GlobalExceptionHandler.ErrorPayload) response.getBody();
        assertThat(payload.error()).isEqualTo("RATE_NOT_FOUND");
        assertThat(payload.message()).isEqualTo("No tariff rate found");
    }

    @Test
    void handleInvalidRequest_withInvalidRequestException_returnsBadRequest() {
        // Given
        InvalidRequestException ex = new InvalidRequestException("Invalid parameters");

        // When
        ResponseEntity<?> response = exceptionHandler.handleInvalidRequest(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(GlobalExceptionHandler.ErrorPayload.class);

        GlobalExceptionHandler.ErrorPayload payload =
            (GlobalExceptionHandler.ErrorPayload) response.getBody();
        assertThat(payload.error()).isEqualTo("INVALID_REQUEST");
        assertThat(payload.message()).isEqualTo("Invalid parameters");
    }

    @Test
    void errorPayload_recordBehavior_worksCorrectly() {
        // Given
        GlobalExceptionHandler.ErrorPayload payload1 =
            new GlobalExceptionHandler.ErrorPayload("ERROR_TYPE", "Error message");
        GlobalExceptionHandler.ErrorPayload payload2 =
            new GlobalExceptionHandler.ErrorPayload("ERROR_TYPE", "Error message");
        GlobalExceptionHandler.ErrorPayload payload3 =
            new GlobalExceptionHandler.ErrorPayload("OTHER_TYPE", "Error message");

        // Then - Test record equality
        assertThat(payload1).isEqualTo(payload2);
        assertThat(payload1).isNotEqualTo(payload3);
        assertThat(payload1.hashCode()).isEqualTo(payload2.hashCode());

        // Test accessors
        assertThat(payload1.error()).isEqualTo("ERROR_TYPE");
        assertThat(payload1.message()).isEqualTo("Error message");
    }

    @Test
    void handleValidationException_withNullMessage_handlesGracefully() {
        // Given
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "field", null);

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleValidationException(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("field: null");
    }

    @Test
    void handleResponseStatusException_withNullReason_handlesGracefully() {
        // Given
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, null);

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorPayload> response =
            exceptionHandler.handleResponseStatusException(ex);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isNull();
    }

    @Test
    void handleAuthentication_timestampIsRecent() throws InterruptedException {
        // Given
        LocalDateTime before = LocalDateTime.now();
        Thread.sleep(10);
        AuthenticationException ex = new BadCredentialsException("Bad credentials");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleAuthentication(ex);

        // Then
        Thread.sleep(10);
        LocalDateTime after = LocalDateTime.now();

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        LocalDateTime timestamp = (LocalDateTime) body.get("timestamp");

        assertThat(timestamp).isAfter(before);
        assertThat(timestamp).isBefore(after);
    }

    @Test
    void handleAccessDenied_timestampIsRecent() throws InterruptedException {
        // Given
        LocalDateTime before = LocalDateTime.now();
        Thread.sleep(10);
        AccessDeniedException ex = new AccessDeniedException("Access denied");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleAccessDenied(ex);

        // Then
        Thread.sleep(10);
        LocalDateTime after = LocalDateTime.now();

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        LocalDateTime timestamp = (LocalDateTime) body.get("timestamp");

        assertThat(timestamp).isAfter(before);
        assertThat(timestamp).isBefore(after);
    }

    @Test
    void handleRateNotFoundException_withDifferentMessages_returnsCorrectMessage() {
        // Test multiple different messages
        String[] messages = {
            "Rate not found for HS6 code 123456",
            "No rate available",
            "Rate data missing"
        };

        for (String message : messages) {
            RateNotFoundException ex = new RateNotFoundException(message);
            ResponseEntity<?> response = exceptionHandler.handleNotFound(ex);

            GlobalExceptionHandler.ErrorPayload payload =
                (GlobalExceptionHandler.ErrorPayload) response.getBody();
            assertThat(payload.message()).isEqualTo(message);
        }
    }

    @Test
    void handleInvalidRequestException_withDifferentMessages_returnsCorrectMessage() {
        // Test multiple different messages
        String[] messages = {
            "Missing required parameter",
            "Invalid date format",
            "Parameter out of range"
        };

        for (String message : messages) {
            InvalidRequestException ex = new InvalidRequestException(message);
            ResponseEntity<?> response = exceptionHandler.handleInvalidRequest(ex);

            GlobalExceptionHandler.ErrorPayload payload =
                (GlobalExceptionHandler.ErrorPayload) response.getBody();
            assertThat(payload.message()).isEqualTo(message);
        }
    }
}
