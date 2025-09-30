package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.dto.PreferenceDTO;
import com.verbosegarbonzo.tariff.model.Preference;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.PreferenceRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        Country importer = countryRepository.findById(dto.getImporterCode()).orElse(null);
        Country exporter = countryRepository.findById(dto.getExporterCode()).orElse(null);
        Product product = productRepository.findById(dto.getProductCode()).orElse(null);
        Preference preference = new Preference();
        preference.setPreferenceId(dto.getPreferenceId());
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
    public ResponseEntity<PreferenceDTO> getPreferenceById(@PathVariable Long id) {
        return preferenceRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update Preference by ID
    @PutMapping("/{id}")
    public ResponseEntity<PreferenceDTO> updatePreference(@PathVariable Long id,
            @Valid @RequestBody PreferenceDTO dto) {
        Optional<Preference> optionalPreference = preferenceRepository.findById(id);
        if (optionalPreference.isPresent()) {
            Preference preference = optionalPreference.get();
            Country importer = countryRepository.findById(dto.getImporterCode()).orElse(null);
            Country exporter = countryRepository.findById(dto.getExporterCode()).orElse(null);
            Product product = productRepository.findById(dto.getProductCode()).orElse(null);
            preference.setImporter(importer);
            preference.setExporter(exporter);
            preference.setProduct(product);
            preference.setValidFrom(dto.getValidFrom());
            preference.setValidTo(dto.getValidTo());
            preference.setPrefAdValRate(dto.getPrefAdValRate());
            Preference saved = preferenceRepository.save(preference);
            return ResponseEntity.ok(toDTO(saved));
        }
        return ResponseEntity.notFound().build();
    }

    // Delete Preference by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePreferenceById(@PathVariable Long id) {
        if (preferenceRepository.existsById(id)) {
            preferenceRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
