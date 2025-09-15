package com.verbosegarbonzo.tariff.config;

import com.verbosegarbonzo.tariff.entity.Country;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CountryRepository countryRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeCountries();
    }

    private void initializeCountries() {
        if (countryRepository.count() > 0) {
            log.info("Countries already initialized, skipping...");
            return;
        }

        log.info("Initializing countries data...");

        List<Country> countries = Arrays.asList(
                new Country("USA", "United States", "US", "North America", "High income", true),
                new Country("CHN", "China", "CN", "East Asia & Pacific", "Upper middle income", true),
                new Country("DEU", "Germany", "DE", "Europe & Central Asia", "High income", true),
                new Country("JPN", "Japan", "JP", "East Asia & Pacific", "High income", true),
                new Country("GBR", "United Kingdom", "GB", "Europe & Central Asia", "High income", true),
                new Country("FRA", "France", "FR", "Europe & Central Asia", "High income", true),
                new Country("IND", "India", "IN", "South Asia", "Lower middle income", true),
                new Country("ITA", "Italy", "IT", "Europe & Central Asia", "High income", true),
                new Country("BRA", "Brazil", "BR", "Latin America & Caribbean", "Upper middle income", true),
                new Country("CAN", "Canada", "CA", "North America", "High income", true),
                new Country("RUS", "Russian Federation", "RU", "Europe & Central Asia", "Upper middle income", true),
                new Country("KOR", "Korea, Rep.", "KR", "East Asia & Pacific", "High income", true),
                new Country("AUS", "Australia", "AU", "East Asia & Pacific", "High income", true),
                new Country("ESP", "Spain", "ES", "Europe & Central Asia", "High income", true),
                new Country("MEX", "Mexico", "MX", "Latin America & Caribbean", "Upper middle income", true),
                new Country("IDN", "Indonesia", "ID", "East Asia & Pacific", "Upper middle income", true),
                new Country("NLD", "Netherlands", "NL", "Europe & Central Asia", "High income", true),
                new Country("TUR", "Turkey", "TR", "Europe & Central Asia", "Upper middle income", true),
                new Country("CHE", "Switzerland", "CH", "Europe & Central Asia", "High income", true),
                new Country("SAU", "Saudi Arabia", "SA", "Middle East & North Africa", "High income", true),
                new Country("SGP", "Singapore", "SG", "East Asia & Pacific", "High income", true),
                new Country("THA", "Thailand", "TH", "East Asia & Pacific", "Upper middle income", true),
                new Country("VNM", "Vietnam", "VN", "East Asia & Pacific", "Lower middle income", true),
                new Country("MYS", "Malaysia", "MY", "East Asia & Pacific", "Upper middle income", true),
                new Country("PHL", "Philippines", "PH", "East Asia & Pacific", "Lower middle income", true)
        );

        countryRepository.saveAll(countries);
        log.info("Initialized {} countries", countries.size());
    }
}
