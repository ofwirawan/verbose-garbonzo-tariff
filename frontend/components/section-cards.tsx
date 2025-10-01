"use client";

import { IconTrendingDown, IconTrendingUp, IconAlertCircle } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface DashboardStats {
  totalCalculations: number;
  activeTradeRoutes: number;
  suspendedTariffs: number;
  avgTariffRate: number;
  calculationsGrowth: number;
  routesGrowth: number;
  suspensionsChange: number;
  rateChange: number;
}

export function SectionCards() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCalculations: 0,
    activeTradeRoutes: 0,
    suspendedTariffs: 0,
    avgTariffRate: 0,
    calculationsGrowth: 0,
    routesGrowth: 0,
    suspensionsChange: 0,
    rateChange: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        // Simulate API call for now - replace with actual endpoint when available
        setStats({
          totalCalculations: 15847,
          activeTradeRoutes: 342,
          suspendedTariffs: 89,
          avgTariffRate: 8.3,
          calculationsGrowth: 23.5,
          routesGrowth: 12.8,
          suspensionsChange: -5.2,
          rateChange: -2.1,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Calculations</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : stats.totalCalculations.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +{stats.calculationsGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Tariff calculations performed
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Trade Routes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : stats.activeTradeRoutes.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +{stats.routesGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Growing trade network <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Unique country-product pairs analyzed
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Suspended Tariffs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : stats.suspendedTariffs.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              {stats.suspensionsChange > 0 ? "+" : ""}{stats.suspensionsChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Fewer suspensions active <IconAlertCircle className="size-4" />
          </div>
          <div className="text-muted-foreground">Trade agreements with 0% duty</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Avg. Tariff Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : `${stats.avgTariffRate}%`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              {stats.rateChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Rates decreasing globally <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Across all trade routes</div>
        </CardFooter>
      </Card>
    </div>
  )
}
