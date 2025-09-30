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
    @PostMapping
    public ResponseEntity<MeasureDTO> createMeasure(@Valid @RequestBody MeasureDTO dto) {
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
    public ResponseEntity<MeasureDTO> getMeasureById(@PathVariable Long id) {
        return measureRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update Measure by ID
    @PutMapping("/{id}")
    public ResponseEntity<MeasureDTO> updateMeasure(@PathVariable Long id, @Valid @RequestBody MeasureDTO dto) {
        Optional<Measure> optionalMeasure = measureRepository.findById(id);
        if (optionalMeasure.isPresent()) {
            Measure measure = optionalMeasure.get();
            Country importer = countryRepository.findById(dto.getImporterCode()).orElse(null);
            Product product = productRepository.findById(dto.getProductCode()).orElse(null);
            measure.setImporter(importer);
            measure.setProduct(product);
            measure.setValidFrom(dto.getValidFrom());
            measure.setValidTo(dto.getValidTo());
            measure.setMfnAdvalRate(dto.getMfnAdvalRate());
            measure.setSpecificRatePerKg(dto.getSpecificRatePerKg());
            Measure saved = measureRepository.save(measure);
            return ResponseEntity.ok(toDTO(saved));
        }
        return ResponseEntity.notFound().build();
    }

    // Delete Measure by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMeasureById(@PathVariable Long id) {
        if (measureRepository.existsById(id)) {
            measureRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
