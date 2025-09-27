package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.History;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "http://localhost:3000")
public class HistoryController {
    private final List<History> historyList = new ArrayList<>();
    private long counter = 1;

    @GetMapping
    public List<History> getAllHistory() {
        return historyList; // NO toString() anywhere
    }

    @PostMapping
    public History addHistory(@RequestBody History history) {
        history.setId(counter++);
        historyList.add(history);
        return history; // NO toString()
    }

}