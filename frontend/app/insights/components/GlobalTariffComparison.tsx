"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";
import { getGlobalTariffRates } from "../utils/actions";

interface TariffData {
  country: string;
  rate: number;
  name: string;
}

export function GlobalTariffComparison() {
  const [data, setData] = useState<TariffData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const fetch = async () => {
      try {
        console.log("=== Starting Tariff Fetch ===");
        setDebugInfo("Fetching tariff data...");

        const { globalTariffs } = await getGlobalTariffRates();
        console.log("Global tariffs received:", globalTariffs);
        console.log("Data count:", globalTariffs.length);

        setData(globalTariffs);
        setDebugInfo(`Loaded ${globalTariffs.length} countries`);
      } catch (error) {
        console.error("Error fetching global tariff data:", error);
        setDebugInfo(`Error: ${error}`);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="border border-gray-200 bg-white rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 animate-pulse mb-2 w-40 rounded"></div>
          <div className="h-4 bg-gray-200 animate-pulse w-60 rounded"></div>
        </div>
        <div className="p-6">
          <div className="h-80 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white rounded-xl">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Global Tariff Comparison</h2>
        <p className="text-xs text-gray-600 mt-1">Average tariff rates by country (WITS Data)</p>
      </div>
      <div className="p-6">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-gray-700">
            <div className="text-center">
              <p className="text-sm">No tariff data available</p>
              <p className="text-xs text-gray-600 mt-2">{debugInfo}</p>
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="country"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                  label={{ value: "Average Rate (%)", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                  }}
                  cursor={{ fill: "#f3f4f6" }}
                  formatter={(value) => `${value}%`}
                />
                <Bar
                  dataKey="rate"
                  fill="#000000"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <p className="text-xs text-gray-600">
                {debugInfo}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
