package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.dto.SuspensionDTO;
import com.verbosegarbonzo.tariff.model.Suspension;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.SuspensionRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.exception.InvalidRequestException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin/suspensions")
public class AdminSuspensionController {

    private final SuspensionRepository suspensionRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;

    public AdminSuspensionController(SuspensionRepository suspensionRepository,
            CountryRepository countryRepository,
            ProductRepository productRepository) {
        this.suspensionRepository = suspensionRepository;
        this.countryRepository = countryRepository;
        this.productRepository = productRepository;
    }

    // Helper: entity to DTO
    private SuspensionDTO toDTO(Suspension suspension) {
        return new SuspensionDTO(
                suspension.getSuspensionId(),
                suspension.getImporter().getCountryCode(),
                suspension.getProduct().getHs6Code(),
                suspension.getValidFrom(),
                suspension.getValidTo(),
                suspension.isSuspensionFlag(),
                suspension.getSuspensionNote(),
                suspension.getSuspensionRate());
    }

    // Helper: DTO to entity
    private Suspension toEntity(SuspensionDTO dto) {
        if (dto.getImporterCode() == null || dto.getProductCode() == null) {
            throw new InvalidRequestException("Importer code and product code must not be null.");
        }
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new InvalidRequestException("Importer country not found: " + dto.getImporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + dto.getProductCode()));
        Suspension suspension = new Suspension();
        suspension.setImporter(importer);
        suspension.setProduct(product);
        suspension.setValidFrom(dto.getValidFrom());
        suspension.setValidTo(dto.getValidTo());
        suspension.setSuspensionFlag(dto.isSuspensionFlag());
        suspension.setSuspensionNote(dto.getSuspensionNote());
        suspension.setSuspensionRate(dto.getSuspensionRate());
        return suspension;
    }

    // Create new Suspension
    @PostMapping
    public ResponseEntity<SuspensionDTO> createSuspension(@Valid @RequestBody SuspensionDTO dto) {
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new InvalidRequestException("Importer country not found: " + dto.getImporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + dto.getProductCode()));
        boolean exists = suspensionRepository
                .findByImporterAndProductAndValidFrom(importer, product, dto.getValidFrom())
                .isPresent();
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A suspension with the same importer, product, and validFrom already exists.");
        }
        Suspension suspension = toEntity(dto);
        Suspension created = suspensionRepository.save(suspension);
        return ResponseEntity.status(201).body(toDTO(created));
    }

    // Get all Suspensions (paginated)
    @GetMapping
    public Page<SuspensionDTO> getAllSuspensions(Pageable pageable) {
        return suspensionRepository.findAll(pageable)
                .map(this::toDTO);
    }

    // Get Suspension by ID
    @GetMapping("/{id}")
    public ResponseEntity<SuspensionDTO> getSuspensionById(@PathVariable Integer id) {
        return suspensionRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new InvalidRequestException("Suspension not found: " + id));
    }

    // Update Suspension by ID
    @PutMapping("/{id}")
    public ResponseEntity<SuspensionDTO> updateSuspension(@PathVariable Integer id,
            @Valid @RequestBody SuspensionDTO dto) {
        Suspension suspension = suspensionRepository.findById(id)
                .orElseThrow(() -> new InvalidRequestException("Suspension not found: " + id));
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new InvalidRequestException("Importer country not found: " + dto.getImporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + dto.getProductCode()));

        boolean exists = suspensionRepository
                .findByImporterAndProductAndValidFrom(importer, product, dto.getValidFrom())
                .filter(s -> !s.getSuspensionId().equals(id))
                .isPresent();
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A suspension with the same importer, product, and validFrom already exists.");
        }

        suspension.setImporter(importer);
        suspension.setProduct(product);
        suspension.setValidFrom(dto.getValidFrom());
        suspension.setValidTo(dto.getValidTo());
        suspension.setSuspensionFlag(dto.isSuspensionFlag());
        suspension.setSuspensionNote(dto.getSuspensionNote());
        suspension.setSuspensionRate(dto.getSuspensionRate());
        Suspension saved = suspensionRepository.save(suspension);
        return ResponseEntity.ok(toDTO(saved));
    }

    // Delete Suspension by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSuspensionById(@PathVariable Integer id) {
        if (!suspensionRepository.existsById(id)) {
            throw new InvalidRequestException("Suspension not found: " + id);
        }
        suspensionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Search Suspension by importer, product, and validFrom date
    @GetMapping("/search")
    public ResponseEntity<SuspensionDTO> searchSuspension(
            @RequestParam String importerCode,
            @RequestParam String productCode,
            @RequestParam java.time.LocalDate validFrom) {
        Country importer = countryRepository.findById(importerCode)
                .orElseThrow(() -> new InvalidRequestException("Importer country not found: " + importerCode));
        Product product = productRepository.findById(productCode)
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + productCode));
        return suspensionRepository.findByImporterAndProductAndValidFrom(importer, product, validFrom)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new InvalidRequestException("Suspension not found for given parameters"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("Invalid request");
        return ResponseEntity.badRequest().body(errorMsg);
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<String> handleInvalidRequest(InvalidRequestException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
