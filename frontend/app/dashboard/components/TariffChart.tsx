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

import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

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
  initialProductCode = "01-05_Animals",
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

  const [date, setDate] = useState<Date | undefined>(undefined);

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

  // Product code options
  const productOptions = [
    { label: "Live Animals & Animal Products", value: "01-05_Animals" },
    { label: "Vegetable Products", value: "06-14_Vegetables" },
    { label: "Prepared Foodstuffs & Beverages", value: "16-24_Food" },
    { label: "Mineral Products & Fuels", value: "25-27_Minerals" },
    { label: "Chemical Products", value: "28-38_Chemicals" },
    { label: "Plastics & Rubber", value: "39-40_Plastics" },
    { label: "Hides, Skins & Leather", value: "41-43_Leather" },
    { label: "Wood Products", value: "44-46_Wood" },
    { label: "Pulp & Paper", value: "47-49_Paper" },
    { label: "Textiles & Clothing", value: "50-63_Textiles" },
    { label: "Footwear & Headgear", value: "64-67_Footwear" },
    { label: "Stone, Glass & Ceramics", value: "68-70_Stone" },
    { label: "Precious Metals & Stones", value: "71_Precious" },
    { label: "Base Metals", value: "72-83_Metals" },
    { label: "Machinery & Electronics", value: "84-85_Machinery" },
    { label: "Transportation Equipment", value: "86-89_Vehicles" },
    { label: "Optical & Medical Instruments", value: "90-92_Instruments" },
    { label: "Arms & Ammunition", value: "93_Arms" },
    {
      label: "Miscellaneous Manufactured Articles",
      value: "94-96_Miscellaneous",
    },
    { label: "Works of Art & Antiques", value: "97_Art" },
    { label: "Services & Intangibles", value: "98_Services" },
  ];

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
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command
            filter={(value, search) => {
              const country = countryOptions.find(c => c.label === value);
              if (!country) return 0;
              const searchLower = search.toLowerCase();
              const labelMatch = country.label.toLowerCase().includes(searchLower);
              const valueMatch = country.value.toLowerCase().includes(searchLower);
              return labelMatch || valueMatch ? 1 : 0;
            }}
          >
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryOptions.map((country) => (
                  <CommandItem
                    key={country.value}
                    value={country.label}
                    onSelect={() => {
                      onValueChange(country.value === value ? "" : country.value);
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
              <Label className="mb-2 font-medium block">Date of birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) =>
                      d > new Date() || d < new Date("1900-01-01")
                    }
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
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
                Product Category:
              </Label>
              <Select value={productCode} onValueChange={setProductCode}>
                <SelectTrigger id="productCode" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
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
