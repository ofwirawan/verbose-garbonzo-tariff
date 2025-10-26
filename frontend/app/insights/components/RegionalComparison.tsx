"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface RegionData {
  region: string;
  avgRate: number;
  totalRoutes: number;
  change: number;
}

export function RegionalComparison() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        // Simulated data - replace with actual API call
        setRegions([
          { region: "Asia-Pacific", avgRate: 9.2, totalRoutes: 145, change: -2.1 },
          { region: "Europe", avgRate: 5.8, totalRoutes: 98, change: -1.5 },
          { region: "North America", avgRate: 7.4, totalRoutes: 67, change: 0.3 },
          { region: "Latin America", avgRate: 12.1, totalRoutes: 52, change: -3.2 },
          { region: "Middle East", avgRate: 8.5, totalRoutes: 34, change: 1.2 },
          { region: "Africa", avgRate: 14.3, totalRoutes: 28, change: -0.8 },
        ]);
      } catch (error) {
        console.error("Error fetching regions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegions();
  }, []);

  const maxRate = Math.max(...regions.map((r) => r.avgRate), 20);

  return (
    <Card className="h-full flex flex-col border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-black">
          Regional Tariff Comparison
        </CardTitle>
        <CardDescription className="text-xs text-gray-600">
          Average tariff rates by geographic region
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {regions.map((region) => (
              <div key={region.region} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-black">
                        {region.region}
                      </span>
                      <span className="text-sm font-bold text-black">
                        {region.avgRate}%
                      </span>
                    </div>
                    <Progress
                      value={(region.avgRate / maxRate) * 100}
                      className="h-2"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {region.totalRoutes} active routes
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          region.change < 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {region.change > 0 ? "+" : ""}
                        {region.change}% vs last period
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
