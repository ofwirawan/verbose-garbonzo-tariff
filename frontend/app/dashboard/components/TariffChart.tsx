"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, InfoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TariffChartProps,
  DropdownOption,
} from "@/app/dashboard/components/utils/types";
import {
  LoadingSkeleton,
  MissingRateWarning,
  Combobox,
} from "./SharedComponents";
import {
  CalculationResults,
  CalculationResultsSkeleton,
} from "./ResultComponents";
import { useTariffData, useTariffCalculation } from "./utils/hooks";
import {
  convertCountriesToOptions,
  convertProductsToOptions,
} from "./utils/service";

interface TariffChartFormProps {
  transactionDate: Date;
  importingCountry: string;
  exportingCountry: string;
  productCode: string;
  tradeValue: string;
  netWeight: string;
  includeFreight: boolean;
  freightMode: "air" | "ocean";
  includeInsurance: boolean;
  insuranceRate: string;
  countryOptions: DropdownOption[];
  productOptions: DropdownOption[];
  isCalculating: boolean;
  onTransactionDateChange: (date: Date) => void;
  onImportingCountryChange: (value: string) => void;
  onExportingCountryChange: (value: string) => void;
  onProductCodeChange: (value: string) => void;
  onTradeValueChange: (value: string) => void;
  onNetWeightChange: (value: string) => void;
  onIncludeFreightChange: (value: boolean) => void;
  onFreightModeChange: (value: "air" | "ocean") => void;
  onIncludeInsuranceChange: (value: boolean) => void;
  onInsuranceRateChange: (value: string) => void;
  onCalculate: () => void;
}

function TariffChartForm({
  transactionDate,
  importingCountry,
  exportingCountry,
  productCode,
  tradeValue,
  netWeight,
  includeFreight,
  freightMode,
  includeInsurance,
  insuranceRate,
  countryOptions,
  productOptions,
  isCalculating,
  onTransactionDateChange,
  onImportingCountryChange,
  onExportingCountryChange,
  onProductCodeChange,
  onTradeValueChange,
  onNetWeightChange,
  onIncludeFreightChange,
  onFreightModeChange,
  onIncludeInsuranceChange,
  onInsuranceRateChange,
  onCalculate,
}: TariffChartFormProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Two-column split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* LEFT COLUMN - Product & Countries */}
        <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200 space-y-5">
          <div className="pb-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Product & Trade Partners
            </h3>
          </div>

          {/* Product */}
          <div className="space-y-2">
            <div className="h-6 flex items-center">
              <Label
                htmlFor="productCode"
                className="text-sm font-medium text-gray-700"
              >
                Product Code
              </Label>
            </div>
            <Combobox
              value={productCode}
              onValueChange={onProductCodeChange}
              placeholder="Select HS6 code"
              id="productCode"
              options={productOptions}
              searchPlaceholder="Search products..."
              emptyText="No product found."
              showSecondaryText={true}
            />
          </div>

          {/* Importing Country */}
          <div className="space-y-2">
            <div className="h-6 flex items-center">
              <Label
                htmlFor="importingCountry"
                className="text-sm font-medium text-gray-700 flex items-center gap-2 flex-1"
              >
                Importing Country
                <span className="text-xs bg-black text-white px-2 py-0.5 rounded font-medium ml-auto">
                  Sets Rate
                </span>
              </Label>
            </div>
            <Combobox
              value={importingCountry}
              onValueChange={onImportingCountryChange}
              placeholder="Select country"
              id="importingCountry"
              options={countryOptions}
              searchPlaceholder="Search countries..."
              emptyText="No country found."
            />
          </div>

          {/* Exporting Country */}
          <div className="space-y-2">
            <div className="h-6 flex items-center">
              <Label
                htmlFor="exportingCountry"
                className="text-sm font-medium text-gray-700 flex items-center gap-2 flex-1"
              >
                Exporting Country
                <span className="text-xs bg-white text-black border border-gray-300 px-2 py-0.5 rounded font-medium ml-auto">
                  Pays Duty
                </span>
              </Label>
            </div>
            <Combobox
              value={exportingCountry}
              onValueChange={onExportingCountryChange}
              placeholder="Select country"
              id="exportingCountry"
              options={countryOptions}
              searchPlaceholder="Search countries..."
              emptyText="No country found."
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Values & Details */}
        <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200 space-y-5">
          <div className="pb-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Transaction Values
            </h3>
          </div>

          {/* Trade Value */}
          <div className="space-y-2">
            <div className="h-6 flex items-center">
              <Label
                htmlFor="tradeValue"
                className="text-sm font-medium text-gray-700"
              >
                Trade Value
              </Label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="tradeValue"
                type="number"
                min="0"
                step="0.01"
                value={tradeValue}
                onChange={(e) => onTradeValueChange(e.target.value)}
                placeholder="10000"
                className="h-11 pl-7 pr-4 border-gray-300"
              />
            </div>
          </div>

          {/* Net Weight */}
          <div className="space-y-2">
            <div className="h-6 flex items-center">
              <Label
                htmlFor="netWeight"
                className="text-sm font-medium text-gray-700 flex items-center gap-2 flex-1"
              >
                Net Weight
                <span className="text-xs bg-gray-100 text-gray-600 px-2 rounded font-medium ml-auto">
                  Optional
                </span>
              </Label>
            </div>
            <div className="relative">
              <Input
                id="netWeight"
                type="number"
                min="0"
                step="0.01"
                value={netWeight}
                onChange={(e) => onNetWeightChange(e.target.value)}
                placeholder="100"
                className="h-11 pr-12 border-gray-300"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                kg
              </span>
            </div>
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <div className="h-6 flex items-center">
              <Label
                htmlFor="transactionDate"
                className="text-sm font-medium text-gray-700"
              >
                Transaction Date
              </Label>
            </div>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="transactionDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left h-11 px-3 border-gray-300 hover:bg-gray-50 font-normal",
                    !transactionDate && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transactionDate
                    ? format(transactionDate, "MMM d, yyyy")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={transactionDate}
                  onSelect={(date) => {
                    if (date) {
                      onTransactionDateChange(date);
                      setDatePopoverOpen(false);
                    }
                  }}
                  initialFocus
                  captionLayout="dropdown"
                  startMonth={new Date(1990, 0)}
                  endMonth={new Date(new Date().getFullYear() + 1, 11)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Freight & Insurance Options - Full Width Below */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200 space-y-6">
        {/* Freight Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeFreight"
              checked={includeFreight}
              onChange={(e) => onIncludeFreightChange(e.target.checked)}
              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
            />
            <Label
              htmlFor="includeFreight"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Include freight cost estimation
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Freight calculation information"
                  >
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-4 bg-black text-white">
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold">
                      How freight costs are calculated:
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>
                        Estimates calculated using Freightos marketplace rates
                      </li>
                      <li>
                        Package dimensions auto-estimated from weight (200kg/m³
                        density)
                      </li>
                      <li>Costs shown as min-max range with average</li>
                    </ul>
                    <p className="text-gray-300 italic mt-2">
                      Note: Actual shipping costs may vary based on carrier,
                      exact location, package size, and current market rates.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {includeFreight && (
            <div className="pt-2 border-t border-gray-300">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 block">
                Select Shipping Mode
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border-2 border-gray-300 hover:border-gray-900 transition-all bg-white">
                  <input
                    type="radio"
                    name="freightMode"
                    value="air"
                    checked={freightMode === "air"}
                    onChange={(e) =>
                      onFreightModeChange(e.target.value as "air")
                    }
                    className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 focus:ring-gray-900"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900 block">
                      Air Freight
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Fast delivery
                    </p>
                    <p className="text-xs text-gray-400">3-7 days</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border-2 border-gray-300 hover:border-gray-900 transition-all bg-white">
                  <input
                    type="radio"
                    name="freightMode"
                    value="ocean"
                    checked={freightMode === "ocean"}
                    onChange={(e) =>
                      onFreightModeChange(e.target.value as "ocean")
                    }
                    className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 focus:ring-gray-900"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900 block">
                      Ocean Freight
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Economical option
                    </p>
                    <p className="text-xs text-gray-400">20-45 days</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* Insurance Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeInsurance"
              checked={includeInsurance}
              onChange={(e) => onIncludeInsuranceChange(e.target.checked)}
              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
            />
            <Label
              htmlFor="includeInsurance"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Include insurance cost estimation
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Insurance calculation information"
                  >
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-4 bg-black text-white">
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold">
                      How insurance costs are calculated:
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>
                        Insurance is calculated as a percentage of the trade
                        value
                      </li>
                      <li>
                        The rate varies by destination country valuation basis
                        (CIF, CFR, FOB)
                      </li>
                      <li>
                        Applicable only for CIF valuations; CFR and FOB exclude
                        insurance
                      </li>
                    </ul>
                    <p className="text-gray-300 italic mt-2">
                      Default rate is 1% if not specified. Enter 0 to exclude
                      insurance.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {includeInsurance && (
            <div className="pt-2 border-t border-gray-300">
              <div className="space-y-2">
                <Label
                  htmlFor="insuranceRate"
                  className="text-sm font-medium text-gray-700"
                >
                  Insurance Rate
                </Label>
                <div className="space-y-3">
                  {/* Preset and Custom Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Low and Standard Presets */}
                    {[
                      { label: "Low", value: "0.5" },
                      { label: "Standard", value: "1.0" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all ${
                          insuranceRate === option.value
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-300 hover:border-gray-500 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="insuranceRate"
                          value={option.value}
                          checked={insuranceRate === option.value}
                          onChange={(e) =>
                            onInsuranceRateChange(e.target.value)
                          }
                          className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-gray-900 block">
                            {option.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {option.value}%
                          </span>
                        </div>
                      </label>
                    ))}

                    {/* High Preset */}
                    <label
                      className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 transition-all ${
                        insuranceRate === "2.0"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-300 hover:border-gray-500 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="insuranceRate"
                        value="2.0"
                        checked={insuranceRate === "2.0"}
                        onChange={(e) => onInsuranceRateChange(e.target.value)}
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-900 block">
                          High
                        </span>
                        <span className="text-xs text-gray-500">2.0%</span>
                      </div>
                    </label>

                    {/* Custom Amount */}
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-300 hover:border-gray-500 transition-all bg-white">
                      <input
                        type="radio"
                        name="insuranceRate"
                        value="custom"
                        checked={
                          insuranceRate !== "0.5" &&
                          insuranceRate !== "1.0" &&
                          insuranceRate !== "2.0"
                        }
                        onChange={() => {
                          // Just switch to custom mode, keep existing value
                        }}
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900 mt-3"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-900 block">
                          Custom Amount
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            id="customInsuranceRate"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={
                              insuranceRate !== "0.5" &&
                              insuranceRate !== "1.0" &&
                              insuranceRate !== "2.0"
                                ? insuranceRate
                                : ""
                            }
                            onChange={(e) =>
                              onInsuranceRateChange(e.target.value)
                            }
                            placeholder="Enter custom rate"
                            className="h-9 text-xs border-gray-300 flex-1"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Insurance is calculated as a percentage of trade value and is
                  applicable to CIF valuations only. CFR and FOB valuations will
                  exclude insurance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center sm:justify-end">
        <Button
          onClick={onCalculate}
          disabled={!importingCountry || !tradeValue || isCalculating}
          className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed h-10 px-6 font-semibold text-sm uppercase tracking-wide transition-all duration-200"
        >
          {isCalculating ? (
            <span className="flex items-center gap-3">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Calculating...
            </span>
          ) : (
            <span className="flex items-center gap-3">Calculate Tariff</span>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function TariffChart({
  initialImportingCountry = "",
  initialExportingCountry = "",
  initialProductCode = "",
  chartTitle = "Tariff Data Analysis",
}: TariffChartProps) {
  // Data fetching hook
  const { countries, product, isLoading } = useTariffData();

  // Calculation hook
  const {
    isCalculating,
    calculationResult,
    suspensionNote,
    missingRateYears,
    hasError,
    errorMessage,
    calculateTariff,
  } = useTariffCalculation();

  // Form state
  const [importingCountry, setImportingCountry] = useState(
    initialImportingCountry
  );
  const [exportingCountry, setExportingCountry] = useState(
    initialExportingCountry
  );
  const [productCode, setProductCode] = useState(initialProductCode);
  const [tradeValue, setTradeValue] = useState("10000");
  const [netWeight, setNetWeight] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [includeFreight, setIncludeFreight] = useState(false);
  const [freightMode, setFreightMode] = useState<"air" | "ocean">("air");
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [insuranceRate, setInsuranceRate] = useState("1.0");

  // Derived state
  const countryOptions = convertCountriesToOptions(countries);
  const productOptions = convertProductsToOptions(product);

  const handleCalculate = () => {
    calculateTariff({
      importingCountry,
      exportingCountry,
      productCode,
      tradeValue,
      netWeight,
      transactionDate,
      includeFreight,
      freightMode,
      includeInsurance,
      insuranceRate: insuranceRate ? parseFloat(insuranceRate) : undefined,
    });
  };

  return (
    <Card className="@container/card shadow-sm">
      <CardHeader className="border-b border-gray-200 pb-6 pt-6">
        <CardTitle className="text-xl font-bold text-gray-900">
          {chartTitle}
        </CardTitle>
        <CardDescription className="text-sm mt-2 text-gray-600">
          Enter transaction details and shipping options to calculate import
          duties and freight costs
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <LoadingSkeleton isCalculating={false} />
        ) : (
          <>
            <TariffChartForm
              transactionDate={transactionDate}
              importingCountry={importingCountry}
              exportingCountry={exportingCountry}
              productCode={productCode}
              tradeValue={tradeValue}
              netWeight={netWeight}
              includeFreight={includeFreight}
              freightMode={freightMode}
              includeInsurance={includeInsurance}
              insuranceRate={insuranceRate}
              countryOptions={countryOptions}
              productOptions={productOptions}
              isCalculating={isCalculating}
              onTransactionDateChange={setTransactionDate}
              onImportingCountryChange={setImportingCountry}
              onExportingCountryChange={setExportingCountry}
              onProductCodeChange={setProductCode}
              onTradeValueChange={setTradeValue}
              onNetWeightChange={setNetWeight}
              onIncludeFreightChange={setIncludeFreight}
              onFreightModeChange={setFreightMode}
              onIncludeInsuranceChange={setIncludeInsurance}
              onInsuranceRateChange={setInsuranceRate}
              onCalculate={handleCalculate}
            />

            {missingRateYears.length > 0 && (
              <div className="mt-6">
                <MissingRateWarning missingYears={missingRateYears} />
              </div>
            )}

            {isCalculating && <CalculationResultsSkeleton />}

            {!isCalculating && calculationResult && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <CalculationResults
                  result={calculationResult}
                  suspensionNote={suspensionNote}
                />
              </div>
            )}

            {!isCalculating && calculationResult?.warning && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-900 mb-1">
                        Notice
                      </h3>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {calculationResult.warning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasError && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {errorMessage?.includes("Net weight cannot be used")
                          ? "Net Weight Not Applicable"
                          : "No Tariff Data Available"}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {errorMessage ||
                          "No tariff data available for the specified transaction. This data may not be available in the WITS database for this combination."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
