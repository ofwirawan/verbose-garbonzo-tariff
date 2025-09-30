package com.verbosegarbonzo.tariff.controller.admin;

import com.verbosegarbonzo.tariff.dto.TransactionDTO;
import com.verbosegarbonzo.tariff.model.Transaction;
import com.verbosegarbonzo.tariff.model.User;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.TransactionRepository;
import com.verbosegarbonzo.tariff.repository.UserRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin/transactions")
public class AdminTransactionController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;

    public AdminTransactionController(
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            CountryRepository countryRepository,
            ProductRepository productRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.countryRepository = countryRepository;
        this.productRepository = productRepository;
    }

    // Helper: entity to DTO
    private TransactionDTO toDTO(Transaction transaction) {
        return new TransactionDTO(
                transaction.getTid(),
                transaction.getUser().getUid(),
                transaction.getTDate(),
                transaction.getImporter().getCountryCode(),
                transaction.getExporter() != null ? transaction.getExporter().getCountryCode() : null,
                transaction.getProduct().getHs6Code(),
                transaction.getTradeOriginal(),
                transaction.getNetWeight(),
                transaction.getTradeFinal(),
                transaction.getAppliedRate());
    }

    // Helper: DTO to entity
    private Transaction toEntity(TransactionDTO dto) {
        User user = userRepository.findById(dto.getUser())
                .orElseThrow(() -> new NoSuchElementException("User not found: " + dto.getUser()));
        Country importer = countryRepository.findById(dto.getImporter())
                .orElseThrow(() -> new NoSuchElementException("Importer not found: " + dto.getImporter()));
        Country exporter = dto.getExporter() != null
                ? countryRepository.findById(dto.getExporter())
                        .orElseThrow(() -> new NoSuchElementException("Exporter not found: " + dto.getExporter()))
                : null;
        Product product = productRepository.findById(dto.getProduct())
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + dto.getProduct()));

        Transaction transaction = new Transaction();
        transaction.setTid(dto.getTid());
        transaction.setUser(user);
        transaction.setTDate(dto.getTDate());
        transaction.setImporter(importer);
        transaction.setExporter(exporter);
        transaction.setProduct(product);
        transaction.setTradeOriginal(dto.getTradeOriginal());
        transaction.setNetWeight(dto.getNetWeight());
        transaction.setTradeFinal(dto.getTradeFinal());
        transaction.setAppliedRate(dto.getAppliedRate());

        return transaction;
    }

    // Create new Transaction
    @PostMapping
    public ResponseEntity<TransactionDTO> createTransaction(@Valid @RequestBody TransactionDTO dto) {
        Transaction transaction = toEntity(dto);
        Transaction created = transactionRepository.save(transaction);
        return ResponseEntity.status(201).body(toDTO(created));
    }

    // Get all Transactions (paginated)
    @GetMapping
    public Page<TransactionDTO> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable).map(this::toDTO);
    }

    // Get Transaction by ID
    @GetMapping("/{id}")
    public ResponseEntity<TransactionDTO> getTransactionById(@PathVariable Integer id) {
        return transactionRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update Transaction by ID
    @PutMapping("/{id}")
    public ResponseEntity<TransactionDTO> updateTransaction(@PathVariable Integer id,
            @Valid @RequestBody TransactionDTO dto) {
        return transactionRepository.findById(id)
                .map(existing -> {
                    Transaction updated = toEntity(dto);
                    updated.setTid(id);
                    Transaction saved = transactionRepository.save(updated);
                    return ResponseEntity.ok(toDTO(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete Transaction by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransactionById(@PathVariable Integer id) {
        if (!transactionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        transactionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
