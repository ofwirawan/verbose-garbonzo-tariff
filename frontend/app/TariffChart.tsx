"use client";

import { useEffect, useState } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * TariffChart: Styled like ChartAreaInteractive, shows tariff data as an area chart.
 */
export function TariffChart({
  initialImportingCountry = "USA",
  initialExportingCountry = "CHN",
  initialProductCode = "01-05_Animals",
  chartTitle = "Tariff Data Analysis",
}: {
  initialImportingCountry?: string;
  initialExportingCountry?: string;
  initialProductCode?: string;
  chartTitle?: string;
}) {
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

  // Simulation parameters
  const [simBaseRate, setSimBaseRate] = useState<number | undefined>(undefined);
  const [simCountryModifier, setSimCountryModifier] = useState<
    number | undefined
  >(undefined);
  const [simTrend, setSimTrend] = useState<number | undefined>(undefined);

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

  // Country options
  const countryOptions = [
    { label: "Afghanistan", value: "AFG" },
    { label: "Albania", value: "ALB" },
    { label: "Algeria", value: "DZA" },
    { label: "Andorra", value: "AND" },
    { label: "Angola", value: "AGO" },
    { label: "Antigua and Barbuda", value: "ATG" },
    { label: "Argentina", value: "ARG" },
    { label: "Armenia", value: "ARM" },
    { label: "Australia", value: "AUS" },
    { label: "Austria", value: "AUT" },
    { label: "Azerbaijan", value: "AZE" },
    { label: "Bahamas", value: "BHS" },
    { label: "Bahrain", value: "BHR" },
    { label: "Bangladesh", value: "BGD" },
    { label: "Barbados", value: "BRB" },
    { label: "Belarus", value: "BLR" },
    { label: "Belgium", value: "BEL" },
    { label: "Belize", value: "BLZ" },
    { label: "Benin", value: "BEN" },
    { label: "Bhutan", value: "BTN" },
    { label: "Bolivia", value: "BOL" },
    { label: "Bosnia and Herzegovina", value: "BIH" },
    { label: "Botswana", value: "BWA" },
    { label: "Brazil", value: "BRA" },
    { label: "Brunei", value: "BRN" },
    { label: "Bulgaria", value: "BGR" },
    { label: "Burkina Faso", value: "BFA" },
    { label: "Burundi", value: "BDI" },
    { label: "Cabo Verde", value: "CPV" },
    { label: "Cambodia", value: "KHM" },
    { label: "Cameroon", value: "CMR" },
    { label: "Canada", value: "CAN" },
    { label: "Central African Republic", value: "CAF" },
    { label: "Chad", value: "TCD" },
    { label: "Chile", value: "CHL" },
    { label: "China", value: "CHN" },
    { label: "Colombia", value: "COL" },
    { label: "Comoros", value: "COM" },
    { label: "Congo", value: "COG" },
    { label: "Congo (Democratic Republic)", value: "COD" },
    { label: "Costa Rica", value: "CRI" },
    { label: "Côte d'Ivoire", value: "CIV" },
    { label: "Croatia", value: "HRV" },
    { label: "Cuba", value: "CUB" },
    { label: "Cyprus", value: "CYP" },
    { label: "Czech Republic", value: "CZE" },
    { label: "Denmark", value: "DNK" },
    { label: "Djibouti", value: "DJI" },
    { label: "Dominica", value: "DMA" },
    { label: "Dominican Republic", value: "DOM" },
    { label: "Ecuador", value: "ECU" },
    { label: "Egypt", value: "EGY" },
    { label: "El Salvador", value: "SLV" },
    { label: "Equatorial Guinea", value: "GNQ" },
    { label: "Eritrea", value: "ERI" },
    { label: "Estonia", value: "EST" },
    { label: "Eswatini", value: "SWZ" },
    { label: "Ethiopia", value: "ETH" },
    { label: "Fiji", value: "FJI" },
    { label: "Finland", value: "FIN" },
    { label: "France", value: "FRA" },
    { label: "Gabon", value: "GAB" },
    { label: "Gambia", value: "GMB" },
    { label: "Georgia", value: "GEO" },
    { label: "Germany", value: "DEU" },
    { label: "Ghana", value: "GHA" },
    { label: "Greece", value: "GRC" },
    { label: "Grenada", value: "GRD" },
    { label: "Guatemala", value: "GTM" },
    { label: "Guinea", value: "GIN" },
    { label: "Guinea-Bissau", value: "GNB" },
    { label: "Guyana", value: "GUY" },
    { label: "Haiti", value: "HTI" },
    { label: "Honduras", value: "HND" },
    { label: "Hungary", value: "HUN" },
    { label: "Iceland", value: "ISL" },
    { label: "India", value: "IND" },
    { label: "Indonesia", value: "IDN" },
    { label: "Iran", value: "IRN" },
    { label: "Iraq", value: "IRQ" },
    { label: "Ireland", value: "IRL" },
    { label: "Israel", value: "ISR" },
    { label: "Italy", value: "ITA" },
    { label: "Jamaica", value: "JAM" },
    { label: "Japan", value: "JPN" },
    { label: "Jordan", value: "JOR" },
    { label: "Kazakhstan", value: "KAZ" },
    { label: "Kenya", value: "KEN" },
    { label: "Kiribati", value: "KIR" },
    { label: "Korea (North)", value: "PRK" },
    { label: "Korea (South)", value: "KOR" },
    { label: "Kuwait", value: "KWT" },
    { label: "Kyrgyzstan", value: "KGZ" },
    { label: "Laos", value: "LAO" },
    { label: "Latvia", value: "LVA" },
    { label: "Lebanon", value: "LBN" },
    { label: "Lesotho", value: "LSO" },
    { label: "Liberia", value: "LBR" },
    { label: "Libya", value: "LBY" },
    { label: "Liechtenstein", value: "LIE" },
    { label: "Lithuania", value: "LTU" },
    { label: "Luxembourg", value: "LUX" },
    { label: "Madagascar", value: "MDG" },
    { label: "Malawi", value: "MWI" },
    { label: "Malaysia", value: "MYS" },
    { label: "Maldives", value: "MDV" },
    { label: "Mali", value: "MLI" },
    { label: "Malta", value: "MLT" },
    { label: "Marshall Islands", value: "MHL" },
    { label: "Mauritania", value: "MRT" },
    { label: "Mauritius", value: "MUS" },
    { label: "Mexico", value: "MEX" },
    { label: "Micronesia", value: "FSM" },
    { label: "Moldova", value: "MDA" },
    { label: "Monaco", value: "MCO" },
    { label: "Mongolia", value: "MNG" },
    { label: "Montenegro", value: "MNE" },
    { label: "Morocco", value: "MAR" },
    { label: "Mozambique", value: "MOZ" },
    { label: "Myanmar", value: "MMR" },
    { label: "Namibia", value: "NAM" },
    { label: "Nauru", value: "NRU" },
    { label: "Nepal", value: "NPL" },
    { label: "Netherlands", value: "NLD" },
    { label: "New Zealand", value: "NZL" },
    { label: "Nicaragua", value: "NIC" },
    { label: "Niger", value: "NER" },
    { label: "Nigeria", value: "NGA" },
    { label: "North Macedonia", value: "MKD" },
    { label: "Norway", value: "NOR" },
    { label: "Oman", value: "OMN" },
    { label: "Pakistan", value: "PAK" },
    { label: "Palau", value: "PLW" },
    { label: "Palestine", value: "PSE" },
    { label: "Panama", value: "PAN" },
    { label: "Papua New Guinea", value: "PNG" },
    { label: "Paraguay", value: "PRY" },
    { label: "Peru", value: "PER" },
    { label: "Philippines", value: "PHL" },
    { label: "Poland", value: "POL" },
    { label: "Portugal", value: "PRT" },
    { label: "Qatar", value: "QAT" },
    { label: "Romania", value: "ROU" },
    { label: "Russia", value: "RUS" },
    { label: "Rwanda", value: "RWA" },
    { label: "Saint Kitts and Nevis", value: "KNA" },
    { label: "Saint Lucia", value: "LCA" },
    { label: "Saint Vincent and the Grenadines", value: "VCT" },
    { label: "Samoa", value: "WSM" },
    { label: "San Marino", value: "SMR" },
    { label: "Sao Tome and Principe", value: "STP" },
    { label: "Saudi Arabia", value: "SAU" },
    { label: "Senegal", value: "SEN" },
    { label: "Serbia", value: "SRB" },
    { label: "Seychelles", value: "SYC" },
    { label: "Sierra Leone", value: "SLE" },
    { label: "Singapore", value: "SGP" },
    { label: "Slovakia", value: "SVK" },
    { label: "Slovenia", value: "SVN" },
    { label: "Solomon Islands", value: "SLB" },
    { label: "Somalia", value: "SOM" },
    { label: "South Africa", value: "ZAF" },
    { label: "South Sudan", value: "SSD" },
    { label: "Spain", value: "ESP" },
    { label: "Sri Lanka", value: "LKA" },
    { label: "Sudan", value: "SDN" },
    { label: "Suriname", value: "SUR" },
    { label: "Sweden", value: "SWE" },
    { label: "Switzerland", value: "CHE" },
    { label: "Syria", value: "SYR" },
    { label: "Taiwan", value: "TWN" },
    { label: "Tajikistan", value: "TJK" },
    { label: "Tanzania", value: "TZA" },
    { label: "Thailand", value: "THA" },
    { label: "Timor-Leste", value: "TLS" },
    { label: "Togo", value: "TGO" },
    { label: "Tonga", value: "TON" },
    { label: "Trinidad and Tobago", value: "TTO" },
    { label: "Tunisia", value: "TUN" },
    { label: "Turkey", value: "TUR" },
    { label: "Turkmenistan", value: "TKM" },
    { label: "Tuvalu", value: "TUV" },
    { label: "Uganda", value: "UGA" },
    { label: "Ukraine", value: "UKR" },
    { label: "United Arab Emirates", value: "ARE" },
    { label: "United Kingdom", value: "GBR" },
    { label: "United States", value: "USA" },
    { label: "Uruguay", value: "URY" },
    { label: "Uzbekistan", value: "UZB" },
    { label: "Vanuatu", value: "VUT" },
    { label: "Vatican City", value: "VAT" },
    { label: "Venezuela", value: "VEN" },
    { label: "Vietnam", value: "VNM" },
    { label: "Yemen", value: "YEM" },
    { label: "Zambia", value: "ZMB" },
    { label: "Zimbabwe", value: "ZWE" },
  ];

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

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    // Build simulation query params if present
    const simParams = [
      simBaseRate !== undefined ? `simBaseRate=${simBaseRate}` : "",
      simCountryModifier !== undefined
        ? `simCountryModifier=${simCountryModifier}`
        : "",
      simTrend !== undefined ? `simTrend=${simTrend}` : "",
    ]
      .filter(Boolean)
      .join("&");
    const API_URL = `http://localhost:8080/api/tariffs?importingCountry=${importingCountry}&exportingCountry=${exportingCountry}&productCode=${productCode}&year=2020${
      simParams ? `&${simParams}` : ""
    }`;
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          const chartData = json.data.map(
            (item: { year: string; tariff: number }) => ({
              date: item.year,
              value: item.tariff,
            })
          );
          setData(chartData);
        } else {
          setData([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  }, [
    importingCountry,
    exportingCountry,
    productCode,
    simBaseRate,
    simCountryModifier,
    simTrend,
  ]);

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
      </CardContent>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-4xl">
          <div>
            <label
              htmlFor="importingCountry"
              className="block text-sm font-medium mb-2"
            >
              Importing Country (Sets Tariffs):
            </label>
            <select
              id="importingCountry"
              value={importingCountry}
              onChange={(e) => setImportingCountry(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="exportingCountry"
              className="block text-sm font-medium mb-2"
            >
              Exporting Country (Pays Tariffs):
            </label>
            <select
              id="exportingCountry"
              value={exportingCountry}
              onChange={(e) => setExportingCountry(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="productCode"
              className="block text-sm font-medium mb-2"
            >
              Product Category:
            </label>
            <select
              id="productCode"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {productOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
      {isLoading && (
        <div className="text-center py-8 text-gray-500">Loading chart...</div>
      )}
      {hasError && (
        <div className="text-red-500 text-center py-8">
          Failed to fetch tariff data.
        </div>
      )}
    </Card>
  );
}
