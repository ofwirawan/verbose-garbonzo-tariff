package com.verbosegarbonzo.tariff.service;
import com.verbosegarbonzo.tariff.repository.TariffCalculationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoryService {
    private final TariffCalculationRepository calculationRepository;
    /**
     * Deletes all tariff calculation history from the database.
     */

    @Transactional
    public void clearHistory() {
        log.info("Clearing all tariff calculation history");
        calculationRepository.deleteAll();
    }
}
