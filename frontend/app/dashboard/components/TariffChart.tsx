"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import { fetchTopSuspension } from "../actions/dashboardactions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  TariffChartProps,
  DropdownOption,
  ChartDataPoint,
} from "@/app/dashboard/components/utils/types";
import {
  LoadingSkeleton,
  EmptyDataPlaceholder,
  MissingRateWarning,
  Combobox,
} from "./SharedComponents";
import { CalculationResults } from "./ResultComponents";
import { useTariffData, useTariffCalculation } from "./utils/hooks";
import {
  convertCountriesToOptions,
  convertProductsToOptions,
  getChartColorScheme,
  getTooltipBadgeClass,
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
  return (
    <div className="mb-8 w-full space-y-6">
      {/* Transaction Date Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Transaction Date
        </h3>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11",
                  !transactionDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {transactionDate ? (
                  format(transactionDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={transactionDate}
                onSelect={(date) => date && onTransactionDateChange(date)}
                initialFocus
                captionLayout="dropdown"
                startMonth={new Date(1990, 0)}
                endMonth={new Date(new Date().getFullYear() + 1, 11)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Trade Partners Section */}
      <div className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Trade Partners
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="importingCountry" className="text-sm font-medium">
              Importing Country
              <span className="text-xs text-gray-500 ml-1 font-normal">
                (Sets Tariffs)
              </span>
            </Label>
            <Combobox
              value={importingCountry}
              onValueChange={onImportingCountryChange}
              placeholder="Select importing country"
              id="importingCountry"
              options={countryOptions}
              searchPlaceholder="Search importing country..."
              emptyText="No country found."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exportingCountry" className="text-sm font-medium">
              Exporting Country
              <span className="text-xs text-gray-500 ml-1 font-normal">
                (Pays Tariffs)
              </span>
            </Label>
            <Combobox
              value={exportingCountry}
              onValueChange={onExportingCountryChange}
              placeholder="Select exporting country"
              id="exportingCountry"
              options={countryOptions}
              searchPlaceholder="Search exporting country..."
              emptyText="No country found."
            />
          </div>
        </div>
      </div>

      {/* Product & Trade Details Section */}
      <div className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Product & Trade Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-3 lg:col-span-1">
            <Label htmlFor="productCode" className="text-sm font-medium">
              Product (HS6 Code)
            </Label>
            <Combobox
              value={productCode}
              onValueChange={onProductCodeChange}
              placeholder="Select product"
              id="productCode"
              options={productOptions}
              searchPlaceholder="Search product..."
              emptyText="No product found."
              showSecondaryText={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeValue" className="text-sm font-medium">
              Trade Value (USD)
            </Label>
            <Input
              id="tradeValue"
              type="number"
              min="0"
              step="0.01"
              value={tradeValue}
              onChange={(e) => onTradeValueChange(e.target.value)}
              placeholder="Enter trade value"
              className="w-full h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="netWeight" className="text-sm font-medium">
              Net Weight (kg)
              <span className="text-xs text-gray-500 ml-1 font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              id="netWeight"
              type="number"
              min="0"
              step="0.01"
              value={netWeight}
              onChange={(e) => onNetWeightChange(e.target.value)}
              placeholder="For specific duties"
              className="w-full h-11"
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onCalculate}
          disabled={!importingCountry || !tradeValue || isCalculating}
          size="lg"
          className="bg-black text-white px-8 hover:bg-gray-800 disabled:opacity-50 min-w-[180px]"
        >
          {isCalculating ? "Calculating..." : "Calculate Tariff"}
        </Button>
      </div>
    </div>
  );
}

interface TariffChartDisplayProps {
  data: ChartDataPoint[];
  chartConfig: ChartConfig;
  chartColorScheme: {
    fill: string;
    stroke: string;
  };
}

function TariffChartDisplay({
  data,
  chartConfig,
  chartColorScheme,
}: TariffChartDisplayProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full rounded-xl shadow-lg bg-white p-4"
    >
      <AreaChart data={data}>
        <defs>
          <linearGradient id="fillTariff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity={1} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillSuspended" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillPreferential" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9333ea" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#9333ea" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillMFN" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          strokeDasharray="4 4"
          stroke="#e5e7eb"
        />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={16}
          minTickGap={0}
          interval={0}
          padding={{ left: 16, right: 32 }}
          tick={{ fontSize: 14, fill: "#000", fontWeight: 600 }}
          tickFormatter={(value) => value}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => `Year: ${value}`}
              indicator="dot"
              formatter={(value, name, props) => {
                const payload = props.payload;
                const rateType = payload?.rateType || "Unknown";
                const isSuspended = payload?.isSuspended;

                const badgeClass = getTooltipBadgeClass(rateType, isSuspended);

                return [
                  <div key="rate" className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {Number(value).toFixed(2)}%
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${badgeClass}`}
                    >
                      {rateType}
                    </span>
                    {payload?.dutyAmount !== undefined && (
                      <span className="text-xs text-gray-600">
                        Duty: ${Number(payload.dutyAmount).toFixed(2)}
                      </span>
                    )}
                  </div>,
                  "Tariff Rate",
                ];
              }}
            />
          }
        />
        <Area
          dataKey="value"
          type="monotone"
          fill={chartColorScheme.fill}
          stroke={chartColorScheme.stroke}
          strokeWidth={3}
          dot={{
            r: 5,
            stroke: chartColorScheme.stroke,
            strokeWidth: 2,
            fill: "#fff",
          }}
          activeDot={{
            r: 7,
            fill: chartColorScheme.stroke,
            stroke: "#fff",
            strokeWidth: 2,
          }}
          isAnimationActive={true}
          style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
        />
      </AreaChart>
    </ChartContainer>
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
    data,
    isCalculating,
    calculationResult,
    suspensionNote,
    missingRateYears,
    hasError,
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
  const [hasAutoCalculated, setHasAutoCalculated] = useState(false);

  // Derived state
  const countryOptions = convertCountriesToOptions(countries);
  const productOptions = convertProductsToOptions(product);
  const chartColorScheme = getChartColorScheme(data);

  const chartConfig = {
    value: {
      label: "Tariff Rate (%)",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  // Initialize form with top suspension data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        const suspensionResult = await fetchTopSuspension();

        if (suspensionResult.suspension) {
          const { importer_code, product_code, valid_from } =
            suspensionResult.suspension;

          setImportingCountry(importer_code);
          setProductCode(product_code);

          if (valid_from) {
            setTransactionDate(new Date(valid_from));
          }
        }
      } catch (error) {
        console.error("Error fetching top suspension:", error);
      }
    };

    initializeForm();
  }, []);

  // Set default product if current selection is not available
  useEffect(() => {
    if (productOptions.length > 0) {
      const currentProductExists = productOptions.find(
        (opt) => opt.value === productCode
      );
      if (!currentProductExists) {
        console.log(
          "Current product code not found, setting to first available:",
          productOptions[0]
        );
        setProductCode(productOptions[0].value);
      }
    }
  }, [productOptions, productCode]);

  // Auto-calculate on initial load when all data is ready
  useEffect(() => {
    if (
      countries.length > 0 &&
      product.length > 0 &&
      importingCountry &&
      productCode &&
      tradeValue &&
      !data.length &&
      !isCalculating &&
      !hasAutoCalculated
    ) {
      console.log("Auto-calculating tariff on initial load");
      handleCalculate();
      setHasAutoCalculated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    countries,
    product,
    importingCountry,
    productCode,
    tradeValue,
    hasAutoCalculated,
  ]);

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
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>
          <span>
            Tariff rates applied by{" "}
            <strong>
              {countryOptions.find((c) => c.value === importingCountry)?.label}
            </strong>{" "}
            on imports from{" "}
            <strong>
              {countryOptions.find((c) => c.value === exportingCountry)?.label}
            </strong>{" "}
            for{" "}
            <strong>
              {productOptions.find((p) => p.value === productCode)?.label}
            </strong>
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading || isCalculating ? (
          <LoadingSkeleton isCalculating={isCalculating} />
        ) : !data.length ? (
          <EmptyDataPlaceholder />
        ) : (
          <TariffChartDisplay
            data={data}
            chartConfig={chartConfig}
            chartColorScheme={chartColorScheme}
          />
        )}
      </CardContent>

      <CardContent>
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

        <MissingRateWarning missingYears={missingRateYears} />

        {calculationResult && (
          <CalculationResults
            result={calculationResult}
            suspensionNote={suspensionNote}
          />
        )}
      </CardContent>

      {hasError && (
        <div className="text-red-500 text-center py-8">
          Failed to fetch tariff data.
        </div>
      )}
    </Card>
  );
}
