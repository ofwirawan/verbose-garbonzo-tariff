"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  CartesianAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";

interface ProductInsight {
  product: string;
  calculations: number;
  avgRate: number;
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
        // Simulated data - replace with actual API calls
        setTopProducts([
          { product: "290110", calculations: 1243, avgRate: 12.5 },
          { product: "847130", calculations: 987, avgRate: 5.2 },
          { product: "854232", calculations: 856, avgRate: 8.9 },
          { product: "271019", calculations: 742, avgRate: 15.3 },
          { product: "870323", calculations: 689, avgRate: 6.7 },
          { product: "392690", calculations: 623, avgRate: 11.2 },
        ]);

        setTrends([
          { month: "Jan", calculations: 620 },
          { month: "Feb", calculations: 745 },
          { month: "Mar", calculations: 890 },
          { month: "Apr", calculations: 1023 },
          { month: "May", calculations: 1156 },
          { month: "Jun", calculations: 1243 },
          { month: "Jul", calculations: 1089 },
          { month: "Aug", calculations: 1312 },
          { month: "Sep", calculations: 1428 },
          { month: "Oct", calculations: 1542 },
        ]);
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
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Products Chart */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-black">
            Top Products
          </CardTitle>
          <CardDescription className="text-xs text-gray-600">
            Most frequently calculated HS6 codes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
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
            <p className="text-xs text-gray-500">
              Products ranked by total calculations performed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trends Chart */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-black">
            Calculation Trends
          </CardTitle>
          <CardDescription className="text-xs text-gray-600">
            Monthly calculation volume over time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
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
            <p className="text-xs text-gray-500">
              Steady growth in tariff calculation requests
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
