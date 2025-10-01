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
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.UUID;

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

    // Helper to validate required fields
    private void validateRequiredFields(UUID user, String importer, String product, java.time.LocalDate tDate) {
        if (user == null || importer == null || importer.isBlank() ||
                product == null || product.isBlank() || tDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "User, importer, product, and tDate must not be null or blank.");
        }
    }

    private Transaction toEntity(TransactionDTO dto) {
        validateRequiredFields(dto.getUser(), dto.getImporter(), dto.getProduct(), dto.getTDate());
        User user = userRepository.findById(dto.getUser())
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + dto.getUser()));
        Country importer = countryRepository.findById(dto.getImporter())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Importer not found: " + dto.getImporter()));
        Country exporter = dto.getExporter() != null
                ? countryRepository.findById(dto.getExporter())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Exporter not found: " + dto.getExporter()))
                : null;
        Product product = productRepository.findById(dto.getProduct())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Product not found: " + dto.getProduct()));
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

    @PostMapping
    public ResponseEntity<TransactionDTO> createTransaction(@Valid @RequestBody TransactionDTO dto) {
        validateRequiredFields(dto.getUser(), dto.getImporter(), dto.getProduct(), dto.getTDate());
        if (dto.getTid() != null && transactionRepository.existsById(dto.getTid())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A transaction with ID '" + dto.getTid() + "' already exists.");
        }
        Transaction transaction = toEntity(dto);
        Transaction created = transactionRepository.save(transaction);
        return ResponseEntity.status(201).body(toDTO(created));
    }

    @GetMapping
    public Page<TransactionDTO> getAllTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable).map(this::toDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDTO> getTransactionById(@PathVariable Integer id) {
        return transactionRepository.findById(id)
                .map(this::toDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDTO> updateTransaction(@PathVariable Integer id,
            @Valid @RequestBody TransactionDTO dto) {
        validateRequiredFields(dto.getUser(), dto.getImporter(), dto.getProduct(), dto.getTDate());
        if (!transactionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + id);
        }
        Transaction updated = toEntity(dto);
        updated.setTid(id);
        Transaction saved = transactionRepository.save(updated);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransactionById(@PathVariable Integer id) {
        if (!transactionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found: " + id);
        }
        transactionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
