export interface Country {
  country_code: string;
  name: string;
  numeric_code: string;
  city?: string | null;
}

export interface Tariff {
  id: string;
  name?: string;
  rate?: number;
  [key: string]: unknown;
}

export interface TariffChartProps {
  initialImportingCountry?: string;
  initialExportingCountry?: string;
  initialProductCode?: string;
  chartTitle?: string;
}

export interface TariffCalculationResult {
  transactionId: string;
  hs6: string;
  importerCode: string;
  exporterCode?: string;
  transactionDate: string;
  rateAdval?: number;
  rateSpecific?: number;
  ratePref?: number;
  tradeOriginal: number;
  tradeFinal: number;
  netWeight?: number;
  suspensionNote?: string;
  suspensionActive?: boolean;
  warning?: string;
  warnings?: string[];
  appliedRate?: {
    suspension?: number;
    prefAdval?: number;
    mfnAdval?: number;
    specific?: number;
  };
  // Freight cost fields
  freightCost?: number;
  freightType?: string;
  // Insurance cost fields
  insuranceRate?: number;
  insuranceCost?: number;
  valuationBasisDeclared?: string;
  valuationBasisApplied?: string;
  // Total cost
  totalLandedCost?: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  rateType?: string;
  isSuspended?: boolean;
  dutyAmount?: number;
}

export interface MissingRateYear {
  year: number;
  reason: string;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface ComparisonRequest {
  destinationCountry: string;
  sourceCountries: string[];
  productCode: string;
  tradeValue: number;
  netWeight?: number;
  transactionDate: string;
  includeFreight?: boolean;
  freightMode?: string;
  includeInsurance?: boolean;
  insuranceRate?: number;
}

export interface ComparisonResult {
  country: string;
  countryName: string;
  result: TariffCalculationResult;
  rank: number;
  percentDiff: number;
}

export interface ComparisonAnalysis {
  results: ComparisonResult[];
  bestIndex: number;
  worstIndex: number;
  chartData: Array<{
    country: string;
    cost: number;
    fill: string;
  }>;
}

// AI Recommendation Types
export type ProfileType = 'BUSINESS_OWNER' | 'POLICY_ANALYST' | 'STUDENT';

export interface OptimalPeriod {
  startDate: string;
  endDate: string;
  avgRate: number;
  currentRate: number;
  savingsPercent: number;
  estimatedSavingsAmount: number;
  confidence: number;
  reason: string;
}

export interface AvoidPeriod {
  startDate: string;
  endDate: string;
  avgRate: number;
  currentRate: number;
  increasePercent: number;
  estimatedAdditionalCostAmount: number;
  confidence: number;
  reason: string;
}

export interface AIRecommendationResponse {
  optimalPeriods: OptimalPeriod[];
  avoidPeriods: AvoidPeriod[];
  explanation: string;
  currentRate: number;
  potentialSavings: number;
  potentialSavingsPercent: number;
  averageConfidence: number;
  modelVersion: string;
  hasInsufficientData: boolean;
}

export interface AIRecommendationRequest {
  importerCode: string;
  exporterCode?: string;
  hs6Code: string;
}
