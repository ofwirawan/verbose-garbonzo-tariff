package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.dto.MeasureDTO;
import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.exception.InvalidRequestException;
import com.verbosegarbonzo.tariff.exception.AlreadyExistsException;
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
        if (dto.getImporterCode() == null || dto.getProductCode() == null) {
            throw new InvalidRequestException("Importer code and product code must not be null.");
        }
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new InvalidRequestException("Importer country not found: " + dto.getImporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + dto.getProductCode()));
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
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Importer country not found: " + dto.getImporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Product not found: " + dto.getProductCode()));
        boolean exists = measureRepository.findByImporterAndProductAndValidFrom(importer, product, dto.getValidFrom())
                .isPresent();
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A measure with the same importer, product, and validFrom already exists.");
        }
        Measure measure = toEntity(dto);
        Measure created = measureRepository.save(measure);
        return ResponseEntity.status(201).body(toDTO(created));
    }

    // Get all Measures with pagination
    @GetMapping
    public Page<MeasureDTO> getAllMeasures(Pageable pageable) {
        return measureRepository.findAll(pageable)
                .map(this::toDTO);
    }

    // Get a Measure by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getMeasureById(@PathVariable Integer id) {
        return measureRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Measure not found: " + id));
    }

    // Update Measure by ID
    @PutMapping("/{id}")
    public ResponseEntity<MeasureDTO> updateMeasure(@PathVariable Integer id, @Valid @RequestBody MeasureDTO dto) {
        Optional<Measure> optionalMeasure = measureRepository.findById(id);
        if (optionalMeasure.isPresent()) {
            Measure measure = optionalMeasure.get();
            Country importer = countryRepository.findById(dto.getImporterCode())
                    .orElseThrow(
                            () -> new InvalidRequestException("Importer country not found: " + dto.getImporterCode()));
            Product product = productRepository.findById(dto.getProductCode())
                    .orElseThrow(() -> new InvalidRequestException("Product not found: " + dto.getProductCode()));

            // Duplicate check for update
            boolean exists = measureRepository
                    .findByImporterAndProductAndValidFrom(importer, product, dto.getValidFrom())
                    .filter(m -> !m.getMeasureId().equals(id))
                    .isPresent();
            if (exists) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A measure with the same importer, product, and validFrom already exists.");
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
        throw new InvalidRequestException("Measure not found: " + id);
    }

    // Delete Measure by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMeasureById(@PathVariable Integer id) {
        if (measureRepository.existsById(id)) {
            measureRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        throw new InvalidRequestException("Measure not found: " + id);
    }

    // Get Measure by importerCode, productCode, and validFrom
    @GetMapping("/search")
    public ResponseEntity<Measure> searchMeasure(
            @RequestParam String importerCode,
            @RequestParam String productCode,
            @RequestParam LocalDate validFrom) {
        Country importer = countryRepository.findById(importerCode)
                .orElseThrow(() -> new InvalidRequestException("Importer country not found: " + importerCode));
        Product product = productRepository.findById(productCode)
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + productCode));
        return measureRepository.findByImporterAndProductAndValidFrom(importer, product, validFrom)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new InvalidRequestException("Measure not found for given parameters"));
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
