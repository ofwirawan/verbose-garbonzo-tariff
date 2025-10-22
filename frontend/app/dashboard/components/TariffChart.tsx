"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { CalculationResults, CalculationResultsSkeleton } from "./ResultComponents";
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
  countryOptions: DropdownOption[];
  productOptions: DropdownOption[];
  isCalculating: boolean;
  onTransactionDateChange: (date: Date) => void;
  onImportingCountryChange: (value: string) => void;
  onExportingCountryChange: (value: string) => void;
  onProductCodeChange: (value: string) => void;
  onTradeValueChange: (value: string) => void;
  onNetWeightChange: (value: string) => void;
  onCalculate: () => void;
}

function TariffChartForm({
  transactionDate,
  importingCountry,
  exportingCountry,
  productCode,
  tradeValue,
  netWeight,
  countryOptions,
  productOptions,
  isCalculating,
  onTransactionDateChange,
  onImportingCountryChange,
  onExportingCountryChange,
  onProductCodeChange,
  onTradeValueChange,
  onNetWeightChange,
  onCalculate,
}: TariffChartFormProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Single unified form container */}
      <div className="bg-white rounded-lg p-8 border border-gray-200">
        {/* Transaction Date & Product */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <Label
              htmlFor="transactionDate"
              className="text-sm font-bold text-black uppercase tracking-wide"
            >
              Transaction Date
            </Label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="transactionDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-medium h-12 px-4 bg-white border border-gray-300 hover:bg-gray-50 transition-all",
                    !transactionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2.5 h-4 w-4" />
                  {transactionDate ? (
                    format(transactionDate, "MMM d, yyyy")
                  ) : (
                    <span>Select date</span>
                  )}
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

          <div className="space-y-3">
            <Label
              htmlFor="productCode"
              className="text-sm font-bold text-black uppercase tracking-wide"
            >
              Product Code
            </Label>
            <Combobox
              value={productCode}
              onValueChange={onProductCodeChange}
              placeholder="Select product code"
              id="productCode"
              options={productOptions}
              searchPlaceholder="Search products..."
              emptyText="No product found."
              showSecondaryText={true}
            />
          </div>
        </div>

        {/* Trade Partners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <Label
              htmlFor="importingCountry"
              className="text-sm font-bold text-black uppercase tracking-wide flex items-center gap-2"
            >
              Importing Country
              <span className="text-xs bg-black text-white px-2 py-0.5 rounded font-medium ml-auto normal-case">
                Sets Rate
              </span>
            </Label>
            <Combobox
              value={importingCountry}
              onValueChange={onImportingCountryChange}
              placeholder="Select importing country"
              id="importingCountry"
              options={countryOptions}
              searchPlaceholder="Search countries..."
              emptyText="No country found."
            />
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="exportingCountry"
              className="text-sm font-bold text-black uppercase tracking-wide flex items-center gap-2"
            >
              Exporting Country
              <span className="text-xs bg-white text-black border border-gray-300 px-2 py-0.5 rounded font-medium ml-auto normal-case">
                Pays Duty
              </span>
            </Label>
            <Combobox
              value={exportingCountry}
              onValueChange={onExportingCountryChange}
              placeholder="Select exporting country"
              id="exportingCountry"
              options={countryOptions}
              searchPlaceholder="Search countries..."
              emptyText="No country found."
            />
          </div>
        </div>

        {/* Trade Values */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label
              htmlFor="tradeValue"
              className="text-sm font-bold text-black uppercase tracking-wide"
            >
              Trade Value
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black text-base font-bold">
                $
              </span>
              <Input
                id="tradeValue"
                type="number"
                min="0"
                step="0.01"
                value={tradeValue}
                onChange={(e) => onTradeValueChange(e.target.value)}
                placeholder="0.00"
                className="h-12 pl-9 pr-4 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all font-semibold text-base"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="netWeight"
              className="text-sm font-bold text-black uppercase tracking-wide flex items-center gap-2"
            >
              Net Weight
              <span className="text-xs bg-gray-100 text-gray-600 px-2 rounded font-medium ml-auto normal-case">
                Optional
              </span>
            </Label>
            <div className="relative">
              <Input
                id="netWeight"
                type="number"
                min="0"
                step="0.01"
                value={netWeight}
                onChange={(e) => onNetWeightChange(e.target.value)}
                placeholder="0.00"
                className="h-12 px-4 pr-12 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all font-semibold text-base"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-base font-bold">
                kg
              </span>
            </div>
          </div>
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
            <span className="flex items-center gap-3">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Calculate Tariff
            </span>
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
    });
  };

  return (
    <Card className="@container/card shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100/50 pb-4">
        <CardTitle className="text-lg font-semibold">{chartTitle}</CardTitle>
        <CardDescription className="text-sm mt-1">
          Calculate tariff duties for a specific transaction
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
              countryOptions={countryOptions}
              productOptions={productOptions}
              isCalculating={isCalculating}
              onTransactionDateChange={setTransactionDate}
              onImportingCountryChange={setImportingCountry}
              onExportingCountryChange={setExportingCountry}
              onProductCodeChange={setProductCode}
              onTradeValueChange={setTradeValue}
              onNetWeightChange={setNetWeight}
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
