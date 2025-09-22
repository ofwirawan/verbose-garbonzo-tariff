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

/**
 * Demo: Fetches tariff data between countries and renders a line chart.
 */
export default function Home() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [importingCountry, setImportingCountry] = useState("USA");
  const [exportingCountry, setExportingCountry] = useState("CHN");
  const [productCode, setProductCode] = useState("999999");

  // Country options
  const countryOptions = [
    { label: "United States", value: "USA" },
    { label: "China", value: "CHN" },
    { label: "European Union", value: "EU" },
    { label: "Japan", value: "JPN" },
    { label: "Canada", value: "CAN" },
    { label: "Mexico", value: "MEX" },
    { label: "United Kingdom", value: "GBR" },
    { label: "Germany", value: "DEU" },
    { label: "France", value: "FRA" },
    { label: "India", value: "IND" },
    { label: "Brazil", value: "BRA" },
    { label: "Australia", value: "AUS" },
    { label: "South Korea", value: "KOR" },
    { label: "World (MFN Rates)", value: "000" },
  ];

  // Product code options
  const productOptions = [
    { label: "Agriculture", value: "01-24_Agriculture" },
    { label: "Minerals", value: "25-26_Minerals" },
    { label: "Chemicals", value: "28-38_Chemicals" },
    { label: "Textiles", value: "50-63_Textiles" },
    { label: "Machinery", value: "84-85_Machinery" },
    { label: "Vehicles", value: "86-89_Vehicles" },
  ];

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
        setData(json);
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

      {isLoading && <div className="text-lg">Loading tariff data...</div>}
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
