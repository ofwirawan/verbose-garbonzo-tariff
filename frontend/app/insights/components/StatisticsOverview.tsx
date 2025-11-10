"use client";

import { useEffect, useState } from "react";
import {
  getTotalCalculations,
  getCountriesCount,
  getAverageTariffRate,
  getTotalProducts,
} from "../utils/actions";

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
        // Fetch real data from database
        const [totalCalc, countries, avgRate, totalProds] = await Promise.all([
          getTotalCalculations(),
          getCountriesCount(),
          getAverageTariffRate(),
          getTotalProducts(),
        ]);

        setStats([
          {
            label: "Total Calculations",
            value: totalCalc.totalCalculations.toLocaleString(),
            description: "Tariff calculations performed",
          },
          {
            label: "Countries Tracked",
            value: countries.countriesCount,
            description: "Total countries in database",
          },
          {
            label: "Average Tariff Rate",
            value: `${avgRate.averageRate}%`,
            description: "Mean across all products",
          },
          {
            label: "Product Categories",
            value: totalProds.totalProducts.toLocaleString(),
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
          <div key={i} className="border border-border p-6 rounded-xl bg-card">
            <div className="h-10 bg-border animate-pulse mb-4 rounded"></div>
            <div className="h-4 bg-border animate-pulse w-3/4 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border border-border bg-card p-6 rounded-xl hover:border-ring transition-colors"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </p>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
