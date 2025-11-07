package com.verbosegarbonzo.tariff.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.verbosegarbonzo.tariff.model.Transaction;
import com.verbosegarbonzo.tariff.model.UserInfo;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.repository.TransactionRepository;
import com.verbosegarbonzo.tariff.repository.UserInfoRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = {"http://localhost:3000"})
@RequiredArgsConstructor
public class HistoryController {
    
    private final TransactionRepository transactionRepository;
    private final UserInfoRepository userInfoRepository;
    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<?> getAllHistory(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Authentication required"));
            }
            
            // Get user by email (username in JWT)
            String email = userDetails.getUsername();
            Optional<UserInfo> userInfoOpt = userInfoRepository.findByEmail(email);
            
            if (userInfoOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            UserInfo userInfo = userInfoOpt.get();
            List<Transaction> transactions = transactionRepository.findByUidOrderByTDateDesc(userInfo);
            
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching history: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> addHistory(@RequestBody Map<String, Object> requestBody, 
                                      @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Authentication required"));
            }
            
            // Validate required fields
            if (!requestBody.containsKey("t_date") || requestBody.get("t_date") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "t_date is required"));
            }
            if (!requestBody.containsKey("hs6code") || requestBody.get("hs6code") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "hs6code is required"));
            }
            if (!requestBody.containsKey("trade_original") || requestBody.get("trade_original") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "trade_original is required"));
            }
            if (!requestBody.containsKey("importer_code") || requestBody.get("importer_code") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "importer_code is required"));
            }
            if (!requestBody.containsKey("trade_final") || requestBody.get("trade_final") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "trade_final is required"));
            }

            // Get user by email (username in JWT)
            String email = userDetails.getUsername();
            Optional<UserInfo> userInfoOpt = userInfoRepository.findByEmail(email);
            
            if (userInfoOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            UserInfo userInfo = userInfoOpt.get();
            
            // Create new transaction
            Transaction transaction = new Transaction();
            transaction.setUser(userInfo); // Use UUID directly instead of toString()
            transaction.setTDate(LocalDate.parse(requestBody.get("t_date").toString()));
            transaction.setImporter(countryRepository.findById(requestBody.get("importer_code").toString()).orElseThrow());
            transaction.setProduct(productRepository.findById(requestBody.get("hs6code").toString()).orElseThrow());
            transaction.setTradeOriginal(new BigDecimal(requestBody.get("trade_original").toString()));
            transaction.setTradeFinal(new BigDecimal(requestBody.get("trade_final").toString()));

            // Optional fields
            if (requestBody.containsKey("exporter_code") && requestBody.get("exporter_code") != null) {
                transaction.setExporter(countryRepository.findById(requestBody.get("exporter_code").toString()).orElseThrow());
            }
            if (requestBody.containsKey("net_weight") && requestBody.get("net_weight") != null) {
                transaction.setNetWeight(new BigDecimal(requestBody.get("net_weight").toString()));
            }
            if (requestBody.containsKey("applied_rate") && requestBody.get("applied_rate") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> appliedRate = (Map<String, Object>) requestBody.get("applied_rate");
                transaction.setAppliedRate(objectMapper.valueToTree(appliedRate));
            }
            
            // Add missing fields for complete calculation data
            if (requestBody.containsKey("freight_cost") && requestBody.get("freight_cost") != null) {
                transaction.setFreightCost(new BigDecimal(requestBody.get("freight_cost").toString()));
            }
            if (requestBody.containsKey("freight_type") && requestBody.get("freight_type") != null) {
                transaction.setFreightType(requestBody.get("freight_type").toString());
            }
            if (requestBody.containsKey("insurance_rate") && requestBody.get("insurance_rate") != null) {
                transaction.setInsuranceRate(new BigDecimal(requestBody.get("insurance_rate").toString()));
            }
            if (requestBody.containsKey("insurance_cost") && requestBody.get("insurance_cost") != null) {
                transaction.setInsuranceCost(new BigDecimal(requestBody.get("insurance_cost").toString()));
            }
            if (requestBody.containsKey("total_landed_cost") && requestBody.get("total_landed_cost") != null) {
                transaction.setTotalLandedCost(new BigDecimal(requestBody.get("total_landed_cost").toString()));
            }
            if (requestBody.containsKey("warnings") && requestBody.get("warnings") != null) {
                transaction.setWarnings(objectMapper.valueToTree(requestBody.get("warnings")));
            }
            
            // Save transaction
            Transaction savedTransaction = transactionRepository.save(transaction);

            return ResponseEntity.status(201).body(savedTransaction);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error saving transaction: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Integer id, 
                                         @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Authentication required"));
            }
            
            // Get user by email (username in JWT)
            String email = userDetails.getUsername();
            Optional<UserInfo> userInfoOpt = userInfoRepository.findByEmail(email);
            
            if (userInfoOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            UserInfo userInfo = userInfoOpt.get();
            
            // Find transaction by user and id
            Transaction transaction = transactionRepository.findByUidAndTid(userInfo, id);
            
            if (transaction == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Transaction not found or access denied"));
            }
            
            // Delete transaction
            transactionRepository.delete(transaction);
            
            return ResponseEntity.ok(Map.of("message", "Transaction deleted successfully", "deletedTransaction", transaction));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting transaction: " + e.getMessage()));
        }
    }
}