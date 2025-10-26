"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Calculation {
  id: string;
  date: string;
  importer: string;
  exporter: string;
  product: string;
  rate: number;
  type: string;
  status: "suspended" | "active" | "preferential";
}

export function RecentCalculations() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        // Simulated data - replace with actual API call
        setCalculations([
          {
            id: "1",
            date: "2025-09-30",
            importer: "USA",
            exporter: "CHN",
            product: "290110",
            rate: 15.5,
            type: "Ad-valorem",
            status: "active",
          },
          {
            id: "2",
            date: "2025-09-30",
            importer: "DEU",
            exporter: "FRA",
            product: "847130",
            rate: 0,
            type: "Suspended",
            status: "suspended",
          },
          {
            id: "3",
            date: "2025-09-29",
            importer: "JPN",
            exporter: "KOR",
            product: "854232",
            rate: 3.2,
            type: "Preferential",
            status: "preferential",
          },
          {
            id: "4",
            date: "2025-09-29",
            importer: "GBR",
            exporter: "USA",
            product: "271019",
            rate: 8.7,
            type: "Ad-valorem",
            status: "active",
          },
          {
            id: "5",
            date: "2025-09-29",
            importer: "CAN",
            exporter: "MEX",
            product: "870323",
            rate: 0,
            type: "Suspended",
            status: "suspended",
          },
        ]);
      } catch (error) {
        console.error("Error fetching calculations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculations();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "suspended":
        return (
          <Badge
            variant="outline"
            className="border-black text-black bg-white"
          >
            Suspended
          </Badge>
        );
      case "preferential":
        return (
          <Badge
            variant="outline"
            className="border-black text-black bg-white"
          >
            Preferential
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-black text-black bg-white"
          >
            Active
          </Badge>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-black">
          Recent Calculations
        </CardTitle>
        <CardDescription className="text-xs text-gray-600">
          Latest tariff calculations performed on the system
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="text-xs font-semibold text-black">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-black">
                    Route
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-black">
                    Product (HS6)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-black">
                    Rate
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-black">
                    Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-black">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow
                    key={calc.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell className="font-medium text-sm text-gray-900">
                      {calc.date}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {calc.importer} → {calc.exporter}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {calc.product}
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-black">
                      {calc.rate === 0 ? "0%" : `${calc.rate}%`}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {calc.type}
                    </TableCell>
                    <TableCell>{getStatusBadge(calc.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
