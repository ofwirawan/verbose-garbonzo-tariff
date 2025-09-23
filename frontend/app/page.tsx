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
export default function Home() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [importingCountry, setImportingCountry] = useState("USA");
  const [exportingCountry, setExportingCountry] = useState("CHN");
  const [productCode, setProductCode] = useState("01-24_Agriculture");

  // Country options
  const countryOptions = [
    { label: "United States", value: "USA" },
    { label: "China", value: "CHN" },
    { label: "Germany", value: "DEU" },
    { label: "Japan", value: "JPN" },
    { label: "United Kingdom", value: "GBR" },
    { label: "France", value: "FRA" },
    { label: "India", value: "IND" },
    { label: "Brazil", value: "BRA" },
    { label: "Canada", value: "CAN" },
    { label: "Australia", value: "AUS" },
  ];

  // Product code options (matching backend WITS categorical codes)
  const productOptions = [
    { label: "Agriculture", value: "01-24_Agriculture" },
    { label: "Minerals", value: "25-26_Minerals" },
    { label: "Chemicals", value: "28-38_Chemicals" },
    { label: "Plastics & Rubbers", value: "39-40_Plastics" },
    { label: "Leather Products", value: "41-43_Leather" },
    { label: "Wood & Paper", value: "44-49_Wood" },
    { label: "Textiles & Clothing", value: "50-63_Textiles" },
    { label: "Footwear & Headgear", value: "64-67_Footwear" },
    { label: "Machinery & Electrical", value: "84-85_Machinery" },
    { label: "Vehicles & Transportation", value: "86-89_Vehicles" },
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
