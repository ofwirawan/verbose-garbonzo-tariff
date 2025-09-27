"use client";

import { useEffect, useState } from "react";
import { fetchCountries } from "../actions/dashboardactions";
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
  iso_code: string;
  name: string;
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

export function TariffChart({
  initialImportingCountry = "USA",
  initialExportingCountry = "CHN",
  initialProductCode = "010121",
  chartTitle = "Tariff Data Analysis",
}: TariffChartProps) {
  const [data, setData] = useState<{ date: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
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

  // Simulation parameters
  const [simBaseRate, setSimBaseRate] = useState<number | undefined>(undefined);
  const [simCountryModifier, setSimCountryModifier] = useState<
    number | undefined
  >(undefined);
  const [simTrend, setSimTrend] = useState<number | undefined>(undefined);

  const [selectedYear, setSelectedYear] = useState<string>("2020");

  // Interface for the tariff calculation result from backend
  interface TariffCalculationResult {
    hs6: string;
    reporter: string;
    partner: string;
    year: number;
    ratePercent: number;
    tradeValue: number;
    duty: number;
    totalPayable: number;
    dataUrl: string;
  }

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
    value: country.iso_code,
  }));

  // Product options with specific HS6 codes - based on WITS API requirements
  const productOptions = [
    // Live Animals & Animal Products
    { label: "Live bovine animals (calves)", value: "010121", hs6: "010121" },
    { label: "Live swine (over 50kg)", value: "010391", hs6: "010391" },

    // Vegetable Products
    { label: "Bulbs, tubers (dormant)", value: "060110", hs6: "060110" },
    { label: "Cut flowers and buds", value: "060310", hs6: "060310" },

    // Food Products
    { label: "Sausages and similar products", value: "160100", hs6: "160100" },
    { label: "Prepared/preserved fish", value: "160414", hs6: "160414" },

    // Mineral Products
    { label: "Salt (sodium chloride)", value: "250100", hs6: "250100" },
    { label: "Iron ores and concentrates", value: "260111", hs6: "260111" },

    // Chemical Products
    { label: "Chlorine", value: "280110", hs6: "280110" },
    { label: "Sulfuric acid", value: "280700", hs6: "280700" },

    // Plastics & Rubber
    {
      label: "Polyethylene (specific gravity < 0.94)",
      value: "390110",
      hs6: "390110",
    },
    { label: "Polystyrene", value: "390310", hs6: "390310" },

    // Leather & Hides
    { label: "Raw hides and skins of bovine", value: "410110", hs6: "410110" },
    { label: "Raw skins of sheep or lambs", value: "410210", hs6: "410210" },

    // Wood Products
    { label: "Fuel wood, in logs", value: "440110", hs6: "440110" },
    { label: "Wood in the rough (oak)", value: "440391", hs6: "440391" },

    // Paper Products
    { label: "Mechanical wood pulp", value: "470100", hs6: "470100" },
    { label: "Newsprint", value: "480100", hs6: "480100" },

    // Textiles
    {
      label: "Silk-worm cocoons suitable for reeling",
      value: "500100",
      hs6: "500100",
    },
    {
      label: "Cotton yarn (85% or more cotton)",
      value: "520511",
      hs6: "520511",
    },

    // Footwear
    {
      label: "Sports footwear with outer soles of rubber",
      value: "640110",
      hs6: "640110",
    },
    { label: "Waterproof footwear", value: "640210", hs6: "640210" },

    // Stone & Glass
    {
      label: "Natural or artificial abrasive powder",
      value: "680100",
      hs6: "680100",
    },
    {
      label: "Float glass and surface ground glass",
      value: "700500",
      hs6: "700500",
    },

    // Precious Metals
    { label: "Natural pearls", value: "710110", hs6: "710110" },
    { label: "Diamonds (unsorted)", value: "710210", hs6: "710210" },

    // Base Metals
    { label: "Pig iron, non-alloy", value: "720110", hs6: "720110" },
    { label: "Copper wire", value: "740819", hs6: "740819" },

    // Machinery & Electronics
    { label: "Electric motors and generators", value: "850220", hs6: "850220" },
    { label: "Nuclear reactors", value: "840110", hs6: "840110" },

    // Transportation
    {
      label: "Motor cars (spark-ignition engine)",
      value: "870321",
      hs6: "870321",
    },
    {
      label: "Rail locomotives powered from external source",
      value: "860110",
      hs6: "860110",
    },

    // Optical & Medical Instruments
    { label: "Optical fibers and bundles", value: "900110", hs6: "900110" },
    { label: "Liquid crystal devices", value: "901380", hs6: "901380" },

    // Arms & Ammunition
    { label: "Military weapons", value: "930100", hs6: "930100" },
    { label: "Shotguns", value: "930320", hs6: "930320" },

    // Miscellaneous
    {
      label: "Seats of a kind used for aircraft",
      value: "940110",
      hs6: "940110",
    },
    { label: "Mattress supports", value: "940421", hs6: "940421" },

    // Art & Antiques
    {
      label: "Paintings, drawings and pastels",
      value: "970100",
      hs6: "970100",
    },
    { label: "Original sculptures", value: "970300", hs6: "970300" },

    // Special Transactions
    {
      label: "Special transactions and commodities",
      value: "980100",
      hs6: "980100",
    },
  ];

  // Function to get HS6 code from product selection
  const getHS6Code = (productValue: string): string => {
    const product = productOptions.find((p) => p.value === productValue);
    return product?.hs6 || "010121"; // Default to first product if not found
  };

  // Fetch data using server actions on mount and set up automatic refresh
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const countriesResult = await fetchCountries();

        // Keep tariffs empty for now (no tariff table to fetch from)
        setTariffs([]);
        setCountries(countriesResult.countries);
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

  // ISO3 to ISO 3166-1 numeric country code mapping
  const countryCodeMapping: { [key: string]: string } = {
    USA: "840", // United States
    CHN: "156", // China
    DEU: "276", // Germany
    JPN: "392", // Japan
    GBR: "826", // United Kingdom
    FRA: "250", // France
    ITA: "380", // Italy
    CAN: "124", // Canada
    AUS: "036", // Australia
    BRA: "076", // Brazil
    IND: "356", // India
    RUS: "643", // Russian Federation
    KOR: "410", // South Korea
    MEX: "484", // Mexico
    ESP: "724", // Spain
    NLD: "528", // Netherlands
    CHE: "756", // Switzerland
    BEL: "056", // Belgium
    SWE: "752", // Sweden
    NOR: "578", // Norway
    AUT: "040", // Austria
    DNK: "208", // Denmark
    FIN: "246", // Finland
    PRT: "620", // Portugal
    GRC: "300", // Greece
    IRL: "372", // Ireland
    POL: "616", // Poland
    TUR: "792", // Turkey
    CZE: "203", // Czech Republic
    HUN: "348", // Hungary
    SVK: "703", // Slovakia
    SVN: "705", // Slovenia
    EST: "233", // Estonia
    LVA: "428", // Latvia
    LTU: "440", // Lithuania
    BGR: "100", // Bulgaria
    ROU: "642", // Romania
    HRV: "191", // Croatia
    SGP: "702", // Singapore
    MYS: "458", // Malaysia
    THA: "764", // Thailand
    IDN: "360", // Indonesia
    PHL: "608", // Philippines
    VNM: "704", // Vietnam
    ARE: "784", // United Arab Emirates
    SAU: "682", // Saudi Arabia
    ISR: "376", // Israel
    EGY: "818", // Egypt
    ZAF: "710", // South Africa
    NGA: "566", // Nigeria
    KEN: "404", // Kenya
    MAR: "504", // Morocco
    TUN: "788", // Tunisia
    DZA: "012", // Algeria
    ARG: "032", // Argentina
    CHL: "152", // Chile
    COL: "170", // Colombia
    PER: "604", // Peru
    URY: "858", // Uruguay
    VEN: "862", // Venezuela
    ECU: "218", // Ecuador
    BOL: "068", // Bolivia
    PRY: "600", // Paraguay
    CRI: "188", // Costa Rica
    PAN: "591", // Panama
    GTM: "320", // Guatemala
    HND: "340", // Honduras
    SLV: "222", // El Salvador
    NIC: "558", // Nicaragua
    DOM: "214", // Dominican Republic
    CUB: "192", // Cuba
    JAM: "388", // Jamaica
    TTO: "780", // Trinidad and Tobago
  };

  // Function to convert ISO3 country code to numeric code
  const getNumericCountryCode = (iso3Code: string): string => {
    return countryCodeMapping[iso3Code] || iso3Code; // Return original if not found
  };

  // Function to calculate tariff using the TariffService
  const calculateTariff = async () => {
    if (!importingCountry || !exportingCountry || !tradeValue) {
      console.error("Missing required fields for tariff calculation");
      return;
    }

    const hs6Code = getHS6Code(productCode);
    const reporterNumeric = getNumericCountryCode(importingCountry);
    const partnerNumeric = getNumericCountryCode(exportingCountry);

    console.log("Starting tariff calculation with:", {
      reporter: `${importingCountry} -> ${reporterNumeric}`,
      partner: `${exportingCountry} -> ${partnerNumeric}`,
      product: `${productCode} -> ${hs6Code}`,
      tradeValue: Number(tradeValue),
    });

    try {
      setHasError(false); // Clear previous errors
      setCalculationResult(null); // Clear previous results

      const requestBody = {
        reporter: reporterNumeric,
        partner: partnerNumeric,
        hs6: hs6Code,
        tradeValue: Number(tradeValue),
        transactionDate: `${selectedYear}-01-01`, // Use selected year
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
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(
          `Tariff calculation failed: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Tariff calculation result:", result);

      // Store the full calculation result
      setCalculationResult(result);

      // Update chart data with the calculated tariff rate
      // Create a meaningful chart display showing the tariff data for the selected year
      // We can expand this to show multiple years or comparisons in the future
      const chartData = [
        {
          date: selectedYear,
          value: Number(result.ratePercent) || 0,
        },
      ];

      setData(chartData);

      // Clear any previous errors since we got a successful response
      setHasError(false);
    } catch (error) {
      console.error("Error calculating tariff:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      setHasError(true);
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
        {isLoading ? (
          <div className="h-[300px] w-full rounded-xl shadow-lg bg-white p-4 flex items-center justify-center">
            {/* Skeleton for chart area */}
            <div className="w-full h-full flex flex-col gap-4">
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
                  />
                }
              />
              <Area
                dataKey="value"
                type="monotone"
                fill="url(#fillTariff)"
                stroke="#000"
                strokeWidth={3}
                dot={{ r: 5, stroke: "#000", strokeWidth: 2, fill: "#fff" }}
                activeDot={{
                  r: 7,
                  fill: "#000",
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
              <Select value={productCode} onValueChange={setProductCode}>
                <SelectTrigger id="productCode" className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {productOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">
                          HS6: {opt.hs6}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={!importingCountry || !exportingCountry || !tradeValue}
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Calculate Tariff
            </Button>
          </div>
        </div>

        {/* Display calculation results */}
        {calculationResult && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              Tariff Calculation Results
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Tariff Rate</div>
                <div className="text-xl font-bold text-blue-600">
                  {calculationResult.ratePercent.toFixed(2)}%
                </div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Trade Value</div>
                <div className="text-xl font-bold">
                  ${calculationResult.tradeValue.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Duty Amount</div>
                <div className="text-xl font-bold text-red-600">
                  ${calculationResult.duty.toFixed(2)}
                </div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Total Payable</div>
                <div className="text-xl font-bold text-green-600">
                  ${calculationResult.totalPayable.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <strong>Product:</strong> {calculationResult.hs6} |
              <strong> Year:</strong> {calculationResult.year} |
              <strong> Reporter:</strong> {calculationResult.reporter} |
              <strong> Partner:</strong> {calculationResult.partner}
            </div>
            {calculationResult.dataUrl && (
              <div className="mt-2">
                <a
                  href={calculationResult.dataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  View WITS Data Source →
                </a>
              </div>
            )}
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
