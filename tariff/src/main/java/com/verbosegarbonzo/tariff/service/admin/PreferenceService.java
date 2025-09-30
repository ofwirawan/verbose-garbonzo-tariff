package com.verbosegarbonzo.tariff.service.admin;

import com.verbosegarbonzo.tariff.dto.PreferenceDTO;
import com.verbosegarbonzo.tariff.model.Preference;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.PreferenceRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class PreferenceService {

    private final PreferenceRepository preferenceRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;

    public PreferenceService(PreferenceRepository preferenceRepository,
            CountryRepository countryRepository,
            ProductRepository productRepository) {
        this.preferenceRepository = preferenceRepository;
        this.countryRepository = countryRepository;
        this.productRepository = productRepository;
    }

    // Helper: entity to DTO
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

    // Helper: DTO to entity
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
    @Transactional
    public PreferenceDTO create(PreferenceDTO dto) {
        Preference preference = toEntity(dto);
        Preference created = preferenceRepository.save(preference);
        return toDTO(created);
    }

    // Get all Preferences (paginated)
    @Transactional(readOnly = true)
    public Page<PreferenceDTO> getAll(Pageable pageable) {
        return preferenceRepository.findAll(pageable)
                .map(this::toDTO);
    }

    // Get Preference by ID
    @Transactional(readOnly = true)
    public PreferenceDTO getById(Long id) {
        Preference preference = preferenceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Preference not found with id " + id));
        return toDTO(preference);
    }

    // Update Preference by ID
    @Transactional
    public PreferenceDTO update(Long id, PreferenceDTO dto) {
        Preference preference = preferenceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Preference not found with id " + id));
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
        return toDTO(saved);
    }

    // Delete Preference by ID
    @Transactional
    public void deleteById(Long id) {
        if (!preferenceRepository.existsById(id)) {
            throw new NoSuchElementException("Preference not found with id " + id);
        }
        preferenceRepository.deleteById(id);
    }
}
