package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.dto.SuspensionDTO;
import com.verbosegarbonzo.tariff.model.Suspension;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.SuspensionRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        Country importer = countryRepository.findById(dto.getImporterCode()).orElse(null);
        Product product = productRepository.findById(dto.getProductCode()).orElse(null);
        Suspension suspension = new Suspension();
        suspension.setSuspensionId(dto.getSuspensionId());
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
    public ResponseEntity<SuspensionDTO> getSuspensionById(@PathVariable Long id) {
        return suspensionRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update Suspension by ID
    @PutMapping("/{id}")
    public ResponseEntity<SuspensionDTO> updateSuspension(@PathVariable Long id,
            @Valid @RequestBody SuspensionDTO dto) {
        Optional<Suspension> optionalSuspension = suspensionRepository.findById(id);
        if (optionalSuspension.isPresent()) {
            Suspension suspension = optionalSuspension.get();
            Country importer = countryRepository.findById(dto.getImporterCode()).orElse(null);
            Product product = productRepository.findById(dto.getProductCode()).orElse(null);
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
        return ResponseEntity.notFound().build();
    }

    // Delete Suspension by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSuspensionById(@PathVariable Long id) {
        if (suspensionRepository.existsById(id)) {
            suspensionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
