"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComparisonChartProps {
  data: Array<{
    country: string;
    cost: number;
    fill: string;
  }>;
  title?: string;
  description?: string;
}

export function ComparisonChart({
  data,
  title = "Total Landed Cost Comparison",
  description = "Comparison of total cost per source country",
}: ComparisonChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const CustomTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0];
      return (
        <div className="bg-background p-3 border border-border rounded-lg shadow-lg text-foreground">
          <p className="font-semibold text-sm">{data.payload.country}</p>
          <p className="text-sm">
            Cost: ${data.value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0DCD2" />
            <XAxis
              dataKey="country"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12, fill: "#4B4947" }}
            />
            <YAxis
              label={{ value: "Cost (USD)", angle: -90, position: "insideLeft", fill: "#4B4947" }}
              tick={{ fontSize: 12, fill: "#4B4947" }}
              tickFormatter={(value) =>
                `$${(value / 1000).toFixed(0)}k`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="cost" name="Total Landed Cost" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
