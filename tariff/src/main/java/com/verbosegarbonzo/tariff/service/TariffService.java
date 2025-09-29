package com.verbosegarbonzo.tariff.service;

import com.verbosegarbonzo.tariff.exception.RateNotFoundException;
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
import java.util.Optional;
import java.util.UUID;

@Service
public class TariffService {

    private static final UUID TEMP_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final PreferenceRepository preferenceRepo;
    private final MeasureRepository measureRepo;
    private final SuspensionRepository suspensionRepo;

    public TariffService(PreferenceRepository preferenceRepo, MeasureRepository measureRepo,
            SuspensionRepository suspensionRepo) {
        this.preferenceRepo = preferenceRepo;
        this.measureRepo = measureRepo;
        this.suspensionRepo = suspensionRepo;
    }

    public CalculateResponse calculate(CalculateRequest req) {
        LocalDate date = req.getTransactionDate();

        //Check suspension first
        Optional<Suspension> suspOpt = suspensionRepo.findActiveSuspension(
                req.getImporterCode(), req.getExporterCode(), req.getHs6(), date);

        if (suspOpt.isPresent()) {
            //tariff suspended, duty = 0
            return buildResponse(req, TEMP_USER_ID, BigDecimal.ZERO, null, null, null);
        }

        //Check preference (if exporter provided)
        Optional<Preference> prefOpt = (req.getExporterCode() != null && !req.getExporterCode().isBlank())
                ? preferenceRepo.findValidRate(req.getImporterCode(), req.getExporterCode(), req.getHs6(), date)
                : Optional.empty();

        if (prefOpt.isPresent()) {
            Preference pref = prefOpt.get();

            BigDecimal ratePref = pref.getPrefAdvalRate();
            BigDecimal ratePrefCalc = ratePref.multiply(BigDecimal.valueOf(0.01));

            BigDecimal duty = req.getTradeOriginal().multiply(ratePrefCalc);
            return buildResponse(req, TEMP_USER_ID, duty, null, null, ratePref);
        }

        //Otherwise, check measure
        Optional<Measure> measureOpt = measureRepo.findValidRate(req.getImporterCode(), req.getHs6(), date);
        if (measureOpt.isPresent()) {
            Measure measure = measureOpt.get();
            BigDecimal duty = BigDecimal.ZERO;
            BigDecimal rateAdval = null, rateSpecific = null;

            BigDecimal rateAdvalCalc = null;

            // normalize rates
            if (measure.getMfnAdvalRate() != null) {
                rateAdval = measure.getMfnAdvalRate();
                rateAdvalCalc = rateAdval.multiply(BigDecimal.valueOf(0.01));
            }
            if (measure.getSpecificRatePerKg() != null) {
                rateSpecific = measure.getSpecificRatePerKg(); // already per kg, no scaling
            }

            // compound case
            if (rateAdval != null && rateSpecific != null && req.getNetWeight() != null) {
                duty = req.getTradeOriginal().multiply(rateAdvalCalc)
                        .add(req.getNetWeight().multiply(rateSpecific));
            }
            // ad-valorem only
            else if (rateAdval != null) {
                duty = req.getTradeOriginal().multiply(rateAdvalCalc);
            }
            // specific only
            else if (rateSpecific != null && req.getNetWeight() != null) {
                duty = req.getNetWeight().multiply(rateSpecific);
            }

            return buildResponse(req, TEMP_USER_ID, duty, rateAdval, rateSpecific, null);
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
            BigDecimal ratePref) {

        //generate tid temporarily (later use DB sequence)
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

        resp.setRateAdval(rateAdval);
        resp.setRateSpecific(rateSpecific);
        resp.setRatePref(ratePref);

        return resp;
    }
}
