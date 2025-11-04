package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataIntegrityViolationException;

@RestController
@RequestMapping("/api/admin/countries")
public class AdminCountryController {

    private final CountryRepository countryRepository;

    public AdminCountryController(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    // Create a new country
    @PostMapping
    public ResponseEntity<Country> createCountry(@Valid @RequestBody Country country) {
        boolean exists = countryRepository.findAll().stream()
                .anyMatch(c -> c.getNumericCode().equals(country.getNumericCode()));
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A country with numeric code '" + country.getNumericCode() + "' already exists.");
        }
        Country created = countryRepository.save(country);
        return ResponseEntity.status(201).body(created);
    }

    // Get all countries with optional search
    @GetMapping
    public Page<Country> getAllCountries(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        if (search != null && !search.isEmpty()) {
            return countryRepository.findByNameContainingIgnoreCaseOrCountryCodeContainingIgnoreCaseOrNumericCodeContaining(
                    search, search, search, pageable);
        }
        return countryRepository.findAll(pageable);
    }

    // Get country by countryCode
    @GetMapping("/{countryCode}")
    public ResponseEntity<Country> getCountryById(@PathVariable String countryCode) {
        return countryRepository.findById(countryCode)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Country not found"));
    }

    // Update country by countryCode
    @PutMapping("/{countryCode}")
    public ResponseEntity<Country> updateCountry(@PathVariable String countryCode,
            @Valid @RequestBody Country updatedCountry) {
        Country existingCountry = countryRepository.findById(countryCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Country not found"));

        boolean exists = countryRepository.findAll().stream()
                .anyMatch(c -> c.getNumericCode().equals(updatedCountry.getNumericCode())
                        && !c.getCountryCode().equals(countryCode));
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A country with numeric code '" + updatedCountry.getNumericCode() + "' already exists.");
        }
        existingCountry.setNumericCode(updatedCountry.getNumericCode());
        existingCountry.setName(updatedCountry.getName());
        Country saved = countryRepository.save(existingCountry);
        return ResponseEntity.ok(saved);
    }

    // Delete country by countryCode
    @DeleteMapping("/{countryCode}")
    public ResponseEntity<Void> deleteCountry(@PathVariable String countryCode) {
        if (!countryRepository.existsById(countryCode)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Country not found");
        }
        countryRepository.deleteById(countryCode);
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

    record ErrorPayload(String error, String message) {
    }
}
