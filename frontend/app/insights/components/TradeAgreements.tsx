"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Agreement {
  id: string;
  name: string;
  countries: string[];
  status: "active" | "expiring" | "inactive";
  suspendedTariffs: number;
  expiryDate?: string;
}

export function TradeAgreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        // Simulated data - replace with actual API call
        setAgreements([
          {
            id: "1",
            name: "USMCA",
            countries: ["USA", "CAN", "MEX"],
            status: "active",
            suspendedTariffs: 45,
          },
          {
            id: "2",
            name: "EU Single Market",
            countries: ["DEU", "FRA", "ITA", "ESP", "NLD"],
            status: "active",
            suspendedTariffs: 89,
          },
          {
            id: "3",
            name: "CPTPP",
            countries: ["JPN", "AUS", "CAN", "SGP", "VNM"],
            status: "active",
            suspendedTariffs: 62,
          },
          {
            id: "4",
            name: "ASEAN FTA",
            countries: ["SGP", "MYS", "THA", "IDN", "PHL"],
            status: "expiring",
            suspendedTariffs: 34,
            expiryDate: "2025-12-31",
          },
          {
            id: "5",
            name: "US-China Phase One",
            countries: ["USA", "CHN"],
            status: "inactive",
            suspendedTariffs: 0,
          },
        ]);
      } catch (error) {
        console.error("Error fetching agreements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgreements();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="border-black text-black bg-white">
            Active
          </Badge>
        );
      case "expiring":
        return (
          <Badge variant="outline" className="border-black text-black bg-white">
            Expiring Soon
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-black text-black bg-white">
            Inactive
          </Badge>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-black">
          Trade Agreements
        </CardTitle>
        <CardDescription className="text-xs text-gray-600">
          Active preferential trade agreements and suspensions
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-black mb-1">
                      {agreement.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      {agreement.countries.join(", ")}
                    </p>
                  </div>
                  {getStatusBadge(agreement.status)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">
                    <strong>{agreement.suspendedTariffs}</strong> suspended
                    tariffs
                  </span>
                  {agreement.expiryDate && (
                    <span className="text-black font-medium">
                      Expires: {agreement.expiryDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
