package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tariff")
@RequiredArgsConstructor

public class HistoryController {
    private final HistoryService historyService;

    @DeleteMapping("/history")
    public ResponseEntity<Void> clearHistory() {
        historyService.clearHistory();
        return ResponseEntity.noContent().build();
    }
}
