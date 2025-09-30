package com.verbosegarbonzo.tariff.controller;

import com.verbosegarbonzo.tariff.model.History;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "http://localhost:3000")
public class HistoryController {
    private final List<History> historyList = new ArrayList<>();
    private long counter = 1;

    @GetMapping
    public List<History> getAllHistory() {
        return historyList; 
    }

    @PostMapping
    public History addHistory(@RequestBody History history) {
        history.setId(counter++);
        historyList.add(history);
        return history; 
    }

    @DeleteMapping("/{id}")
    public History deleteHistory(@PathVariable Long id){
        Iterator<History> iterator = historyList.iterator();
        History removedHistory = null;
        while (iterator.hasNext()){
            History nextHistory = iterator.next();
            if (nextHistory.getId().equals(id)){
                removedHistory = nextHistory;
                iterator.remove();
                break;
            }
        }
        return removedHistory;
    }
}