"use client";

import { useState, useEffect } from "react";
import {
  fetchCountries,
  fetchProduct,
  fetchSuspensionNote,
} from "../../actions/dashboardactions";
import {
  calculateTariff,
  calculateEffectiveRate,
  calculateDutyAmount,
} from "./service";
import {
  Country,
  ChartDataPoint,
  MissingRateYear,
  TariffCalculationResult,
} from "@/app/dashboard/components/utils/types";
import { calculateFreightCost } from "@/lib/freightos";

const REFRESH_INTERVAL = 30000; // 30 seconds

// Hook for fetching and managing tariff-related data (countries, products)
export function useTariffData() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [product, setProduct] = useState<
    { hs6code: string; description: string | null }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchData = async (isInitialLoad = false) => {
      try {
        // Only show loading state on initial load, not on background refreshes
        if (isInitialLoad) {
          setIsLoading(true);
        }
        setHasError(false);

        const [countriesResult, productsResult] = await Promise.all([
          fetchCountries(),
          fetchProduct(),
        ]);

        setCountries(countriesResult.countries);
        setProduct(productsResult.products);
      } catch (error) {
        console.error("Error fetching data:", error);
        setHasError(true);
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    };

    fetchData(true); // Initial load
    const interval = setInterval(() => fetchData(false), REFRESH_INTERVAL); // Background refreshes

    return () => clearInterval(interval);
  }, []);

  return { countries, product, isLoading, hasError };
}

// Hook for managing tariff calculations
export function useTariffCalculation() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] =
    useState<TariffCalculationResult | null>(null);
  const [suspensionNote, setSuspensionNote] = useState<string | null>(null);
  const [missingRateYears, setMissingRateYears] = useState<MissingRateYear[]>(
    []
  );
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Helper function to format date without timezone conversion
  const formatDateForBackend = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calculateTariffData = async (params: {
    importingCountry: string;
    exportingCountry: string;
    productCode: string;
    tradeValue: string;
    netWeight: string;
    transactionDate: Date;
    includeFreight?: boolean;
    freightMode?: 'air' | 'ocean' | 'express';
    // Optional: pass full country objects for freight city lookup
    importingCountryObj?: Country;
    exportingCountryObj?: Country;
  }) => {
    const {
      importingCountry,
      exportingCountry,
      productCode,
      tradeValue,
      netWeight,
      transactionDate,
      includeFreight,
      freightMode,
      importingCountryObj,
      exportingCountryObj,
    } = params;

    if (!importingCountry || !tradeValue) {
      console.error("Missing required fields for tariff calculation");
      return;
    }

    setIsCalculating(true);

    try {
      setHasError(false);
      setErrorMessage("");
      setCalculationResult(null);
      setMissingRateYears([]);

      // Calculate tariff for the specific transaction date only
      const result = await calculateTariff({
        importerCode: importingCountry,
        exporterCode: exportingCountry || null,
        hs6: productCode,
        tradeOriginal: Number(tradeValue),
        netWeight: netWeight ? Number(netWeight) : null,
        transactionDate: formatDateForBackend(transactionDate), // Use local date formatting
      });

      // Calculate freight costs if requested and weight is available
      if (includeFreight && exportingCountry && netWeight) {
        try {
          // Pass country objects if available, otherwise pass country codes
          const freightQuote = await calculateFreightCost(
            exportingCountryObj || exportingCountry,
            importingCountryObj || importingCountry,
            Number(netWeight),
            freightMode || 'air'
          );

          if (freightQuote.success && freightQuote.data) {
            // Add freight data to result
            result.freightCost = freightQuote.data.avgCost;
            result.freightCostMin = freightQuote.data.minCost;
            result.freightCostMax = freightQuote.data.maxCost;
            result.freightMode = freightMode || 'air';
            result.transitDays = freightQuote.data.transitDays;
            result.totalLandedCost = result.tradeFinal + freightQuote.data.avgCost;
          } else {
            console.warn('Freight calculation failed:', freightQuote.error);
            // Don't fail the entire calculation, just skip freight
          }
        } catch (freightError) {
          console.error('Error calculating freight:', freightError);
          // Continue with tariff calculation even if freight fails
        }
      }

      // Store the calculation result
      setCalculationResult(result);

      // Fetch suspension note if applicable
      try {
        const noteResult = await fetchSuspensionNote(
          importingCountry,
          productCode,
          result.transactionDate
        );
        setSuspensionNote(noteResult.suspensionNote);
      } catch (error) {
        console.error("Error fetching suspension note:", error);
        setSuspensionNote(null);
      }

      // Create single data point for the chart
      const { effectiveRate, rateType, isSuspended } =
        calculateEffectiveRate(result);
      const dutyAmount = calculateDutyAmount(result);

      // Use the transaction date from the backend response
      const resultDate = new Date(result.transactionDate);

      setData([
        {
          date: resultDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          value: effectiveRate,
          rateType: rateType,
          isSuspended: isSuspended,
          dutyAmount: dutyAmount,
        },
      ]);

      setMissingRateYears([]);
      setHasError(false);
    } catch (error) {
      console.error("Error calculating tariff:", error);
      setHasError(true);

      // Extract meaningful error message from backend
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else if (typeof error === "string") {
        setErrorMessage(error);
      } else {
        setErrorMessage("Unable to calculate tariff for this transaction.");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    data,
    isCalculating,
    calculationResult,
    suspensionNote,
    missingRateYears,
    hasError,
    errorMessage,
    calculateTariff: calculateTariffData,
  };
}
