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
 * Demo: Fetches sample data from WITS API and renders a line chart.
 * Replace WITS_API_URL and data mapping as needed for your use case.
 */
export default function Home() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [sector, setSector] = useState("NY.GDP.MKTP.CD");

  // Example sector options (WITS indicators)
  const sectorOptions = [
    { label: "GDP (current US$)", value: "NY.GDP.MKTP.CD" },
    {
      label: "Exports of goods and services (current US$)",
      value: "BX.GSR.GNFS.CD",
    },
    {
      label: "Imports of goods and services (current US$)",
      value: "BM.GSR.GNFS.CD",
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    const API_URL = `http://localhost:8080/api/tariffs?sector=${sector}`;
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
  }, [sector]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-6">WITS Data Graph</h1>
      <div className="mb-6">
        <label htmlFor="sector" className="mr-2 font-medium">
          Select Sector:
        </label>
        <select
          id="sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {sectorOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {isLoading && <div className="text-lg">Loading data...</div>}
      {hasError && <div className="text-red-500">Failed to fetch data.</div>}
      {!isLoading && !hasError && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
