"use client";

import { useEffect, useState } from "react";
import { fetchCountries, fetchProduct } from "../actions/dashboardactions";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Country {
  country_code: string;
  name: string;
  numeric_code: string;
}

interface Tariff {
  id: string;
  name?: string;
  rate?: number;
  [key: string]: unknown;
}

interface TariffChartProps {
  initialImportingCountry?: string;
  initialExportingCountry?: string;
  initialProductCode?: string;
  chartTitle?: string;
}

// Interface for the tariff calculation result from backend
interface TariffCalculationResult {
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
  suspensionNote?: string;
  suspensionActive?: boolean;
}

export function TariffChart({
  initialImportingCountry = "USA",
  initialExportingCountry = "CHN",
  initialProductCode = "290110",
  chartTitle = "Tariff Data Analysis",
}: TariffChartProps) {
  const [data, setData] = useState<
    {
      date: string;
      value: number;
      rateType?: string;
      isSuspended?: boolean;
      dutyAmount?: number;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [importingCountry, setImportingCountry] = useState(
    initialImportingCountry
  );
  const [exportingCountry, setExportingCountry] = useState(
    initialExportingCountry
  );
  const [productCode, setProductCode] = useState(initialProductCode);
  const [timeRange, setTimeRange] = useState("all");
  const [tradeValue, setTradeValue] = useState("");

  // State for tariffs and countries
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [selectedTariffId, setSelectedTariffId] = useState<string | undefined>(
    undefined
  );
  const [countries, setCountries] = useState<Country[]>([]);
  const [product, setProduct] = useState<
    { hs6code: string; description: string | null }[]
  >([]);

  // Simulation parameters (handled via event listeners)
  const [, setSimBaseRate] = useState<number | undefined>(undefined);
  const [, setSimCountryModifier] = useState<number | undefined>(undefined);
  const [, setSimTrend] = useState<number | undefined>(undefined);

  const [selectedYear, setSelectedYear] = useState<string>("2020");
  const [isCalculating, setIsCalculating] = useState(false);

  const [calculationResult, setCalculationResult] =
    useState<TariffCalculationResult | null>(null);

  // Listen for simulation changes from dashboard panel
  useEffect(() => {
    function handleSimChange(e: CustomEvent) {
      if (e.detail.baseRate !== undefined) setSimBaseRate(e.detail.baseRate);
      if (e.detail.countryModifier !== undefined)
        setSimCountryModifier(e.detail.countryModifier);
      if (e.detail.trend !== undefined) setSimTrend(e.detail.trend);
    }
    window.addEventListener(
      "tariffSimChange",
      handleSimChange as EventListener
    );
    return () =>
      window.removeEventListener(
        "tariffSimChange",
        handleSimChange as EventListener
      );
  }, []);

  // Convert database countries to dropdown options
  const countryOptions = countries.map((country) => ({
    label: country.name,
    value: country.country_code,
  }));

  // Convert database products to dropdown options
  const productOptions = product
    .filter((prod) => prod.description !== null)
    .map((prod) => ({
      label: prod.description!,
      value: prod.hs6code,
    }));

  console.log("Product options:", productOptions);
  console.log("Number of product options:", productOptions.length);

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

  // Function to get HS6 code from product selection
  const getHS6Code = (productValue: string): string => {
    return productValue; // The value itself is already the HS6 code
  };

  // Fetch data using server actions on mount and set up automatic refresh
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const countriesResult = await fetchCountries();
        const productsResult = await fetchProduct();

        console.log("Fetched products:", productsResult.products);
        console.log("Number of products:", productsResult.products.length);

        // Keep tariffs empty for now (no tariff table to fetch from)
        setTariffs([]);
        setCountries(countriesResult.countries);
        setProduct(productsResult.products);
      } catch (error) {
        console.error("Error fetching data:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up automatic refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run on mount

  // Set selected tariff when tariffs are loaded
  useEffect(() => {
    if (tariffs.length > 0 && !selectedTariffId) {
      setSelectedTariffId(tariffs[0].id);
    }
  }, [tariffs, selectedTariffId]);

  // Function to calculate tariff using the TariffService
  const calculateTariff = async () => {
    if (!importingCountry || !exportingCountry || !tradeValue) {
      console.error("Missing required fields for tariff calculation");
      return;
    }

    setIsCalculating(true);
    const hs6Code = getHS6Code(productCode);

    console.log("Starting tariff calculation with:", {
      importerCode: importingCountry,
      exporterCode: exportingCountry,
      hs6: hs6Code,
      tradeOriginal: Number(tradeValue),
    });

    try {
      setHasError(false); // Clear previous errors
      setErrorMessage(""); // Clear previous error message
      setCalculationResult(null); // Clear previous results

      const requestBody = {
        importerCode: importingCountry,
        exporterCode: exportingCountry,
        hs6: hs6Code,
        tradeOriginal: Number(tradeValue),
        transactionDate: `${selectedYear}-01-01`, // Use selected year
        netWeight: null, // Optional field
      };

      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("http://localhost:8080/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        console.error("Response error:", errorMsg);
        setErrorMessage(errorMsg);
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log("Tariff calculation result:", result);

      // Store the full calculation result
      setCalculationResult(result);

      // Determine if this is a suspension case (all rates are null/undefined and duty is 0)
      const dutyAmount =
        Number(result.tradeFinal) - Number(result.tradeOriginal);
      const isSuspended =
        (dutyAmount === 0 &&
        !result.ratePref &&
        !result.rateAdval &&
        !result.rateSpecific) || result.suspensionActive === true || result.suspensionActive === false;

      // Calculate the effective tariff rate and determine rate type
      let effectiveRate = 0;
      let rateType = "No Rate";

      if (result.suspensionActive === true) {
        effectiveRate = 0;
        rateType = "Suspended (Active)";
      } else if (result.suspensionActive === false) {
        effectiveRate = 0;
        rateType = "Suspended (Inactive)";
      } else if (isSuspended) {
        effectiveRate = 0;
        rateType = "Suspended";
      } else if (result.ratePref) {
        effectiveRate = Number(result.ratePref);
        rateType = "Preferential";
      } else if (result.rateAdval) {
        effectiveRate = Number(result.rateAdval);
        rateType = "Ad-valorem";
      } else if (result.rateSpecific) {
        // For specific rates, calculate equivalent percentage
        const specificDuty =
          Number(result.rateSpecific) * (Number(result.netWeight) || 1);
        effectiveRate = (specificDuty / Number(result.tradeOriginal)) * 100;
        rateType = "Specific";
      }

      // Update chart data with enhanced information
      const chartData = [
        {
          date: selectedYear,
          value: effectiveRate,
          rateType: rateType,
          isSuspended: isSuspended,
          dutyAmount: dutyAmount,
        },
      ];

      setData(chartData);
      console.log("Chart data updated:", chartData);

      // Clear any previous errors since we got a successful response
      setHasError(false);
    } catch (error) {
      console.error("Error calculating tariff:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      setHasError(true);
    } finally {
      setIsCalculating(false);
    }
  };

  // Existing chart data fetch logic remains unchanged

  // Filter data by time range (all, 5y, 3y, 1y)
  const filteredData = (() => {
    if (timeRange === "all") return data;
    const years = {
      "5y": 5,
      "3y": 3,
      "1y": 1,
    }[timeRange];
    if (!years) return data;
    const cutoff = String(Number(data[data.length - 1]?.date) - years + 1);
    return data.filter((item) => item.date >= cutoff);
  })();

  const chartConfig = {
    value: {
      label: "Tariff Rate (%)",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  // Determine chart color based on suspension status
  const getChartColor = () => {
    if (data.length > 0 && data[0].isSuspended) {
      const rateType = data[0].rateType;
      if (rateType === "Suspended (Inactive)") {
        return {
          fill: "url(#fillInactive)",
          stroke: "#f59e0b", // Amber/orange for inactive suspension
        };
      }
      return {
        fill: "url(#fillSuspended)",
        stroke: "#10b981", // Green for active suspended
      };
    }
    return {
      fill: "url(#fillTariff)",
      stroke: "#000", // Black for normal tariffs
    };
  };

  // Combobox component for country selection
  function CountryCombobox({
    value,
    onValueChange,
    placeholder,
    id,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    id?: string;
  }) {
    const [open, setOpen] = useState(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? countryOptions.find((country) => country.value === value)?.label
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command
            filter={(value, search) => {
              const country = countryOptions.find((c) => c.label === value);
              if (!country) return 0;
              const searchLower = search.toLowerCase();
              const labelMatch = country.label
                .toLowerCase()
                .includes(searchLower);
              const valueMatch = country.value
                .toLowerCase()
                .includes(searchLower);
              return labelMatch || valueMatch ? 1 : 0;
            }}
          >
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
            />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryOptions.map((country) => (
                  <CommandItem
                    key={country.value}
                    value={country.label}
                    onSelect={() => {
                      onValueChange(
                        country.value === value ? "" : country.value
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === country.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {country.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Combobox component for product selection
  function ProductCombobox({
    value,
    onValueChange,
    placeholder,
    id,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    id?: string;
  }) {
    const [open, setOpen] = useState(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? productOptions.find((product) => product.value === value)?.label
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command
            filter={(value, search) => {
              const product = productOptions.find((p) => p.label === value);
              if (!product) return 0;
              const searchLower = search.toLowerCase();
              const labelMatch = product.label
                .toLowerCase()
                .includes(searchLower);
              const valueMatch = product.value
                .toLowerCase()
                .includes(searchLower);
              return labelMatch || valueMatch ? 1 : 0;
            }}
          >
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
            />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No product found.</CommandEmpty>
              <CommandGroup>
                {productOptions.map((product) => (
                  <CommandItem
                    key={product.value}
                    value={product.label}
                    onSelect={() => {
                      onValueChange(
                        product.value === value ? "" : product.value
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === product.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{product.label}</span>
                      <span className="text-xs text-muted-foreground">
                        HS6: {product.value}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

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
          <div className="h-[300px] w-full rounded-xl shadow-lg bg-white p-4 flex items-center justify-center">
            {/* Skeleton for chart area */}
            <div className="w-full h-full flex flex-col gap-4">
              {isCalculating && (
                <div className="text-center mb-4">
                  <p className="text-gray-600">Calculating tariff data...</p>
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full rounded-xl shadow-lg bg-white p-4"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillTariff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000" stopOpacity={1} />
                  <stop offset="100%" stopColor="#000" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillSuspended" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillInactive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
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

                      return [
                        <div key="rate" className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {isSuspended
                              ? "Suspended (0%)"
                              : `${Number(value).toFixed(2)}%`}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              isSuspended
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
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
                fill={getChartColor().fill}
                stroke={getChartColor().stroke}
                strokeWidth={3}
                dot={{
                  r: 5,
                  stroke: getChartColor().stroke,
                  strokeWidth: 2,
                  fill: "#fff",
                }}
                activeDot={{
                  r: 7,
                  fill: getChartColor().stroke,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                isAnimationActive={true}
                style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardContent>
        <div className="mb-8 w-full">
          <div className="flex flex-col lg:flex-row justify-between items-stretch gap-8 w-full">
            <div className="flex-1 min-w-0">
              <Label className="mb-2 font-medium block">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {Array.from({ length: 25 }, (_, i) => {
                    const year = (2024 - i).toString();
                    return (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="importingCountry" className="mb-2">
                Importing Country (Sets Tariffs):
              </Label>
              <CountryCombobox
                value={importingCountry}
                onValueChange={setImportingCountry}
                placeholder="Select importing country"
                id="importingCountry"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="exportingCountry" className="mb-2">
                Exporting Country (Pays Tariffs):
              </Label>
              <CountryCombobox
                value={exportingCountry}
                onValueChange={setExportingCountry}
                placeholder="Select exporting country"
                id="exportingCountry"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="productCode" className="mb-2">
                Product (HS6 Code):
              </Label>
              <ProductCombobox
                value={productCode}
                onValueChange={setProductCode}
                placeholder="Select product"
                id="productCode"
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
                onChange={(e) => setTradeValue(e.target.value)}
                placeholder="Enter trade value"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <Button
              onClick={calculateTariff}
              disabled={
                !importingCountry ||
                !exportingCountry ||
                !tradeValue ||
                isCalculating
              }
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {isCalculating ? "Calculating..." : "Calculate Tariff"}
            </Button>
          </div>
        </div>

        {/* Display calculation results */}
        {calculationResult && (
          <div
            className={`mt-8 p-6 rounded-lg ${
              calculationResult.suspensionActive === true
                ? "bg-green-50 border-2 border-green-200"
                : calculationResult.suspensionActive === false
                ? "bg-amber-50 border-2 border-amber-200"
                : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">
                Tariff Calculation Results
              </h3>
              {calculationResult.suspensionActive === true && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  🚫 TARIFF SUSPENDED (ACTIVE)
                </span>
              )}
              {calculationResult.suspensionActive === false && (
                <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  ⚠️ TARIFF SUSPENDED (INACTIVE)
                </span>
              )}
            </div>

            {/* Suspension explanation */}
            {calculationResult.suspensionActive === true && (
              <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-400 rounded">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      <strong>Tariff Suspension Active:</strong> This trade
                      relationship has an active tariff suspension, meaning no
                      duties are charged on this product from the specified
                      exporter to importer.
                    </p>
                    {calculationResult.suspensionNote && (
                      <p className="text-sm text-green-600 mt-2 italic">
                        {calculationResult.suspensionNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {calculationResult.suspensionActive === false && (
              <div className="mb-4 p-3 bg-amber-100 border-l-4 border-amber-400 rounded">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      <strong>Historical Suspension Record:</strong> This trade
                      relationship had a tariff suspension in the past, but it is
                      currently inactive or expired. No tariff rate data is available.
                    </p>
                    {calculationResult.suspensionNote && (
                      <p className="text-sm text-amber-600 mt-2 italic">
                        {calculationResult.suspensionNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Applied Rate</div>
                <div
                  className={`text-xl font-bold ${
                    Number(calculationResult.tradeFinal) -
                      Number(calculationResult.tradeOriginal) ===
                      0 &&
                    !calculationResult.ratePref &&
                    !calculationResult.rateAdval &&
                    !calculationResult.rateSpecific
                      ? "text-green-600"
                      : "text-blue-600"
                  }`}
                >
                  {(() => {
                    const dutyAmount =
                      Number(calculationResult.tradeFinal) -
                      Number(calculationResult.tradeOriginal);
                    const isSuspended =
                      dutyAmount === 0 &&
                      !calculationResult.ratePref &&
                      !calculationResult.rateAdval &&
                      !calculationResult.rateSpecific;

                    if (isSuspended) {
                      return "0.00";
                    }

                    const rate =
                      calculationResult.ratePref ||
                      calculationResult.rateAdval ||
                      0;
                    return Number(rate).toFixed(2);
                  })()}
                  %
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {(() => {
                    const dutyAmount =
                      Number(calculationResult.tradeFinal) -
                      Number(calculationResult.tradeOriginal);
                    const isSuspended =
                      dutyAmount === 0 &&
                      !calculationResult.ratePref &&
                      !calculationResult.rateAdval &&
                      !calculationResult.rateSpecific;

                    if (isSuspended) return "Suspended";
                    if (calculationResult.ratePref) return "Preferential";
                    if (calculationResult.rateAdval) return "Ad-valorem";
                    if (calculationResult.rateSpecific) return "Specific";
                    return "Standard";
                  })()}
                </div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">
                  Original Trade Value
                </div>
                <div className="text-xl font-bold">
                  ${Number(calculationResult.tradeOriginal).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Duty Amount</div>
                <div
                  className={`text-xl font-bold ${
                    Number(calculationResult.tradeFinal) -
                      Number(calculationResult.tradeOriginal) ===
                    0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  $
                  {(
                    Number(calculationResult.tradeFinal) -
                    Number(calculationResult.tradeOriginal)
                  ).toFixed(2)}
                </div>
                {Number(calculationResult.tradeFinal) -
                  Number(calculationResult.tradeOriginal) ===
                  0 &&
                  !calculationResult.ratePref &&
                  !calculationResult.rateAdval &&
                  !calculationResult.rateSpecific && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      No duty - Suspended
                    </div>
                  )}
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Final Amount</div>
                <div className="text-xl font-bold text-green-600">
                  ${Number(calculationResult.tradeFinal).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Additional rate details */}
            <div className="mt-4 p-4 bg-white rounded border">
              <h4 className="font-medium mb-2">Rate Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {calculationResult.rateAdval && (
                  <div>
                    <span className="text-gray-500">Ad-valorem Rate:</span>
                    <span className="ml-2 font-medium">
                      {Number(calculationResult.rateAdval).toFixed(2)}%
                    </span>
                  </div>
                )}
                {calculationResult.rateSpecific && (
                  <div>
                    <span className="text-gray-500">Specific Rate:</span>
                    <span className="ml-2 font-medium">
                      ${Number(calculationResult.rateSpecific).toFixed(2)}/kg
                    </span>
                  </div>
                )}
                {calculationResult.ratePref && (
                  <div>
                    <span className="text-gray-500">Preferential Rate:</span>
                    <span className="ml-2 font-medium">
                      {Number(calculationResult.ratePref).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <strong>Product:</strong> {calculationResult.hs6} |
              <strong> Transaction Date:</strong>{" "}
              {calculationResult.transactionDate} |<strong> Importer:</strong>{" "}
              {calculationResult.importerCode} |<strong> Exporter:</strong>{" "}
              {calculationResult.exporterCode || "Not specified"}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <strong>Transaction ID:</strong> {calculationResult.transactionId}
            </div>

            {/* Chart Legend */}
            <div className="mt-4 p-3 bg-white rounded border">
              <h5 className="text-sm font-medium mb-2">Chart Legend:</h5>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-black rounded"></div>
                  <span>Normal Tariff</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Suspended Tariff (0%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Preferential Rate</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {/* Removed old loading text, replaced by skeleton above */}

      {hasError && (
        <div className="text-red-500 text-center py-8">
          Failed to fetch tariff data.
        </div>
      )}
    </Card>
  );
}
