"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatisticItem {
  label: string;
  value: string | number;
  description: string;
}

export function StatisticsOverview() {
  const [stats, setStats] = useState<StatisticItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simulated data - replace with actual API call
        setStats([
          {
            label: "Total Calculations",
            value: "8,542",
            description: "Tariff calculations performed",
          },
          {
            label: "Countries Tracked",
            value: "195",
            description: "Total countries in database",
          },
          {
            label: "Average Tariff Rate",
            value: "9.8%",
            description: "Mean across all products",
          },
          {
            label: "Product Categories",
            value: "12,847",
            description: "HS6 codes available",
          },
        ]);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="h-12 bg-gray-100 rounded animate-pulse mb-3"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border border-gray-200 bg-white hover:border-gray-400 transition-colors"
        >
          <CardContent className="p-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {stat.label}
              </p>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-black">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
