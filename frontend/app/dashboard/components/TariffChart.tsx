"use client";

import { useEffect, useState } from "react";
import {
  fetchCountries,
  fetchProduct,
  fetchTopSuspension,
  fetchSuspensionsByProduct,
  fetchSuspensionNote,
} from "../actions/dashboardactions";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

export function TariffChart({
  initialImportingCountry = "",
  initialExportingCountry = "",
  initialProductCode = "",
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
  const [missingRateYears, setMissingRateYears] = useState<
    { year: number; reason: string }[]
  >([]);
  const [importingCountry, setImportingCountry] = useState(
    initialImportingCountry
  );
  const [exportingCountry, setExportingCountry] = useState(
    initialExportingCountry
  );
  const [productCode, setProductCode] = useState(initialProductCode);
  const [timeRange, setTimeRange] = useState("all");
  const [tradeValue, setTradeValue] = useState("10000");

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

  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>("2020");
  const [selectedEndYear, setSelectedEndYear] = useState<string>(currentYear);
  const [isCalculating, setIsCalculating] = useState(false);

  const [calculationResult, setCalculationResult] =
    useState<TariffCalculationResult | null>(null);
  const [suspensionNote, setSuspensionNote] = useState<string | null>(null);
  const [hasAutoCalculated, setHasAutoCalculated] = useState(false);

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

  // Set default product if current selection is not available and trigger initial calculation
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

  // Auto-calculate on initial load when all data is ready (only once)
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
      calculateTariff();
      setHasAutoCalculated(true);
    }
  }, [
    countries,
    product,
    importingCountry,
    productCode,
    tradeValue,
    hasAutoCalculated,
  ]);

  // Function to get HS6 code from product selection
  const getHS6Code = (productValue: string): string => {
    return productValue; // The value itself is already the HS6 code
  };

  // Fetch data using server actions on mount and set up automatic refresh
  useEffect(() => {
    const fetchData = async (isInitialLoad = false) => {
      try {
        setIsLoading(true);
        setHasError(false);

        const countriesResult = await fetchCountries();
        const productsResult = await fetchProduct();
        const suspensionResult = await fetchTopSuspension();

        console.log("Fetched products:", productsResult.products);
        console.log("Number of products:", productsResult.products.length);
        console.log("Top suspension:", suspensionResult.suspension);

        // Keep tariffs empty for now (no tariff table to fetch from)
        setTariffs([]);
        setCountries(countriesResult.countries);
        setProduct(productsResult.products);

        // Set initial values from top suspension ONLY on first load
        if (isInitialLoad && suspensionResult.suspension) {
          const { importer_code, product_code, valid_from, valid_to } =
            suspensionResult.suspension;

          setImportingCountry(importer_code);
          setProductCode(product_code);

          // Set start and end years from valid_from and valid_to
          if (valid_from) {
            const startYear = new Date(valid_from).getFullYear().toString();
            setSelectedYear(startYear);
          }

          if (valid_to) {
            const endYear = new Date(valid_to).getFullYear().toString();
            setSelectedEndYear(endYear);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch with flag to set initial values
    fetchData(true);

    // Set up automatic refresh every 30 seconds (without resetting form values)
    const interval = setInterval(() => fetchData(false), 30000);
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
    if (!importingCountry || !tradeValue) {
      console.error("Missing required fields for tariff calculation");
      return;
    }

    setIsCalculating(true);
    const hs6Code = getHS6Code(productCode);

    const startYear = Number(selectedYear);
    const endYear = Number(selectedEndYear);

    console.log("Starting tariff calculation with:", {
      importerCode: importingCountry,
      exporterCode: exportingCountry,
      hs6: hs6Code,
      tradeOriginal: Number(tradeValue),
      yearRange: `${startYear} to ${endYear}`,
    });

    try {
      setHasError(false);
      setErrorMessage("");
      setCalculationResult(null);
      setMissingRateYears([]);

      // Fetch suspension data to get accurate valid_from dates
      const suspensionData = await fetchSuspensionsByProduct(
        importingCountry,
        hs6Code,
        startYear,
        endYear
      );

      // Create a map of year -> best date to use
      const yearDateMap: Record<number, string> = {};

      for (let year = startYear; year <= endYear; year++) {
        // Check if there's a suspension that starts in this year
        const suspensionInYear = suspensionData.suspensions.find((susp) => {
          const validFrom = new Date(susp.valid_from);
          return validFrom.getFullYear() === year;
        });

        if (suspensionInYear) {
          // Use the valid_from date directly
          yearDateMap[year] = new Date(suspensionInYear.valid_from)
            .toISOString()
            .split("T")[0];
        } else {
          // Check if there's an active suspension that covers this year
          const activeSuspension = suspensionData.suspensions.find((susp) => {
            const validFrom = new Date(susp.valid_from);
            const validTo = susp.valid_to ? new Date(susp.valid_to) : null;
            const yearStart = new Date(`${year}-01-01`);
            const yearEnd = new Date(`${year}-12-31`);

            return validFrom <= yearEnd && (!validTo || validTo >= yearStart);
          });

          if (activeSuspension) {
            // Use a date within the suspension period for this year
            const validFrom = new Date(activeSuspension.valid_from);
            const validTo = activeSuspension.valid_to
              ? new Date(activeSuspension.valid_to)
              : null;
            const yearStart = new Date(`${year}-01-01`);
            const yearEnd = new Date(`${year}-12-31`);

            // Use the later of (validFrom, yearStart)
            const useDate = validFrom > yearStart ? validFrom : yearStart;
            yearDateMap[year] = useDate.toISOString().split("T")[0];
          } else {
            // No suspension, use mid-year
            yearDateMap[year] = `${year}-07-01`;
          }
        }
      }

      const allChartData = [];
      let lastResult = null;
      const failedYears: { year: number; reason: string }[] = [];

      // Calculate tariff for each year in the range
      for (let year = startYear; year <= endYear; year++) {
        const transactionDate = yearDateMap[year];

        const requestBody = {
          importerCode: importingCountry,
          exporterCode: exportingCountry || null, // null means to-the-world
          hs6: hs6Code,
          tradeOriginal: Number(tradeValue),
          transactionDate: transactionDate,
          netWeight: null,
        };

        const response = await fetch("http://localhost:8080/api/calculate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg =
            errorData?.message || errorData?.error || `HTTP ${response.status}`;
          console.error(`Response error for year ${year}:`, errorMsg);

          // Track failed years with reason
          failedYears.push({
            year: year,
            reason: errorMsg,
          });

          // Continue to next year instead of failing completely
          continue;
        }

        const result = await response.json();
        lastResult = result; // Store the last successful result

        // Calculate effective rate and rate type
        const dutyAmount =
          Number(result.tradeFinal) - Number(result.tradeOriginal);

        // Check appliedRate JSON to determine source
        const appliedRate = result.appliedRate || {};
        const hasSuspension = appliedRate.suspension !== undefined;
        const hasPrefAdval = appliedRate.prefAdval !== undefined;
        const hasMfnAdval = appliedRate.mfnAdval !== undefined;
        const hasSpecific = appliedRate.specific !== undefined;

        let effectiveRate = 0;
        let rateType = "No Rate";
        let isSuspended = false;

        if (hasSuspension) {
          // Suspension rate found
          effectiveRate = Number(appliedRate.suspension);
          rateType = effectiveRate === 0 ? "Suspended (0%)" : "Suspended";
          isSuspended = true;
        } else if (hasPrefAdval) {
          // Preferential rate found
          effectiveRate = Number(appliedRate.prefAdval);
          rateType = "Preferential";
        } else if (hasMfnAdval && hasSpecific) {
          // Compound rate (ad-valorem + specific)
          effectiveRate = Number(appliedRate.mfnAdval);
          rateType = "Compound (MFN+Specific)";
        } else if (hasMfnAdval) {
          // MFN ad-valorem rate
          effectiveRate = Number(appliedRate.mfnAdval);
          rateType = "MFN (Ad-valorem)";
        } else if (hasSpecific) {
          // Specific duty only
          const specificDuty =
            Number(appliedRate.specific) * (Number(result.netWeight) || 1);
          effectiveRate = (specificDuty / Number(result.tradeOriginal)) * 100;
          rateType = "Specific Duty";
        }

        allChartData.push({
          date: year.toString(),
          value: effectiveRate,
          rateType: rateType,
          isSuspended: isSuspended,
          dutyAmount: dutyAmount,
        });
      }

      // Store the last calculation result for display
      if (lastResult) {
        setCalculationResult(lastResult);

        // Fetch suspension note for the last successful result
        try {
          const noteResult = await fetchSuspensionNote(
            importingCountry,
            hs6Code,
            lastResult.transactionDate
          );
          setSuspensionNote(noteResult.suspensionNote);
        } catch (error) {
          console.error("Error fetching suspension note:", error);
          setSuspensionNote(null);
        }
      }

      setData(allChartData);
      console.log("Chart data updated:", allChartData);
      setMissingRateYears(failedYears);
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

  // Determine chart color based on rate type
  const getChartColor = () => {
    if (data.length > 0) {
      const rateType = data[0].rateType;

      if (rateType?.includes("Suspended")) {
        return {
          fill: "url(#fillSuspended)",
          stroke: "#10b981", // Green for suspended
        };
      }
      if (rateType === "Preferential") {
        return {
          fill: "url(#fillPreferential)",
          stroke: "#9333ea", // Purple for preferential
        };
      }
      if (rateType?.includes("MFN") || rateType?.includes("Compound")) {
        return {
          fill: "url(#fillMFN)",
          stroke: "#3b82f6", // Blue for MFN
        };
      }
    }
    return {
      fill: "url(#fillTariff)",
      stroke: "#000", // Black for standard
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
                  <p className="text-muted-foreground">
                    Calculating tariff data...
                  </p>
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
        ) : !data.length ? (
          <div className="h-[300px] w-full rounded-xl shadow-lg bg-white p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No data available</p>
              <p className="text-sm text-muted-foreground">
                Select countries, product, and trade value, then click Calculate
                Tariff
              </p>
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
                <linearGradient
                  id="fillPreferential"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
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

                      // Determine badge color based on rate type
                      let badgeClass = "bg-gray-100 text-gray-700";
                      if (isSuspended || rateType?.includes("Suspended")) {
                        badgeClass = "bg-green-100 text-green-700";
                      } else if (rateType === "Preferential") {
                        badgeClass = "bg-purple-100 text-purple-700";
                      } else if (rateType?.includes("MFN")) {
                        badgeClass = "bg-blue-100 text-blue-700";
                      }

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
              <Label className="mb-2 font-medium block">Start Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select start year" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {Array.from({ length: 25 }, (_, i) => {
                    const year = (Number(currentYear) - i).toString();
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
              <Label className="mb-2 font-medium block">End Year</Label>
              <Select
                value={selectedEndYear}
                onValueChange={setSelectedEndYear}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select end year" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {Array.from({ length: 25 }, (_, i) => {
                    const year = (Number(currentYear) - i).toString();
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
              disabled={!importingCountry || !tradeValue || isCalculating}
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {isCalculating ? "Calculating..." : "Calculate Tariff"}
            </Button>
          </div>
        </div>

        {/* Display missing rate warnings */}
        {missingRateYears.length > 0 && (
          <Alert variant="warning" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing Tariff Data</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Tariff rates could not be found for the following year(s):
              </p>
              <ul className="list-disc list-inside space-y-1">
                {missingRateYears.map((item) => (
                  <li key={item.year}>
                    <strong>{item.year}</strong>: {item.reason}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                This typically means no applicable tariff rate (MFN,
                preferential, or suspension) exists in the database for this
                product and country combination on the query date.
              </p>
            </AlertDescription>
          </Alert>
        )}

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
                      relationship had a tariff suspension in the past, but it
                      is currently inactive or expired. No tariff rate data is
                      available.
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
                  className={`text-xl font-bold ${(() => {
                    const appliedRate = calculationResult.appliedRate || {};
                    if (appliedRate.suspension !== undefined)
                      return "text-green-600";
                    if (appliedRate.prefAdval !== undefined)
                      return "text-purple-600";
                    return "text-blue-600";
                  })()}`}
                >
                  {(() => {
                    const appliedRate = calculationResult.appliedRate || {};

                    if (appliedRate.suspension !== undefined) {
                      return Number(appliedRate.suspension).toFixed(2);
                    }
                    if (appliedRate.prefAdval !== undefined) {
                      return Number(appliedRate.prefAdval).toFixed(2);
                    }
                    if (appliedRate.mfnAdval !== undefined) {
                      return Number(appliedRate.mfnAdval).toFixed(2);
                    }
                    if (appliedRate.specific !== undefined) {
                      const specificDuty =
                        Number(appliedRate.specific) *
                        (Number(calculationResult.netWeight) || 1);
                      return (
                        (specificDuty /
                          Number(calculationResult.tradeOriginal)) *
                        100
                      ).toFixed(2);
                    }
                    return "0.00";
                  })()}
                  %
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {(() => {
                    const appliedRate = calculationResult.appliedRate || {};

                    if (appliedRate.suspension !== undefined)
                      return "Suspended";
                    if (appliedRate.prefAdval !== undefined)
                      return "Preferential (FTA)";
                    if (
                      appliedRate.mfnAdval !== undefined &&
                      appliedRate.specific !== undefined
                    )
                      return "📊 Compound (MFN+Specific)";
                    if (appliedRate.mfnAdval !== undefined)
                      return "🌐 MFN (Standard)";
                    if (appliedRate.specific !== undefined)
                      return "⚖️ Specific Duty";
                    return "No Rate";
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
                  ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {(() => {
                  const dutyAmount =
                    Number(calculationResult.tradeFinal) -
                    Number(calculationResult.tradeOriginal);
                  const appliedRate = calculationResult.appliedRate || {};

                  if (
                    dutyAmount === 0 &&
                    appliedRate.suspension !== undefined
                  ) {
                    return (
                      <div className="text-xs text-green-600 mt-1 font-medium">
                        No duty - Suspended
                      </div>
                    );
                  }
                  if (dutyAmount === 0 && appliedRate.prefAdval !== undefined) {
                    return (
                      <div className="text-xs text-purple-600 mt-1 font-medium">
                        No duty - FTA
                      </div>
                    );
                  }
                  if (dutyAmount > 0 && appliedRate.prefAdval !== undefined) {
                    return (
                      <div className="text-xs text-purple-600 mt-1 font-medium">
                        Reduced - FTA
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Final Amount</div>
                <div className="text-xl font-bold text-green-600">
                  ${Number(calculationResult.tradeFinal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Additional rate details */}
            <div className="mt-4 p-4 bg-white rounded border">
              <h4 className="font-medium mb-2">Rate Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {(() => {
                  const appliedRate = calculationResult.appliedRate || {};
                  return (
                    <>
                      {appliedRate.suspension !== undefined && (
                        <div className="bg-green-50 p-3 rounded">
                          <span className="text-gray-700 font-medium">
                            🚫 Suspension Rate:
                          </span>
                          <span className="ml-2 font-bold text-green-700">
                            {Number(appliedRate.suspension).toFixed(2)}%
                          </span>
                          <div className="text-xs text-gray-600 mt-1">
                            Tariff suspended
                          </div>
                        </div>
                      )}
                      {appliedRate.prefAdval !== undefined && (
                        <div className="bg-purple-50 p-3 rounded">
                          <span className="text-gray-700 font-medium">
                            Preferential Rate:
                          </span>
                          <span className="ml-2 font-bold text-purple-700">
                            {Number(appliedRate.prefAdval).toFixed(2)}%
                          </span>
                          <div className="text-xs text-gray-600 mt-1">
                            From trade agreement between{" "}
                            {calculationResult.importerCode} and{" "}
                            {calculationResult.exporterCode}
                          </div>
                        </div>
                      )}
                      {appliedRate.mfnAdval !== undefined && (
                        <div className="bg-blue-50 p-3 rounded">
                          <span className="text-gray-700 font-medium">
                            🌐 MFN Ad-valorem:
                          </span>
                          <span className="ml-2 font-bold text-blue-700">
                            {Number(appliedRate.mfnAdval).toFixed(2)}%
                          </span>
                          <div className="text-xs text-gray-600 mt-1">
                            Standard MFN rate
                          </div>
                        </div>
                      )}
                      {appliedRate.specific !== undefined && (
                        <div className="bg-amber-50 p-3 rounded">
                          <span className="text-gray-700 font-medium">
                            ⚖️ Specific Duty:
                          </span>
                          <span className="ml-2 font-bold text-amber-700">
                            ${Number(appliedRate.specific).toFixed(2)}/kg
                          </span>
                          <div className="text-xs text-gray-600 mt-1">
                            Per kilogram rate
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {suspensionNote && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-gray-500">Suspension Note:</span>
                  <p className="mt-1 text-gray-700 italic">{suspensionNote}</p>
                </div>
              )}
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
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span> Suspended (0%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  <span> Preferential (FTA)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span> MFN (Standard)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-black rounded"></div>
                  <span>Other Tariff</span>
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
