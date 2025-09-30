package com.verbosegarbonzo.tariff.service.admin;

import com.verbosegarbonzo.tariff.dto.MeasureDTO;
import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class MeasureService {

    private final MeasureRepository measureRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;

    public MeasureService(MeasureRepository measureRepository,
            CountryRepository countryRepository,
            ProductRepository productRepository) {
        this.measureRepository = measureRepository;
        this.countryRepository = countryRepository;
        this.productRepository = productRepository;
    }

    // Helper: entity to DTO
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

    // Helper: DTO to entity
    private Measure toEntity(MeasureDTO dto) {
        Country importer = countryRepository.findById(dto.getImporterCode()).orElse(null);
        Product product = productRepository.findById(dto.getProductCode()).orElse(null);
        Measure measure = new Measure();
        measure.setMeasureId(dto.getMeasureId());
        measure.setImporter(importer);
        measure.setProduct(product);
        measure.setValidFrom(dto.getValidFrom());
        measure.setValidTo(dto.getValidTo());
        measure.setMfnAdvalRate(dto.getMfnAdvalRate());
        measure.setSpecificRatePerKg(dto.getSpecificRatePerKg());
        return measure;
    }

    // Create new Measure
    @Transactional
    public MeasureDTO create(MeasureDTO dto) {
        Measure measure = toEntity(dto);
        Measure created = measureRepository.save(measure);
        return toDTO(created);
    }

    // Get all Measures (paginated)
    @Transactional(readOnly = true)
    public Page<MeasureDTO> getAll(Pageable pageable) {
        return measureRepository.findAll(pageable)
                .map(this::toDTO);
    }

    // Get Measure by ID
    @Transactional(readOnly = true)
    public MeasureDTO getById(Long id) {
        Measure measure = measureRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Measure not found with id " + id));
        return toDTO(measure);
    }

    // Update Measure by ID
    @Transactional
    public MeasureDTO update(Long id, MeasureDTO dto) {
        Measure measure = measureRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Measure not found with id " + id));
        Country importer = countryRepository.findById(dto.getImporterCode()).orElse(null);
        Product product = productRepository.findById(dto.getProductCode()).orElse(null);
        measure.setImporter(importer);
        measure.setProduct(product);
        measure.setValidFrom(dto.getValidFrom());
        measure.setValidTo(dto.getValidTo());
        measure.setMfnAdvalRate(dto.getMfnAdvalRate());
        measure.setSpecificRatePerKg(dto.getSpecificRatePerKg());
        Measure saved = measureRepository.save(measure);
        return toDTO(saved);
    }

    // Delete Measure by ID
    @Transactional
    public void deleteById(Long id) {
        if (!measureRepository.existsById(id)) {
            throw new NoSuchElementException("Measure not found with id " + id);
        }
        measureRepository.deleteById(id);
    }
}
