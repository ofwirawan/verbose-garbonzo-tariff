"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateBatchTariffs,
  compareResults,
} from "@/app/dashboard/components/utils/service";
import { CalculateTariffRequest } from "@/app/dashboard/components/utils/service";
import {
  Country,
  DropdownOption,
  ComparisonAnalysis,
} from "@/app/dashboard/components/utils/types";
import { ComparisonForm } from "./ComparisonForm";
import { ComparisonResults } from "././ComparisonResults";
import { AlertCircle } from "lucide-react";

interface ComparisonContainerProps {
  countries: Country[];
  products: DropdownOption[];
  initialDestinationCountry?: string;
  initialExportingCountry?: string;
  initialProductCode?: string;
  initialTradeValue?: number;
  initialNetWeight?: number;
  initialTransactionDate?: Date;
  initialIncludeFreight?: boolean;
  initialFreightMode?: string;
  initialIncludeInsurance?: boolean;
  initialInsuranceRate?: number;
  onBack?: () => void;
}

export function ComparisonContainer({
  countries,
  products,
  initialDestinationCountry = "",
  initialExportingCountry = "",
  initialProductCode = "",
  initialTradeValue = 1000,
  initialNetWeight,
  initialTransactionDate = new Date(),
  initialIncludeFreight = false,
  initialFreightMode = "ocean",
  initialIncludeInsurance = false,
  initialInsuranceRate = 0.5,
  onBack,
}: ComparisonContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonAnalysis | null>(null);
  const [comparisonData, setComparisonData] = useState<{
    destinationCountry: string;
    sourceCountries: string[];
    productCode: string;
  } | null>(null);

  const getCountryName = (code: string): string => {
    return countries.find((c) => c.country_code === code)?.name || code;
  };

  const handleCompare = async (data: {
    destinationCountry: string;
    sourceCountries: string[];
    productCode: string;
    tradeValue: number;
    netWeight?: number;
    transactionDate: string;
    includeFreight: boolean;
    freightMode: string;
    includeInsurance: boolean;
    insuranceRate: number;
  }) => {
    setIsLoading(true);
    setError(null);
    setComparison(null);

    try {
      // Build batch requests for each source country
      const requests: CalculateTariffRequest[] = data.sourceCountries.map(
        (sourceCountry) => ({
          importerCode: data.destinationCountry,
          exporterCode: sourceCountry,
          hs6: data.productCode,
          tradeOriginal: data.tradeValue,
          netWeight: data.netWeight || null,
          transactionDate: data.transactionDate,
          includeFreight: data.includeFreight,
          freightMode: data.freightMode,
          includeInsurance: data.includeInsurance,
          insuranceRate: data.insuranceRate,
        })
      );

      // Call batch API
      const results = await calculateBatchTariffs(requests);

      // Create country name mapping
      const countryNameMap: Record<string, string> = {};
      data.sourceCountries.forEach((code) => {
        countryNameMap[code] = getCountryName(code);
      });

      // Compare results
      const analysis = compareResults(results, countryNameMap);

      setComparison(analysis);
      setComparisonData({
        destinationCountry: data.destinationCountry,
        sourceCountries: data.sourceCountries,
        productCode: data.productCode,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setComparison(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ComparisonForm
        countries={countries}
        products={products}
        onCompare={handleCompare}
        isLoading={isLoading}
        initialDestinationCountry={initialDestinationCountry}
        initialExportingCountry={initialExportingCountry}
        initialProductCode={initialProductCode}
        initialTradeValue={initialTradeValue}
        initialNetWeight={initialNetWeight}
        initialTransactionDate={initialTransactionDate}
        initialIncludeFreight={initialIncludeFreight}
        initialFreightMode={initialFreightMode}
        initialIncludeInsurance={initialIncludeInsurance}
        initialInsuranceRate={initialInsuranceRate}
        onBack={onBack}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-32" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {comparison && comparisonData && !isLoading && (
        <ComparisonResults
          comparison={comparison}
          destinationCountry={getCountryName(comparisonData.destinationCountry)}
          productCode={comparisonData.productCode}
        />
      )}
    </div>
  );
}
