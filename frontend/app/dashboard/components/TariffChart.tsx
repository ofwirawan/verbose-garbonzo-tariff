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
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  filterDataByTimeRange,
  getTooltipBadgeClass,
} from "./utils/service";

interface TariffChartFormProps {
  startDate: Date;
  endDate: Date;
  importingCountry: string;
  exportingCountry: string;
  productCode: string;
  tradeValue: string;
  netWeight: string;
  countryOptions: DropdownOption[];
  productOptions: DropdownOption[];
  isCalculating: boolean;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onImportingCountryChange: (value: string) => void;
  onExportingCountryChange: (value: string) => void;
  onProductCodeChange: (value: string) => void;
  onTradeValueChange: (value: string) => void;
  onNetWeightChange: (value: string) => void;
  onCalculate: () => void;
}

function TariffChartForm({
  startDate,
  endDate,
  importingCountry,
  exportingCountry,
  productCode,
  tradeValue,
  netWeight,
  countryOptions,
  productOptions,
  isCalculating,
  onStartDateChange,
  onEndDateChange,
  onImportingCountryChange,
  onExportingCountryChange,
  onProductCodeChange,
  onTradeValueChange,
  onNetWeightChange,
  onCalculate,
}: TariffChartFormProps) {
  return (
    <div className="mb-8 w-full">
      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-8 w-full">
        <div className="flex-1 min-w-0">
          <Label className="mb-2 font-medium block">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && onStartDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-0">
          <Label className="mb-2 font-medium block">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && onEndDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-0">
          <Label htmlFor="importingCountry" className="mb-2">
            Importing Country (Sets Tariffs):
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

        <div className="flex-1 min-w-0">
          <Label htmlFor="exportingCountry" className="mb-2">
            Exporting Country (Pays Tariffs):
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

        <div className="flex-1 min-w-0">
          <Label htmlFor="productCode" className="mb-2">
            Product (HS6 Code):
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

        <div className="flex-1 min-w-0">
          <Label htmlFor="tradeValue" className="mb-2">
            Trade Value (USD):
          </Label>
          <Input
            id="tradeValue"
            type="number"
            min="0"
            step="0.01"
            value={tradeValue}
            onChange={(e) => onTradeValueChange(e.target.value)}
            placeholder="Enter trade value"
            className="w-full"
          />
        </div>

        <div className="flex-1 min-w-0">
          <Label htmlFor="netWeight" className="mb-2">
            Net Weight (kg):
          </Label>
          <Input
            id="netWeight"
            type="number"
            min="0"
            step="0.01"
            value={netWeight}
            onChange={(e) => onNetWeightChange(e.target.value)}
            placeholder="Optional - for specific duties"
            className="w-full"
          />
          <span className="text-xs text-gray-500 mt-1">
            Required for specific duty calculations
          </span>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <Button
          onClick={onCalculate}
          disabled={!importingCountry || !tradeValue || isCalculating}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
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

// ============================================
// MAIN COMPONENT
// ============================================

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
  const [timeRange, setTimeRange] = useState("all");
  const [tradeValue, setTradeValue] = useState("10000");
  const [netWeight, setNetWeight] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date("2020-01-01"));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [hasAutoCalculated, setHasAutoCalculated] = useState(false);

  // Derived state
  const countryOptions = convertCountriesToOptions(countries);
  const productOptions = convertProductsToOptions(product);
  const filteredData = filterDataByTimeRange(data, timeRange);
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
          const { importer_code, product_code, valid_from, valid_to } =
            suspensionResult.suspension;

          setImportingCountry(importer_code);
          setProductCode(product_code);

          if (valid_from) {
            setStartDate(new Date(valid_from));
          }

          if (valid_to) {
            setEndDate(new Date(valid_to));
          } else {
            setEndDate(new Date());
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
      startDate,
      endDate,
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
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="all">All Years</ToggleGroupItem>
            <ToggleGroupItem value="5y">Last 5 Years</ToggleGroupItem>
            <ToggleGroupItem value="3y">Last 3 Years</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All Years
              </SelectItem>
              <SelectItem value="5y" className="rounded-lg">
                Last 5 Years
              </SelectItem>
              <SelectItem value="3y" className="rounded-lg">
                Last 3 Years
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading || isCalculating ? (
          <LoadingSkeleton isCalculating={isCalculating} />
        ) : !data.length ? (
          <EmptyDataPlaceholder />
        ) : (
          <TariffChartDisplay
            data={filteredData}
            chartConfig={chartConfig}
            chartColorScheme={chartColorScheme}
          />
        )}
      </CardContent>

      <CardContent>
        <TariffChartForm
          startDate={startDate}
          endDate={endDate}
          importingCountry={importingCountry}
          exportingCountry={exportingCountry}
          productCode={productCode}
          tradeValue={tradeValue}
          netWeight={netWeight}
          countryOptions={countryOptions}
          productOptions={productOptions}
          isCalculating={isCalculating}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
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
