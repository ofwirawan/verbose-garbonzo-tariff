package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.User;
import com.verbosegarbonzo.tariff.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Create new User
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        if (user.getUid() != null && userRepository.existsById(user.getUid())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "A user with ID '" + user.getUid() + "' already exists.");
        }
        User created = userRepository.save(user);
        return ResponseEntity.status(201).body(created);
    }

    // Get all Users (paginated)
    @GetMapping
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    // Get User by ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") UUID id) {
        return userRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
    }

    // Update User by ID
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable("id") UUID id,
            @Valid @RequestBody User updatedUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
        user.setEmail(updatedUser.getEmail());
        user.setPwHash(updatedUser.getPwHash());
        user.setCreatedAt(updatedUser.getCreatedAt());
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    // Delete User by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserById(@PathVariable("id") UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
                    : ex.getStatusCode() == HttpStatus.BAD_REQUEST ? "BAD_REQUEST"
                        : "REQUEST_ERROR";
        return ResponseEntity.status(ex.getStatusCode())
                .body(new ErrorPayload(errorType, ex.getReason()));
    }

    record ErrorPayload(String error, String message) {
    }
}
