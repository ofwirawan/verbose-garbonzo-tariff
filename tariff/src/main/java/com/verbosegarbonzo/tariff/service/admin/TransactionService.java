package com.verbosegarbonzo.tariff.service.admin;

import com.verbosegarbonzo.tariff.dto.TransactionDTO;
import com.verbosegarbonzo.tariff.model.Transaction;
import com.verbosegarbonzo.tariff.model.User;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.repository.TransactionRepository;
import com.verbosegarbonzo.tariff.repository.UserRepository;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;

    public TransactionService(TransactionRepository transactionRepository,
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
        User user = userRepository.findById(dto.getUser()).orElse(null);
        Country importer = countryRepository.findById(dto.getImporter()).orElse(null);
        Country exporter = dto.getExporter() != null ? countryRepository.findById(dto.getExporter()).orElse(null)
                : null;
        Product product = productRepository.findById(dto.getProduct()).orElse(null);
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
    @Transactional
    public TransactionDTO create(TransactionDTO dto) {
        Transaction transaction = toEntity(dto);
        Transaction created = transactionRepository.save(transaction);
        return toDTO(created);
    }

    // Get all Transactions (paginated)
    @Transactional(readOnly = true)
    public Page<TransactionDTO> getAll(Pageable pageable) {
        return transactionRepository.findAll(pageable)
                .map(this::toDTO);
    }

    // Get Transaction by ID
    @Transactional(readOnly = true)
    public TransactionDTO getById(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Transaction not found with id " + id));
        return toDTO(transaction);
    }

    // Update Transaction by ID
    @Transactional
    public TransactionDTO update(Long id, TransactionDTO dto) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Transaction not found with id " + id));
        User user = userRepository.findById(dto.getUser()).orElse(null);
        Country importer = countryRepository.findById(dto.getImporter()).orElse(null);
        Country exporter = dto.getExporter() != null ? countryRepository.findById(dto.getExporter()).orElse(null)
                : null;
        Product product = productRepository.findById(dto.getProduct()).orElse(null);
        transaction.setUser(user);
        transaction.setTDate(dto.getTDate());
        transaction.setImporter(importer);
        transaction.setExporter(exporter);
        transaction.setProduct(product);
        transaction.setTradeOriginal(dto.getTradeOriginal());
        transaction.setNetWeight(dto.getNetWeight());
        transaction.setTradeFinal(dto.getTradeFinal());
        transaction.setAppliedRate(dto.getAppliedRate());
        Transaction saved = transactionRepository.save(transaction);
        return toDTO(saved);
    }

    // Delete Transaction by ID
    @Transactional
    public void deleteById(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new NoSuchElementException("Transaction not found with id " + id);
        }
        transactionRepository.deleteById(id);
    }
}
