package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.dto.PreferenceDTO;
import com.verbosegarbonzo.tariff.model.Preference;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.PreferenceRepository;
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
@RequestMapping("/api/admin/preferences")
public class AdminPreferenceController {

    private final PreferenceRepository preferenceRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;

    public AdminPreferenceController(PreferenceRepository preferenceRepository,
            CountryRepository countryRepository,
            ProductRepository productRepository) {
        this.preferenceRepository = preferenceRepository;
        this.countryRepository = countryRepository;
        this.productRepository = productRepository;
    }

    // Helper to map entity to DTO
    private PreferenceDTO toDTO(Preference preference) {
        return new PreferenceDTO(
                preference.getPreferenceId(),
                preference.getImporter().getCountryCode(),
                preference.getExporter().getCountryCode(),
                preference.getProduct().getHs6Code(),
                preference.getValidFrom(),
                preference.getValidTo(),
                preference.getPrefAdValRate());
    }

    // Helper to map DTO to entity
    private Preference toEntity(PreferenceDTO dto) {
        if (dto.getImporterCode() == null || dto.getExporterCode() == null || dto.getProductCode() == null) {
            throw new InvalidRequestException("Importer code, exporter code, and product code must not be null.");
        }
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new InvalidRequestException("Importer country not found: " + dto.getImporterCode()));
        Country exporter = countryRepository.findById(dto.getExporterCode())
                .orElseThrow(() -> new InvalidRequestException("Exporter country not found: " + dto.getExporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + dto.getProductCode()));
        Preference preference = new Preference();
        preference.setImporter(importer);
        preference.setExporter(exporter);
        preference.setProduct(product);
        preference.setValidFrom(dto.getValidFrom());
        preference.setValidTo(dto.getValidTo());
        preference.setPrefAdValRate(dto.getPrefAdValRate());
        return preference;
    }

    // Create new Preference
    @PostMapping
    public ResponseEntity<PreferenceDTO> createPreference(@Valid @RequestBody PreferenceDTO dto) {
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Importer country not found: " + dto.getImporterCode()));
        Country exporter = countryRepository.findById(dto.getExporterCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Exporter country not found: " + dto.getExporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Product not found: " + dto.getProductCode()));
        boolean exists = preferenceRepository
                .findByImporterAndExporterAndProductAndValidFrom(importer, exporter, product, dto.getValidFrom())
                .isPresent();
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A preference with the same importer, exporter, product, and validFrom already exists.");
        }
        Preference preference = toEntity(dto);
        Preference created = preferenceRepository.save(preference);
        return ResponseEntity.status(201).body(toDTO(created));
    }

    // Get all Preferences (paginated)
    @GetMapping
    public Page<PreferenceDTO> getAllPreferences(Pageable pageable) {
        return preferenceRepository.findAll(pageable)
                .map(this::toDTO);
    }

    // Get Preference by ID
    @GetMapping("/{id}")
    public ResponseEntity<PreferenceDTO> getPreferenceById(@PathVariable Integer id) {
        return preferenceRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new InvalidRequestException("Preference not found: " + id));
    }

    // Update Preference by ID
    @PutMapping("/{id}")
    public ResponseEntity<PreferenceDTO> updatePreference(@PathVariable Integer id,
            @Valid @RequestBody PreferenceDTO dto) {
        Preference preference = preferenceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Preference not found: " + id));
        Country importer = countryRepository.findById(dto.getImporterCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Importer country not found: " + dto.getImporterCode()));
        Country exporter = countryRepository.findById(dto.getExporterCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Exporter country not found: " + dto.getExporterCode()));
        Product product = productRepository.findById(dto.getProductCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Product not found: " + dto.getProductCode()));

        boolean exists = preferenceRepository
                .findByImporterAndExporterAndProductAndValidFrom(importer, exporter, product, dto.getValidFrom())
                .filter(p -> !p.getPreferenceId().equals(id))
                .isPresent();
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A preference with the same importer, exporter, product, and validFrom already exists.");
        }

        preference.setImporter(importer);
        preference.setExporter(exporter);
        preference.setProduct(product);
        preference.setValidFrom(dto.getValidFrom());
        preference.setValidTo(dto.getValidTo());
        preference.setPrefAdValRate(dto.getPrefAdValRate());
        Preference saved = preferenceRepository.save(preference);
        return ResponseEntity.ok(toDTO(saved));
    }

    // Delete Preference by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePreferenceById(@PathVariable Integer id) {
        if (!preferenceRepository.existsById(id)) {
            throw new InvalidRequestException("Preference not found: " + id);
        }
        preferenceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Search Preference by importer, exporter, product, and validFrom date
    @GetMapping("/search")
    public ResponseEntity<PreferenceDTO> searchPreference(
            @RequestParam String importerCode,
            @RequestParam String exporterCode,
            @RequestParam String productCode,
            @RequestParam java.time.LocalDate validFrom) {
        Country importer = countryRepository.findById(importerCode)
                .orElseThrow(() -> new InvalidRequestException("Importer country not found: " + importerCode));
        Country exporter = countryRepository.findById(exporterCode)
                .orElseThrow(() -> new InvalidRequestException("Exporter country not found: " + exporterCode));
        Product product = productRepository.findById(productCode)
                .orElseThrow(() -> new InvalidRequestException("Product not found: " + productCode));
        return preferenceRepository
                .findByImporterAndExporterAndProductAndValidFrom(importer, exporter, product, validFrom)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new InvalidRequestException("Preference not found for given parameters"));
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
