"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Demo: Fetches tariff data between countries and renders a line chart.
 */
type TariffDataPoint = {
  year: string;
  tariffRate: number;
  [key: string]: any; // allow extra fields
};

export default function Home() {
  const [data, setData] = useState<TariffDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [importingCountry, setImportingCountry] = useState("USA");
  const [exportingCountry, setExportingCountry] = useState("CHN");
  const [productCode, setProductCode] = useState("01-05_Animals");

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

  // Product code options (matching backend HS code-based classification)
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

  // GraphSkeleton component that matches the ResponsiveContainer dimensions
  const GraphSkeleton = () => (
    <div className="w-full max-w-6xl">
      <div className="w-full h-[400px] border border-gray-200 rounded-lg p-4 bg-white">
        {/* Chart title skeleton */}
        <div className="mb-4">
          <Skeleton className="h-4 w-48 mb-2" />
        </div>

        {/* Y-axis label skeleton */}
        <div className="flex items-start">
          <div className="flex flex-col items-center mr-2">
            <Skeleton className="h-3 w-16 mb-2 rotate-90" />
          </div>

          {/* Main chart area */}
          <div className="flex-1">
            {/* Chart grid skeleton */}
            <div className="relative h-80 border-l-2 border-b-2 border-gray-200">
              {/* Horizontal grid lines */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${(i + 1) * 16}%` }}
                />
              ))}

              {/* Vertical grid lines */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full border-l border-gray-100"
                  style={{ left: `${(i + 1) * 12}%` }}
                />
              ))}

              {/* Y-axis values skeleton */}
              <div className="absolute -left-8 top-0 h-full flex flex-col justify-between py-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-3 w-6" />
                ))}
              </div>
            </div>

            {/* X-axis values skeleton */}
            <div className="flex justify-between mt-2 px-8">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to get the next available country
  const getNextAvailableCountry = (
    currentCountry: string,
    excludeCountry: string
  ): string => {
    const currentIndex = countryOptions.findIndex(
      (option) => option.value === currentCountry
    );

    // Start searching from the next country after current
    for (let i = 1; i < countryOptions.length; i++) {
      const nextIndex = (currentIndex + i) % countryOptions.length;
      const nextCountry = countryOptions[nextIndex].value;

      if (nextCountry !== excludeCountry) {
        return nextCountry;
      }
    }

    // Fallback - should never reach here given we have more than 2 countries
    return countryOptions[0].value;
  };

  // Handler for importing country change
  const handleImportingCountryChange = (selectedCountry: string) => {
    if (selectedCountry === exportingCountry) {
      // If same as exporting country, automatically switch exporting country to next available
      const nextExportingCountry = getNextAvailableCountry(
        exportingCountry,
        selectedCountry
      );
      setExportingCountry(nextExportingCountry);
    }
    setImportingCountry(selectedCountry);
  };

  // Handler for exporting country change
  const handleExportingCountryChange = (selectedCountry: string) => {
    if (selectedCountry === importingCountry) {
      // If same as importing country, automatically switch importing country to next available
      const nextImportingCountry = getNextAvailableCountry(
        importingCountry,
        selectedCountry
      );
      setImportingCountry(nextImportingCountry);
    }
    setExportingCountry(selectedCountry);
  };

  // Generate monthly trend data for the latest available year
  const getMonthlyTrendData = (): TariffDataPoint[] => {
    if (data.length === 0) {
      console.warn("Data is empty. Returning empty trend data.");
      return [];
    }

    // Find latest year
    const years = data
      .map((d) => parseInt(d.year))
      .filter((y) => !isNaN(y));
    if (years.length === 0) {
      console.warn("No valid years found in data. Returning empty trend data.");
      return [];
    }

    const latestYear = Math.max(...years);

    // Find tariff for that year
    const latest = data.find((d) => parseInt(d.year) === latestYear);
    const baseTariff = latest && !isNaN(latest.tariffRate) ? latest.tariffRate : 0;

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Generate monthly data with slight variations
    return months.map((m, index) => {
      const variation = (Math.sin(index / 2) * 0.5) + (Math.random() * 0.2 - 0.1); // Add some variation
      const monthlyTariff = Math.max(0, baseTariff + variation); // Ensure tariff is non-negative
      return {
        month: m,
        year: latestYear.toString(),
        tariffRate: Math.round(monthlyTariff * 100) / 100, // Round to 2 decimal places
      };
    });
  };


  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    const API_URL = `http://localhost:8080/api/tariffs?importingCountry=${importingCountry}&exportingCountry=${exportingCountry}&productCode=${productCode}&year=2020`;
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((json) => {
        // Extract the data array from the response and map to expected format
        if (json.data && Array.isArray(json.data)) {
          const chartData = json.data.map(
            (item: { year: string; tariff: number }) => ({
              year: item.year,
              value: item.tariff, // Map 'tariff' from backend to 'value' for chart
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
  }, [importingCountry, exportingCountry, productCode]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-8">Latest Tariff Trend Graph</h1>
      {/* Tariff Trends Graph */}
      <div className="w-full max-w-6xl mb-12">
        {isLoading && <GraphSkeleton />}
        {hasError && (
          <div className="text-red-500">Failed to fetch monthly trend data.</div>
        )}
        {!isLoading && !hasError && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getMonthlyTrendData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                label={{
                  value: "Tariff Rate (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number | string) => [`${value}%`, "Tariff Rate"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="tariffRate"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>


      <h1 className="text-3xl font-bold mb-8">Tariff Data Analysis</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-4xl">
        {/* Importing Country Selector */}
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
            onChange={(e) => handleImportingCountryChange(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {countryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Exporting Country Selector */}
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
            onChange={(e) => handleExportingCountryChange(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {countryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Product Selector */}
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

      {/* Trade Direction Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-4xl">
        <p className="text-sm text-blue-800">
          <strong>Current Analysis:</strong> Tariff rates that{" "}
          <strong>
            {countryOptions.find((c) => c.value === importingCountry)?.label}
          </strong>{" "}
          applies on imports from{" "}
          <strong>
            {countryOptions.find((c) => c.value === exportingCountry)?.label}
          </strong>{" "}
          for{" "}
          <strong>
            {productOptions.find((p) => p.value === productCode)?.label}
          </strong>
        </p>
      </div>

      {isLoading && <GraphSkeleton />}
      {hasError && (
        <div className="text-red-500">Failed to fetch tariff data.</div>
      )}
      {!isLoading && !hasError && (
        <div className="w-full max-w-6xl">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis
                label={{
                  value: "Tariff Rate (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number | string) => [
                  `${value}%`,
                  "Tariff Rate",
                ]}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
