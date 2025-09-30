package com.verbosegarbonzo.tariff.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.verbosegarbonzo.tariff.exception.RateNotFoundException;
import com.verbosegarbonzo.tariff.exception.WeightRequiredException;
import com.verbosegarbonzo.tariff.exception.InvalidRateException;
import com.verbosegarbonzo.tariff.exception.InvalidRequestException;

import com.verbosegarbonzo.tariff.model.CalculateRequest;
import com.verbosegarbonzo.tariff.model.CalculateResponse;
import com.verbosegarbonzo.tariff.model.Measure;
import com.verbosegarbonzo.tariff.model.Preference;
import com.verbosegarbonzo.tariff.model.Suspension;

import com.verbosegarbonzo.tariff.repository.MeasureRepository;
import com.verbosegarbonzo.tariff.repository.PreferenceRepository;
import com.verbosegarbonzo.tariff.repository.SuspensionRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Service
public class TariffService {

    private static final UUID TEMP_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final PreferenceRepository preferenceRepo;
    private final MeasureRepository measureRepo;
    private final SuspensionRepository suspensionRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TariffService(PreferenceRepository preferenceRepo, MeasureRepository measureRepo,
            SuspensionRepository suspensionRepo) {
        this.preferenceRepo = preferenceRepo;
        this.measureRepo = measureRepo;
        this.suspensionRepo = suspensionRepo;
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
                req.getImporterCode(), req.getHs6(), date);

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
            // tariff suspended
            return buildResponse(req, TEMP_USER_ID, duty, null, null, null, rateSusp);
        }

        // Check preference (if exporter provided)
        Optional<Preference> prefOpt = (req.getExporterCode() != null && !req.getExporterCode().isBlank())
                ? preferenceRepo.findValidRate(req.getImporterCode(), req.getExporterCode(), req.getHs6(), date)
                : Optional.empty();

        if (prefOpt.isPresent()) {
            List<String> rateErrors = new ArrayList<>();
            Preference pref = prefOpt.get();

            BigDecimal ratePref = pref.getPrefAdvalRate();

            if (ratePref.compareTo(BigDecimal.ZERO) < 0) {
                rateErrors.add("Invalid preferential rate: " + ratePref);
            }

            BigDecimal ratePrefCalc = ratePref.multiply(BigDecimal.valueOf(0.01));

            BigDecimal duty = req.getTradeOriginal().multiply(ratePrefCalc);
            return buildResponse(req, TEMP_USER_ID, duty, null, null, ratePref, null);
        }

        // Otherwise, check measure
        Optional<Measure> measureOpt = measureRepo.findValidRate(req.getImporterCode(), req.getHs6(), date);
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

            // compound case
            if (rateAdval != null && rateSpecific != null && req.getNetWeight() != null) {
                duty = req.getTradeOriginal().multiply(rateAdvalCalc)
                        .add(req.getNetWeight().multiply(rateSpecific));
            }
            // ad-valorem only
            else if (rateAdval != null && req.getTradeOriginal() != null) {
                duty = req.getTradeOriginal().multiply(rateAdvalCalc);
            }
            // specific only
            else if (rateSpecific != null && req.getNetWeight() != null) {
                duty = req.getNetWeight().multiply(rateSpecific);
            }

            return buildResponse(req, TEMP_USER_ID, duty, rateAdval, rateSpecific, null, null);
        }

        // 3. Nothing found
        throw new RateNotFoundException("No applicable tariff found for hs6=" + req.getHs6());
    }

    private CalculateResponse buildResponse(
            CalculateRequest req,
            UUID uid,
            BigDecimal duty,
            BigDecimal rateAdval,
            BigDecimal rateSpecific,
            BigDecimal ratePref,
            BigDecimal rateSup) {

        // generate tid temporarily (later use DB sequence)
        long tid = System.currentTimeMillis();

        CalculateResponse resp = new CalculateResponse();
        resp.setTransactionId(tid);
        resp.setUid(uid);
        resp.setHs6(req.getHs6());
        resp.setImporterCode(req.getImporterCode());
        resp.setExporterCode(req.getExporterCode());
        resp.setTransactionDate(req.getTransactionDate());

        resp.setTradeOriginal(req.getTradeOriginal());
        resp.setNetWeight(req.getNetWeight());
        resp.setTradeFinal(req.getTradeOriginal().add(duty));

        // build applied_rate JSON
        ObjectNode rateNode = objectMapper.createObjectNode();
        if (ratePref != null) {
            rateNode.set("prefAdval", objectMapper.getNodeFactory().numberNode(ratePref));
        }
        if (rateAdval != null) {
            rateNode.set("mfnAdval", objectMapper.getNodeFactory().numberNode(rateAdval));
        }
        if (rateSpecific != null) {
            rateNode.set("specific", objectMapper.getNodeFactory().numberNode(rateSpecific));
        }
        if (rateSup != null) {
            rateNode.set("suspension", objectMapper.getNodeFactory().numberNode(rateSup));
        }

        resp.setAppliedRate(rateNode);
        return resp;
    }
}
