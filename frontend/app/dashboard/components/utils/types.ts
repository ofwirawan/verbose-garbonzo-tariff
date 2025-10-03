export interface Country {
  country_code: string;
  name: string;
  numeric_code: string;
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
  appliedRate?: {
    suspension?: number;
    prefAdval?: number;
    mfnAdval?: number;
    specific?: number;
  };
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
