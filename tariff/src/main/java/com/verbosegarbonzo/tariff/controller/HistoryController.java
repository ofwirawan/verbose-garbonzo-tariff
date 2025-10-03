package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.Transaction;
import com.verbosegarbonzo.tariff.model.UserInfo;
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
            List<Transaction> transactions = transactionRepository.findByUidOrderByTDateDesc(userInfo.getUid());
            
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
            transaction.setUid(userInfo.getUid()); // Use UUID directly instead of toString()
            transaction.setTDate(LocalDate.parse(requestBody.get("t_date").toString()));
            transaction.setImporterCode(requestBody.get("importer_code").toString());
            transaction.setHs6code(requestBody.get("hs6code").toString());
            transaction.setTradeOriginal(new BigDecimal(requestBody.get("trade_original").toString()));
            transaction.setTradeFinal(new BigDecimal(requestBody.get("trade_final").toString()));
            
            // Optional fields
            if (requestBody.containsKey("exporter_code") && requestBody.get("exporter_code") != null) {
                transaction.setExporterCode(requestBody.get("exporter_code").toString());
            }
            if (requestBody.containsKey("net_weight") && requestBody.get("net_weight") != null) {
                transaction.setNetWeight(new BigDecimal(requestBody.get("net_weight").toString()));
            }
            if (requestBody.containsKey("applied_rate") && requestBody.get("applied_rate") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> appliedRate = (Map<String, Object>) requestBody.get("applied_rate");
                transaction.setAppliedRate(appliedRate);
            }
            
            // Save transaction
            Transaction savedTransaction = transactionRepository.save(transaction);
            
            return ResponseEntity.ok(savedTransaction);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error saving transaction: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id, 
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
            Transaction transaction = transactionRepository.findByUidAndTid(userInfo.getUid(), id);
            
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