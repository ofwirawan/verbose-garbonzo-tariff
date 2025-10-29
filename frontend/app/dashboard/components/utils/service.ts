import {
  TariffCalculationResult,
  ChartDataPoint,
  Country,
  DropdownOption,
  MissingRateYear,
} from "@/app/dashboard/components/utils/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface CalculateTariffRequest {
  importerCode: string;
  exporterCode: string | null;
  hs6: string;
  tradeOriginal: number;
  transactionDate: string;
  netWeight: number | null;
  includeFreight?: boolean;
  freightMode?: string;
  includeInsurance?: boolean;
  insuranceRate?: number;
}

/**
 * Calculate tariff for a single transaction
 */
export async function calculateTariff(
  request: CalculateTariffRequest
): Promise<TariffCalculationResult> {
  // Get JWT token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/calculate`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;

    try {
      const errorData = await response.json();
      // Spring Boot error responses have 'message' field
      if (errorData?.message) {
        errorMsg = errorData.message;
      } else if (errorData?.error) {
        errorMsg = errorData.error;
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }
    } catch (e) {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMsg = errorText;
        }
      } catch (textError) {
        // Keep default HTTP status message
      }
    }

    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Calculate tariffs for multiple years and return formatted chart data
 */
export async function calculateTariffsForYears(
  baseRequest: Omit<CalculateTariffRequest, "transactionDate">,
  suspensions: Array<{ valid_from: string; valid_to: string | null }>,
  startYear: number,
  endYear: number
): Promise<{
  chartData: ChartDataPoint[];
  lastResult: TariffCalculationResult | null;
  errors: MissingRateYear[];
}> {
  const yearDateMap = createYearDateMap(suspensions, startYear, endYear);
  const chartData: ChartDataPoint[] = [];
  const errors: MissingRateYear[] = [];
  let lastResult: TariffCalculationResult | null = null;

  for (let year = startYear; year <= endYear; year++) {
    const transactionDate = yearDateMap[year];

    try {
      const result = await calculateTariff({
        ...baseRequest,
        transactionDate,
      });

      const dutyAmount = calculateDutyAmount(result);
      const { effectiveRate, rateType, isSuspended } =
        calculateEffectiveRate(result);

      chartData.push({
        date: year.toString(),
        value: effectiveRate,
        rateType: rateType,
        isSuspended: isSuspended,
        dutyAmount: dutyAmount,
      });

      lastResult = result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ year, reason: errorMsg });
    }
  }

  return { chartData, lastResult, errors };
}

const TIME_RANGE_YEARS: Record<string, number> = {
  "5y": 5,
  "3y": 3,
  "1y": 1,
};

/**
 * Calculate the effective tariff rate from a calculation result
 */
export function calculateEffectiveRate(result: TariffCalculationResult): {
  effectiveRate: number;
  rateType: string;
  isSuspended: boolean;
} {
  const appliedRate = result.appliedRate || {};
  const hasSuspension = appliedRate.suspension !== undefined;
  const hasPrefAdval = appliedRate.prefAdval !== undefined;
  const hasMfnAdval = appliedRate.mfnAdval !== undefined;
  const hasSpecific = appliedRate.specific !== undefined;

  let effectiveRate = 0;
  let rateType = "No Rate";
  let isSuspended = false;

  if (hasSuspension) {
    effectiveRate = Number(appliedRate.suspension);
    rateType = effectiveRate === 0 ? "Suspended (0%)" : "Suspended";
    isSuspended = true;
  } else if (hasPrefAdval) {
    effectiveRate = Number(appliedRate.prefAdval);
    rateType = "Preferential";
  } else if (hasMfnAdval && hasSpecific) {
    effectiveRate = Number(appliedRate.mfnAdval);
    rateType = "Compound (MFN+Specific)";
  } else if (hasMfnAdval) {
    effectiveRate = Number(appliedRate.mfnAdval);
    rateType = "MFN (Ad-valorem)";
  } else if (hasSpecific) {
    const specificDuty =
      Number(appliedRate.specific) * (Number(result.netWeight) || 1);
    effectiveRate = (specificDuty / Number(result.tradeOriginal)) * 100;
    rateType = "Specific Duty";
  }

  return { effectiveRate, rateType, isSuspended };
}

/**
 * Filter chart data by time range
 */
export function filterDataByTimeRange(
  data: ChartDataPoint[],
  timeRange: string
): ChartDataPoint[] {
  if (timeRange === "all" || data.length === 0) return data;

  const yearCount = TIME_RANGE_YEARS[timeRange];
  if (!yearCount) return data;

  const cutoff = String(Number(data[data.length - 1]?.date) - yearCount + 1);
  return data.filter((item) => item.date >= cutoff);
}

// Calculate duty amount from calculation result
export function calculateDutyAmount(result: TariffCalculationResult): number {
  return Number(result.tradeFinal) - Number(result.tradeOriginal);
}

// Create year-to-date mapping for suspension data
export function createYearDateMap(
  suspensions: Array<{ valid_from: string; valid_to: string | null }>,
  startYear: number,
  endYear: number
): Record<number, string> {
  const yearDateMap: Record<number, string> = {};

  for (let year = startYear; year <= endYear; year++) {
    const suspensionInYear = suspensions.find((susp) => {
      const validFrom = new Date(susp.valid_from);
      return validFrom.getFullYear() === year;
    });

    if (suspensionInYear) {
      yearDateMap[year] = new Date(suspensionInYear.valid_from)
        .toISOString()
        .split("T")[0];
    } else {
      const activeSuspension = suspensions.find((susp) => {
        const validFrom = new Date(susp.valid_from);
        const validTo = susp.valid_to ? new Date(susp.valid_to) : null;
        const yearStart = new Date(`${year}-01-01`);
        const yearEnd = new Date(`${year}-12-31`);
        return validFrom <= yearEnd && (!validTo || validTo >= yearStart);
      });

      if (activeSuspension) {
        const validFrom = new Date(activeSuspension.valid_from);
        const yearStart = new Date(`${year}-01-01`);
        const useDate = validFrom > yearStart ? validFrom : yearStart;
        yearDateMap[year] = useDate.toISOString().split("T")[0];
      } else {
        yearDateMap[year] = `${year}-07-01`;
      }
    }
  }

  return yearDateMap;
}

export const CHART_COLORS = {
  SUSPENDED: {
    fill: "url(#fillSuspended)",
    stroke: "#10b981",
  },
  PREFERENTIAL: {
    fill: "url(#fillPreferential)",
    stroke: "#9333ea",
  },
  MFN: {
    fill: "url(#fillMFN)",
    stroke: "#3b82f6",
  },
  DEFAULT: {
    fill: "url(#fillTariff)",
    stroke: "#000",
  },
} as const;

/**
 * Convert countries to dropdown options
 */
export function convertCountriesToOptions(
  countries: Country[]
): DropdownOption[] {
  return countries.map((country) => ({
    label: country.name,
    value: country.country_code,
  }));
}

/**
 * Convert products to dropdown options
 */
export function convertProductsToOptions(
  products: { hs6code: string; description: string | null }[]
): DropdownOption[] {
  return products
    .filter((prod) => prod.description !== null)
    .map((prod) => ({
      label: prod.description!,
      value: prod.hs6code,
    }));
}

/**
 * Get chart color scheme based on rate type
 */
export function getChartColorScheme(data: ChartDataPoint[]) {
  if (data.length === 0) {
    return CHART_COLORS.DEFAULT;
  }

  const rateType = data[0].rateType;

  if (rateType?.includes("Suspended")) {
    return CHART_COLORS.SUSPENDED;
  }
  if (rateType === "Preferential") {
    return CHART_COLORS.PREFERENTIAL;
  }
  if (rateType?.includes("MFN") || rateType?.includes("Compound")) {
    return CHART_COLORS.MFN;
  }

  return CHART_COLORS.DEFAULT;
}

/**
 * Get tooltip badge class based on rate type
 */
export function getTooltipBadgeClass(
  rateType: string | undefined,
  isSuspended: boolean | undefined
): string {
  if (isSuspended || rateType?.includes("Suspended")) {
    return "bg-green-100 text-green-700";
  }
  if (rateType === "Preferential") {
    return "bg-purple-100 text-purple-700";
  }
  if (rateType?.includes("MFN")) {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-gray-100 text-gray-700";
}
