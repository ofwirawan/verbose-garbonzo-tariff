"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductData {
  product: string;
  calculations: number;
  avgRate: number;
}

export function TopProducts() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Simulated data - replace with actual API call
        setProducts([
          { product: "290110", calculations: 1243, avgRate: 12.5 },
          { product: "847130", calculations: 987, avgRate: 5.2 },
          { product: "854232", calculations: 856, avgRate: 8.9 },
          { product: "271019", calculations: 742, avgRate: 15.3 },
          { product: "870323", calculations: 689, avgRate: 6.7 },
          { product: "392690", calculations: 623, avgRate: 11.2 },
          { product: "732690", calculations: 578, avgRate: 9.4 },
        ]);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const chartConfig = {
    calculations: {
      label: "Calculations",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Top Products by Volume</CardTitle>
        <CardDescription>
          Most frequently calculated products (HS6 codes)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="h-[300px] w-full"
            >
              <BarChart data={products}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="product"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, props) => {
                        const payload = props.payload;
                        return [
                          <div key="content" className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              {value} calculations
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Avg Rate: {payload.avgRate}%
                            </span>
                          </div>,
                          "Volume",
                        ];
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="calculations"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 text-xs text-muted-foreground">
              Products ranked by total calculations performed
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}