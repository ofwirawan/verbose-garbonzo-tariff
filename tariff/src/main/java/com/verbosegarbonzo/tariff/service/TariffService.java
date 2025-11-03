package com.verbosegarbonzo.tariff.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.verbosegarbonzo.tariff.exception.RateNotFoundException;
import com.verbosegarbonzo.tariff.exception.WeightRequiredException;
import com.verbosegarbonzo.tariff.exception.InvalidRateException;
import com.verbosegarbonzo.tariff.exception.InvalidRequestException;

import com.verbosegarbonzo.tariff.config.WitsProperties;
import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;
import com.verbosegarbonzo.tariff.model.Country;
import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.model.Preference;
import com.verbosegarbonzo.tariff.model.Product;
import com.verbosegarbonzo.tariff.model.Suspension;
import com.verbosegarbonzo.tariff.repository.CountryRepository;
import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import com.verbosegarbonzo.tariff.repository.PreferenceRepository;
import com.verbosegarbonzo.tariff.repository.ProductRepository;
import com.verbosegarbonzo.tariff.repository.SuspensionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import java.util.List;


@Service
public class TariffService {

    private static final Logger log = LoggerFactory.getLogger(TariffService.class);
    private static final UUID TEMP_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final CountryRepository countryRepository;
    private final ProductRepository productRepository;
    private final PreferenceRepository preferenceRepo;
    private final MeasureRepository measureRepo;
    private final SuspensionRepository suspensionRepo;
    private final WebClient tariffWebClient;
    private final WitsProperties witsProperties;
    private final FreightService freightService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TariffService(PreferenceRepository preferenceRepo, MeasureRepository measureRepo,
            SuspensionRepository suspensionRepo, CountryRepository countryRepository,
            ProductRepository productRepository,
            @Qualifier("tariffWebClient") WebClient tariffWebClient,
            WitsProperties witsProperties, FreightService freightService) {
        this.preferenceRepo = preferenceRepo;
        this.measureRepo = measureRepo;
        this.suspensionRepo = suspensionRepo;
        this.countryRepository = countryRepository;
        this.productRepository = productRepository;
        this.tariffWebClient = tariffWebClient;
        this.witsProperties = witsProperties;
        this.freightService = freightService;
    }

    private BigDecimal scaleMoney(BigDecimal value) {
    return (value == null) ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
}

    public CalculateResponse calculate(CalculateRequest req) {
        List<String> errors = new ArrayList<>();

        if (req.getHs6() == null || req.getHs6().isBlank()) {
            errors.add("HS6 code is required");
        }
        if (req.getTradeOriginal() == null) {
            errors.add("Trade original is required");
        }
        if (req.getTransactionDate() == null) {
            errors.add("Transaction date is required");
        }

        // If errors found, throw once
        if (!errors.isEmpty()) {
            throw new InvalidRequestException(String.join("; ", errors));
        }

        LocalDate date = req.getTransactionDate();

        // Check suspension first
        Optional<Suspension> suspOpt = suspensionRepo.findActiveSuspension(
                countryRepository.findById(req.getImporterCode()).orElseThrow(),
                productRepository.findById(req.getHs6()).orElseThrow(), date);

        // Check preference (if exporter provided) - preference can override suspension
        Optional<Preference> prefOpt = (req.getExporterCode() != null && !req.getExporterCode().isBlank())
                ? preferenceRepo.findValidRate(countryRepository.findById(req.getImporterCode()).orElseThrow(),
                        countryRepository.findById(req.getExporterCode()).orElseThrow(),
                        productRepository.findById(req.getHs6()).orElseThrow(),
                        date)
                : Optional.empty();

        // If both suspension and preference exist, preference takes precedence (FTA
        // overrides suspension)
        if (prefOpt.isPresent()) {
            List<String> rateErrors = new ArrayList<>();
            Preference pref = prefOpt.get();

            BigDecimal ratePref = pref.getPrefAdValRate();

            if (ratePref.compareTo(BigDecimal.ZERO) < 0) {
                rateErrors.add("Invalid preferential rate: " + ratePref);
            }

            BigDecimal ratePrefCalc = ratePref.multiply(BigDecimal.valueOf(0.01));

            BigDecimal duty = req.getTradeOriginal().multiply(ratePrefCalc);
            duty = scaleMoney(duty);

            // Check if user provided net weight but preference only has ad-valorem rate
            List<String> warnings = new ArrayList<>();
            if (req.getNetWeight() != null) {
                warnings.add("Net weight was provided but not used in calculation. The preferential tariff for this product only has an ad-valorem (percentage) rate. Specific duty rates (per kg) are not available.");
                log.info("Net weight provided but preference only has ad-valorem rate");
            }

            return buildResponse(req, TEMP_USER_ID, duty, null, null, ratePref, null, warnings);
        }

        // Apply suspension only if no preference was found
        if (suspOpt.isPresent()) {
            Suspension susp = suspOpt.get();

            BigDecimal rateSusp = susp.getSuspensionRate();
            if (rateSusp == null) {
                rateSusp = BigDecimal.ZERO;
            }

            if (rateSusp.compareTo(BigDecimal.ZERO) < 0) {
                throw new InvalidRateException("Invalid suspension rate: " + rateSusp);
            }

            BigDecimal rateSuspCalc = rateSusp.multiply(BigDecimal.valueOf(0.01));

            BigDecimal duty = req.getTradeOriginal().multiply(rateSuspCalc);
            duty = scaleMoney(duty);

            // Check if user provided net weight but suspension only has ad-valorem rate
            List<String> warnings = new ArrayList<>();
            if (req.getNetWeight() != null) {
                warnings.add("Net weight was provided but not used in calculation. The suspension tariff for this product only has an ad-valorem (percentage) rate. Specific duty rates (per kg) are not available.");
                log.info("Net weight provided but suspension only has ad-valorem rate");
            }

            // tariff suspended
            return buildResponse(req, TEMP_USER_ID, duty, null, null, null, rateSusp, warnings);
        }

        // Otherwise, check measure
        Optional<Measure> measureOpt = measureRepo.findValidRate(
                countryRepository.findById(req.getImporterCode()).orElseThrow(),
                productRepository.findById(req.getHs6()).orElseThrow(), date);
        if (measureOpt.isPresent()) {
            List<String> rateErrors = new ArrayList<>();
            Measure measure = measureOpt.get();
            BigDecimal duty = BigDecimal.ZERO;
            BigDecimal rateAdval = null, rateSpecific = null;

            BigDecimal rateAdvalCalc = null;

            // normalize rates
            if (measure.getMfnAdvalRate() != null) {
                rateAdval = measure.getMfnAdvalRate();

                if (rateAdval.compareTo(BigDecimal.ZERO) < 0) {
                    rateErrors.add("Invalid MFN ad-valorem rate: " + rateAdval);
                } else {
                    rateAdvalCalc = rateAdval.multiply(BigDecimal.valueOf(0.01));
                }
            }
            if (measure.getSpecificRatePerKg() != null) {
                rateSpecific = measure.getSpecificRatePerKg(); // already per kg, no scaling

                if (rateSpecific.compareTo(BigDecimal.ZERO) < 0) {
                    rateErrors.add("Invalid specific duty rate: " + rateSpecific);
                }
            }

            if (!rateErrors.isEmpty()) {
                throw new InvalidRateException(String.join("; ", rateErrors));
            }

            if (rateSpecific != null && req.getNetWeight() == null) {
                throw new WeightRequiredException("Net weight is required for specific duties");
            }

            // Check if user provided net weight but measure only has ad-valorem rate
            List<String> warnings = new ArrayList<>();
            if (req.getNetWeight() != null && rateSpecific == null) {
                warnings.add("Net weight was provided but not used in calculation. The MFN tariff for this product only has an ad-valorem (percentage) rate. Specific duty rates (per kg) are not available.");
                log.info("Net weight provided but measure only has ad-valorem rate");
            }

            // compound case
            if (rateAdval != null && rateSpecific != null && req.getNetWeight() != null) {
                duty = req.getTradeOriginal().multiply(rateAdvalCalc)
                        .add(req.getNetWeight().multiply(rateSpecific));
                duty = scaleMoney(duty);
            }
            // ad-valorem only
            else if (rateAdval != null && req.getTradeOriginal() != null) {
                duty = req.getTradeOriginal().multiply(rateAdvalCalc);
                duty = scaleMoney(duty);
            }
            // specific only
            else if (rateSpecific != null && req.getNetWeight() != null) {
                duty = req.getNetWeight().multiply(rateSpecific);
                duty = scaleMoney(duty);
            }

            return buildResponse(req, TEMP_USER_ID, duty, rateAdval, rateSpecific, null, null, warnings);
        }

        // 3. Try fetching from WITS API as fallback
        log.info("No tariff found in database, attempting to fetch from WITS API");

        Country importer = countryRepository.findById(req.getImporterCode()).orElseThrow();
        Product product = productRepository.findById(req.getHs6()).orElseThrow();

        // Try preferential first if exporter provided
        if (req.getExporterCode() != null && !req.getExporterCode().isBlank()) {
            Country exporter = countryRepository.findById(req.getExporterCode()).orElseThrow();
            BigDecimal prefRate = fetchPreferentialRateFromWits(importer, exporter, product, date);

            if (prefRate != null) {
                log.info("Found preferential rate from WITS: {}", prefRate);

                // Save to database for future use
                savePreferenceToDatabase(importer, exporter, product, prefRate, date);

                BigDecimal prefRateCalc = prefRate.multiply(BigDecimal.valueOf(0.01));
                BigDecimal duty = req.getTradeOriginal().multiply(prefRateCalc);
                duty = scaleMoney(duty);

                // Check if user provided net weight - WITS only provides ad-valorem rates
                List<String> warnings = new ArrayList<>();
                if (req.getNetWeight() != null) {
                    warnings.add("Net weight was provided but not used in calculation. The WITS API only provides ad-valorem (percentage) rates. Specific duty rates (per kg) are not available.");
                    log.info("Net weight provided but WITS only provides ad-valorem rates");
                }

                return buildResponse(req, TEMP_USER_ID, duty, null, null, prefRate, null, warnings);
            }
        }

        // Try MFN rate
        BigDecimal mfnRate = fetchMfnRateFromWits(importer, product, date);
        if (mfnRate != null) {
            log.info("Found MFN rate from WITS: {}", mfnRate);

            // Save to database for future use
            saveMeasureToDatabase(importer, product, mfnRate, date);

            BigDecimal mfnRateCalc = mfnRate.multiply(BigDecimal.valueOf(0.01));
            BigDecimal duty = req.getTradeOriginal().multiply(mfnRateCalc);
            duty = scaleMoney(duty);

            // Check if user provided net weight - WITS only provides ad-valorem rates
            List<String> warnings = new ArrayList<>();
            if (req.getNetWeight() != null) {
                warnings.add("Net weight was provided but not used in calculation. The WITS API only provides ad-valorem (percentage) rates. Specific duty rates (per kg) are not available.");
                log.info("Net weight provided but WITS only provides ad-valorem rates");
            }

            return buildResponse(req, TEMP_USER_ID, duty, mfnRate, null, null, null, warnings);
        }

        // 4. Still nothing found
        throw new RateNotFoundException(
                "No tariff data available for the specified transaction. " +
                        "Importer: " + req.getImporterCode() + ", " +
                        "Product: " + req.getHs6() + ", " +
                        "Date: " + date + ". " +
                        "This data may not be available in the WITS database for this combination.");
    }

    private BigDecimal fetchMfnRateFromWits(Country importer, Product product, LocalDate date) {
        if (importer.getNumericCode() == null || importer.getNumericCode().isBlank()) {
            log.warn("Cannot fetch from WITS: Country {} has no numeric code", importer.getCountryCode());
            return null;
        }

        try {
            String year = String.valueOf(date.getYear());
            String uri = String.format("/%s/reporter/%s/partner/000/product/%s/year/%s/datatype/reported",
                    witsProperties.getTariff().getDataset(),
                    importer.getNumericCode(),
                    product.getHs6Code(),
                    year);

            log.debug("Fetching from WITS: {}", uri);

            Flux<DataBuffer> body = tariffWebClient.get()
                    .uri(uri)
                    .accept(org.springframework.http.MediaType.APPLICATION_XML)
                    .retrieve()
                    .bodyToFlux(DataBuffer.class);

            InputStream is = DataBufferUtils.join(body)
                    .map(db -> db.asInputStream(true))
                    .block();

            if (is == null) {
                return null;
            }

            return parseWitsXmlForRate(is);

        } catch (Exception e) {
            log.error("Error fetching MFN rate from WITS: {}", e.getMessage());
            return null;
        }
    }

    private BigDecimal fetchPreferentialRateFromWits(Country importer, Country exporter,
            Product product, LocalDate date) {
        if (importer.getNumericCode() == null || importer.getNumericCode().isBlank() ||
                exporter.getNumericCode() == null || exporter.getNumericCode().isBlank()) {
            log.warn("Cannot fetch preferential rate: Missing numeric codes");
            return null;
        }

        try {
            String year = String.valueOf(date.getYear());
            String uri = String.format("/%s/reporter/%s/partner/%s/product/%s/year/%s/datatype/reported",
                    witsProperties.getTariff().getDataset(),
                    importer.getNumericCode(),
                    exporter.getNumericCode(),
                    product.getHs6Code(),
                    year);

            log.debug("Fetching preferential rate from WITS: {}", uri);

            Flux<DataBuffer> body = tariffWebClient.get()
                    .uri(uri)
                    .accept(org.springframework.http.MediaType.APPLICATION_XML)
                    .retrieve()
                    .bodyToFlux(DataBuffer.class);

            InputStream is = DataBufferUtils.join(body)
                    .map(db -> db.asInputStream(true))
                    .block();

            if (is == null) {
                return null;
            }

            return parseWitsXmlForRate(is);

        } catch (Exception e) {
            log.error("Error fetching preferential rate from WITS: {}", e.getMessage());
            return null;
        }
    }

    private BigDecimal parseWitsXmlForRate(InputStream is) {
        try (InputStream in = is) {
            XMLInputFactory factory = XMLInputFactory.newFactory();
            factory.setProperty(XMLInputFactory.IS_NAMESPACE_AWARE, true);
            XMLStreamReader reader = factory.createXMLStreamReader(in);

            while (reader.hasNext()) {
                int event = reader.next();

                if (event == XMLStreamConstants.START_ELEMENT) {
                    String tagName = reader.getLocalName();

                    if ("Obs".equalsIgnoreCase(tagName) || "Observation".equalsIgnoreCase(tagName)) {
                        for (int i = 0; i < reader.getAttributeCount(); i++) {
                            String attrName = reader.getAttributeLocalName(i);
                            String attrValue = reader.getAttributeValue(i);

                            if ("OBS_VALUE".equalsIgnoreCase(attrName) || "value".equalsIgnoreCase(attrName)) {
                                try {
                                    return new BigDecimal(attrValue);
                                } catch (NumberFormatException e) {
                                    log.warn("Invalid rate value in WITS XML: {}", attrValue);
                                }
                            }
                        }
                    }
                }
            }

            return null;

        } catch (Exception e) {
            log.error("Error parsing WITS XML: {}", e.getMessage());
            return null;
        }
    }

    private void saveMeasureToDatabase(Country importer, Product product, BigDecimal rate, LocalDate date) {
        try {
            // Check if already exists to avoid duplicates
            Optional<Measure> existing = measureRepo.findValidRate(importer, product, date);
            if (existing.isPresent()) {
                log.debug("Measure already exists in database, skipping save");
                return;
            }

            Measure measure = new Measure();
            measure.setImporter(importer);
            measure.setProduct(product);
            measure.setValidFrom(date.withDayOfYear(1)); // Start of year
            measure.setValidTo(date.withDayOfYear(date.lengthOfYear())); // End of year
            measure.setMfnAdvalRate(rate);
            measure.setSpecificRatePerKg(null);

            measureRepo.save(measure);
            log.info("Saved MFN measure to database: {} - {} = {}",
                    importer.getCountryCode(), product.getHs6Code(), rate);

        } catch (Exception e) {
            log.error("Failed to save measure to database: {}", e.getMessage());
        }
    }

    private void savePreferenceToDatabase(Country importer, Country exporter,
            Product product, BigDecimal rate, LocalDate date) {
        try {
            // Check if already exists to avoid duplicates
            Optional<Preference> existing = preferenceRepo.findValidRate(importer, exporter, product, date);
            if (existing.isPresent()) {
                log.debug("Preference already exists in database, skipping save");
                return;
            }

            Preference preference = new Preference();
            preference.setImporter(importer);
            preference.setExporter(exporter);
            preference.setProduct(product);
            preference.setValidFrom(date.withDayOfYear(1)); // Start of year
            preference.setValidTo(date.withDayOfYear(date.lengthOfYear())); // End of year
            preference.setPrefAdValRate(rate);

            preferenceRepo.save(preference);
            log.info("Saved preference to database: {} -> {} - {} = {}",
                    exporter.getCountryCode(), importer.getCountryCode(),
                    product.getHs6Code(), rate);

        } catch (Exception e) {
            log.error("Failed to save preference to database: {}", e.getMessage());
        }
    }

    private CalculateResponse buildResponse(
            CalculateRequest req,
            UUID uid,
            BigDecimal duty,
            BigDecimal rateAdval,
            BigDecimal rateSpecific,
            BigDecimal ratePref,
            BigDecimal rateSup,
            List<String> warnings) {

        long tid = System.currentTimeMillis();

        CalculateResponse resp = new CalculateResponse();
        resp.setTransactionId(tid);
        resp.setUid(uid);
        resp.setHs6(req.getHs6());
        resp.setImporterCode(req.getImporterCode());
        resp.setExporterCode(req.getExporterCode());
        resp.setTransactionDate(req.getTransactionDate());
        resp.setTradeOriginal(scaleMoney(req.getTradeOriginal()));
        resp.setNetWeight(req.getNetWeight());
        resp.setTradeFinal(scaleMoney(req.getTradeOriginal().add(duty)));

        // Set default valuation basis (CIF, CFR, FOB)
        Country importer = countryRepository.findById(req.getImporterCode()).orElse(null);
        String basisDeclared = importer != null && importer.getValuationBasis() != null
                ? importer.getValuationBasis().toUpperCase()
                : "CIF";
        resp.setValuationBasisDeclared(basisDeclared);

        // Debug logging
        log.info("Importer: {}, Valuation Basis: {}, IncludeFreight: {}, FreightMode: {}",
                req.getImporterCode(), basisDeclared, req.isIncludeFreight(), req.getFreightMode());

        // Start with base trade + duty
        BigDecimal totalCost = req.getTradeOriginal().add(duty);
        BigDecimal freightCost = BigDecimal.ZERO;
        BigDecimal insuranceCost = BigDecimal.ZERO;
        BigDecimal insuranceRate = req.getInsuranceRate() != null ? req.getInsuranceRate() : BigDecimal.ONE;

        String valuationApplied = basisDeclared;

        try {
            // === FREIGHT CALCULATION ===
            // Calculate freight if requested, regardless of valuation basis
            // For CIF/CFR, it's included in duty; for FOB, it's shown for informational purposes
            if (req.isIncludeFreight()) {
                BigDecimal weight = (req.getNetWeight() != null && req.getNetWeight().compareTo(BigDecimal.ZERO) > 0)
                        ? req.getNetWeight()
                        : new BigDecimal("100"); // fallback estimated weight

                try {
                    FreightService.FreightDetails freightDetails = freightService.calculateFreight(
                            req.getFreightMode(),
                            req.getImporterCode(),
                            req.getExporterCode(),
                            weight.doubleValue());

                    freightCost = BigDecimal.valueOf(freightDetails.getCostAverage());
                    resp.setFreightCost(scaleMoney(freightCost));
                    resp.setFreightType(req.getFreightMode());

                    // Only add to total cost for CIF/CFR valuation basis
                    if (basisDeclared.equals("CIF") || basisDeclared.equals("CFR")) {
                        totalCost = totalCost.add(freightCost);
                    }

                } catch (Exception ex) {
                    log.warn("Freight calculation failed: {}", ex.getMessage());
                    warnings.add("Freight cost could not be fetched (" + ex.getMessage() + "). " + "Calculation continues without freight adjustment.");
                    valuationApplied = "FOB";
                }
            }

            // === INSURANCE CALCULATION ===
            if (basisDeclared.equals("CIF")) {
                // CIF requires insurance
                insuranceCost = req.getTradeOriginal()
                        .multiply(insuranceRate)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                totalCost = totalCost.add(insuranceCost);

            } else if (basisDeclared.equals("CFR")) {
                // CFR includes freight but excludes insurance
                if (req.isIncludeInsurance()) {
                    warnings.add("Insurance selected by user, but CFR valuation excludes insurance.");
                }
                insuranceCost = BigDecimal.ZERO;

            } else if (basisDeclared.equals("FOB")) {
                // FOB excludes both freight and insurance
                if (req.isIncludeInsurance()) {
                    warnings.add("Insurance selected by user, but FOB valuation excludes insurance.");
                }
                insuranceCost = BigDecimal.ZERO;

            } else {
                // fallback for unrecognized valuation basis
                if (req.isIncludeInsurance()) {
                    insuranceCost = req.getTradeOriginal()
                            .multiply(insuranceRate)
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    totalCost = totalCost.add(insuranceCost);
                }
            }

        } catch (Exception e) {
            log.error("Error calculating freight/insurance: {}", e.getMessage(), e);
        }

        resp.setInsuranceRate(insuranceRate);
        resp.setInsuranceCost(scaleMoney(insuranceCost));
        resp.setValuationBasisApplied(valuationApplied);
        resp.setTotalLandedCost(scaleMoney(totalCost));

        // applied rate JSON
        ObjectNode rateNode = objectMapper.createObjectNode();
        if (ratePref != null)
            rateNode.set("prefAdval", objectMapper.getNodeFactory().numberNode(ratePref));
        if (rateAdval != null)
            rateNode.set("mfnAdval", objectMapper.getNodeFactory().numberNode(rateAdval));
        if (rateSpecific != null)
            rateNode.set("specific", objectMapper.getNodeFactory().numberNode(rateSpecific));
        if (rateSup != null)
            rateNode.set("suspension", objectMapper.getNodeFactory().numberNode(rateSup));

        resp.setAppliedRate(rateNode);
        resp.setWarnings(warnings);
        return resp;
    }
}