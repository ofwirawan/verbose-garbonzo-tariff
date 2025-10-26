"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";
import { getTopProducts, getCalculationTrends } from "../utils/actions";

interface ProductInsight {
  product: string;
  calculations: number;
  avgRate?: number;
  description?: string;
}

interface TrendData {
  month: string;
  calculations: number;
}

export function TariffInsights() {
  const [topProducts, setTopProducts] = useState<ProductInsight[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Fetch real data from database
        const [productsData, trendsData] = await Promise.all([
          getTopProducts(6),
          getCalculationTrends(),
        ]);

        setTopProducts(productsData.topProducts);
        setTrends(trendsData.trends);
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-200 bg-white rounded-xl">
          <div className="p-6 border-b border-gray-200">
            <div className="h-6 bg-gray-200 animate-pulse mb-2 w-40 rounded"></div>
            <div className="h-4 bg-gray-200 animate-pulse w-60 rounded"></div>
          </div>
          <div className="p-6">
            <div className="h-80 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="border border-gray-200 bg-white rounded-xl">
          <div className="p-6 border-b border-gray-200">
            <div className="h-6 bg-gray-200 animate-pulse mb-2 w-40 rounded"></div>
            <div className="h-4 bg-gray-200 animate-pulse w-60 rounded"></div>
          </div>
          <div className="p-6">
            <div className="h-80 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Products Chart */}
      <div className="border border-gray-200 bg-white rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
          <p className="text-xs text-gray-600 mt-1">Most frequently calculated HS6 codes</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="product"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
                cursor={{ fill: "#f3f4f6" }}
              />
              <Bar
                dataKey="calculations"
                fill="#000000"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <p className="text-xs text-gray-600">
              Products ranked by total calculations performed
            </p>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="border border-gray-200 bg-white rounded-xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Calculation Trends</h2>
          <p className="text-xs text-gray-600 mt-1">Monthly calculation volume over time</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Line
                type="monotone"
                dataKey="calculations"
                stroke="#000000"
                strokeWidth={2}
                dot={{ fill: "#000000", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <p className="text-xs text-gray-600">
              Steady growth in tariff calculation requests
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
