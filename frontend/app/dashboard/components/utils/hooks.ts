"use client";

import { useState, useEffect } from "react";
import {
  fetchCountries,
  fetchProduct,
  fetchSuspensionsByProduct,
  fetchSuspensionNote,
} from "../../actions/dashboardactions";
import { calculateTariffsForYears } from "./service";
import {
  Country,
  ChartDataPoint,
  MissingRateYear,
  TariffCalculationResult,
} from "@/app/dashboard/components/utils/types";

const REFRESH_INTERVAL = 30000; // 30 seconds

/**
 * Hook for fetching and managing tariff-related data (countries, products)
 */
export function useTariffData() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [product, setProduct] = useState<
    { hs6code: string; description: string | null }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return { countries, product, isLoading, hasError };
}

/**
 * Hook for managing tariff calculations
 */
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

  const calculateTariffData = async (params: {
    importingCountry: string;
    exportingCountry: string;
    productCode: string;
    tradeValue: string;
    netWeight: string;
    startDate: Date;
    endDate: Date;
  }) => {
    const {
      importingCountry,
      exportingCountry,
      productCode,
      tradeValue,
      netWeight,
      startDate,
      endDate,
    } = params;

    if (!importingCountry || !tradeValue) {
      console.error("Missing required fields for tariff calculation");
      return;
    }

    setIsCalculating(true);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    try {
      setHasError(false);
      setCalculationResult(null);
      setMissingRateYears([]);

      // Fetch suspension data
      const suspensionData = await fetchSuspensionsByProduct(
        importingCountry,
        productCode,
        startYear,
        endYear
      );

      // Calculate tariffs for all years
      const { chartData, lastResult, errors } = await calculateTariffsForYears(
        {
          importerCode: importingCountry,
          exporterCode: exportingCountry || null,
          hs6: productCode,
          tradeOriginal: Number(tradeValue),
          netWeight: netWeight ? Number(netWeight) : null,
        },
        suspensionData.suspensions,
        startYear,
        endYear
      );

      // Store the last calculation result
      if (lastResult) {
        setCalculationResult(lastResult);

        try {
          const noteResult = await fetchSuspensionNote(
            importingCountry,
            productCode,
            lastResult.transactionDate
          );
          setSuspensionNote(noteResult.suspensionNote);
        } catch (error) {
          console.error("Error fetching suspension note:", error);
          setSuspensionNote(null);
        }
      }

      setData(chartData);
      setMissingRateYears(errors);
      setHasError(false);
    } catch (error) {
      console.error("Error calculating tariff:", error);
      setHasError(true);
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
    calculateTariff: calculateTariffData,
  };
}
