package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.dto.MeasureDTO;
import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/measures")
public class AdminMeasureController {

    private final MeasureRepository measureRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;

    public AdminMeasureController(MeasureRepository measureRepository,
            CountryRepository countryRepository,
            ProductRepository productRepository) {
        this.measureRepository = measureRepository;
        this.countryRepository = countryRepository;
        this.productRepository = productRepository;
    }

    private void validateRequiredFields(String importerCode, String productCode, LocalDate validFrom) {
        if (importerCode == null || importerCode.isBlank() ||
                productCode == null || productCode.isBlank() ||
                validFrom == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Importer code, product code, and validFrom must not be null or blank.");
        }
    }

    // Helper to map entity to DTO
    private MeasureDTO toDTO(Measure measure) {
        return new MeasureDTO(
                measure.getMeasureId(),
                measure.getImporter().getCountryCode(),
                measure.getProduct().getHs6Code(),
                measure.getValidFrom(),
                measure.getValidTo(),
                measure.getMfnAdvalRate(),
                measure.getSpecificRatePerKg());
    }

    // Helper to map DTO to entity
    private Measure toEntity(MeasureDTO dto) {
        validateRequiredFields(dto.getImporterCode(), dto.getProductCode(), dto.getValidFrom());
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Importer country not found: " + dto.getImporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Product not found: " + dto.getProductCode()));
        Measure measure = new Measure();
        measure.setImporter(importer);
        measure.setProduct(product);
        measure.setValidFrom(dto.getValidFrom());
        measure.setValidTo(dto.getValidTo());
        measure.setMfnAdvalRate(dto.getMfnAdvalRate());
        measure.setSpecificRatePerKg(dto.getSpecificRatePerKg());
        return measure;
    }

    // Create new Measure
    @PostMapping
    public ResponseEntity<?> createMeasure(@Valid @RequestBody MeasureDTO dto) {
        validateRequiredFields(dto.getImporterCode(), dto.getProductCode(), dto.getValidFrom());
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Importer country not found: " + dto.getImporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Product not found: " + dto.getProductCode()));
        boolean exists = measureRepository
                .findValidRate(importer, product, dto.getValidFrom())
                .isPresent();
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A measure with the same importer, product, and validFrom already exists.");
        }
        Measure measure = toEntity(dto);
        Measure created = measureRepository.save(measure);
        return ResponseEntity.status(201).body(toDTO(created));
    }

    // Get all Measures with pagination and optional search
    @GetMapping
    public Page<MeasureDTO> getAllMeasures(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        if (search != null && !search.isEmpty()) {
            return measureRepository.findByImporterCountryCodeContainingIgnoreCaseOrProductHs6CodeContainingIgnoreCase(
                    search, search, pageable)
                    .map(this::toDTO);
        }
        return measureRepository.findAll(pageable)
                .map(this::toDTO);
    }

    // Get a Measure by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getMeasureById(@PathVariable Integer id) {
        return measureRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Measure not found: " + id));
    }

    // Update Measure by ID
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMeasure(@PathVariable Integer id, @Valid @RequestBody MeasureDTO dto) {
        validateRequiredFields(dto.getImporterCode(), dto.getProductCode(), dto.getValidFrom());
        Optional<Measure> optionalMeasure = measureRepository.findById(id);
        if (optionalMeasure.isPresent()) {
            Measure measure = optionalMeasure.get();
            Country importer = countryRepository.findById(dto.getImporterCode())
                    .orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                    "Importer country not found: " + dto.getImporterCode()));
            Product product = productRepository.findById(dto.getProductCode())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Product not found: " + dto.getProductCode()));

            // Duplicate check for update - only check if key fields have changed
            if (!measure.getImporter().equals(importer) ||
                !measure.getProduct().equals(product) ||
                !measure.getValidFrom().equals(dto.getValidFrom())) {
                boolean exists = measureRepository
                        .findValidRate(importer, product, dto.getValidFrom())
                        .isPresent();
                if (exists) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "A measure with the same importer, product, and validFrom already exists.");
                }
            }

            measure.setImporter(importer);
            measure.setProduct(product);
            measure.setValidFrom(dto.getValidFrom());
            measure.setValidTo(dto.getValidTo());
            measure.setMfnAdvalRate(dto.getMfnAdvalRate());
            measure.setSpecificRatePerKg(dto.getSpecificRatePerKg());
            Measure saved = measureRepository.save(measure);
            return ResponseEntity.ok(toDTO(saved));
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Measure not found: " + id);
    }

    // Delete Measure by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMeasureById(@PathVariable Integer id) {
        if (measureRepository.existsById(id)) {
            measureRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Measure not found: " + id);
    }

    // Get Measure by importerCode, productCode, and validFrom
    @GetMapping("/search")
    public ResponseEntity<?> searchMeasure(
            @RequestParam String importerCode,
            @RequestParam String productCode,
            @RequestParam LocalDate validFrom) {
        validateRequiredFields(importerCode, productCode, validFrom);
        Country importer = countryRepository.findById(importerCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Importer country not found: " + importerCode));
        Product product = productRepository.findById(productCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Product not found: " + productCode));
        return measureRepository.findValidRate(importer, product, validFrom)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Measure not found for given parameters"));
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
