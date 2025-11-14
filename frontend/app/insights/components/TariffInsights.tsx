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

        console.log("Products data:", productsData);
        console.log("Trends data:", trendsData);

        setTopProducts(productsData.topProducts || []);
        setTrends(trendsData.trends || []);
      } catch (error) {
        console.error("Error fetching insights:", error);
        // Set empty arrays on error to prevent undefined issues
        setTopProducts([]);
        setTrends([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card rounded-xl">
          <div className="p-6 border-b border-border">
            <div className="h-6 bg-muted animate-pulse mb-2 w-40 rounded"></div>
            <div className="h-4 bg-muted animate-pulse w-60 rounded"></div>
          </div>
          <div className="p-6">
            <div className="h-80 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        <div className="border border-border bg-card rounded-xl">
          <div className="p-6 border-b border-border">
            <div className="h-6 bg-muted animate-pulse mb-2 w-40 rounded"></div>
            <div className="h-4 bg-muted animate-pulse w-60 rounded"></div>
          </div>
          <div className="p-6">
            <div className="h-80 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Products Chart */}
      <div className="border border-border bg-card rounded-xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Top Products</h2>
          <p className="text-xs text-muted-foreground mt-1">Most frequently calculated HS6 codes</p>
        </div>
        <div className="p-6">
          {topProducts && topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="product"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: "12px" }}
                />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                  }}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar
                  dataKey="calculations"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No product data available</p>
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              Products ranked by total calculations performed
            </p>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="border border-border bg-card rounded-xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Calculation Trends</h2>
          <p className="text-xs text-muted-foreground mt-1">Monthly calculation volume over time</p>
        </div>
        <div className="p-6">
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: "12px" }}
                />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="calculations"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ fill: "var(--chart-1)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No trend data available</p>
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              Steady growth in tariff calculation requests
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
