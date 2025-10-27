"use client";

import { useEffect, useState } from "react";
import { getTariffHotspots } from "../utils/actions";

interface Hotspot {
  id: number;
  country: string;
  sector: string;
  change: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedCountries: string[];
  impact: string;
}

export function TariffHotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        const result = await getTariffHotspots();
        setHotspots((result.hotspots || []) as Hotspot[]);
      } catch (error) {
        console.error("Error fetching hotspots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotspots();
  }, []);

  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case "critical":
        return { label: "CRITICAL" };
      case "high":
        return { label: "HIGH" };
      case "medium":
        return { label: "MEDIUM" };
      case "low":
        return { label: "LOW" };
      default:
        return { label: "INFO" };
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Tariff Hotspots</h2>
          <p className="text-xs text-gray-600 mt-1">Critical tariff rate adjustments</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : hotspots.length > 0 ? (
          <div className="space-y-4">
            {hotspots.map((hotspot) => {
              const severityInfo = getSeverityInfo(hotspot.severity);
              const isUp = hotspot.change.startsWith("+");

              return (
                <div key={hotspot.id} className="border-l-4 border-l-gray-300 p-5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{hotspot.country}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{hotspot.sector}</p>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${isUp ? "text-gray-900" : "text-gray-600"}`}>
                        {hotspot.change}
                      </div>
                      <div className="text-xs text-gray-700 font-semibold mt-0.5">{severityInfo.label}</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 mb-2 leading-relaxed">{hotspot.impact}</p>

                  <div className="flex flex-wrap gap-2">
                    {hotspot.affectedCountries.map((country) => (
                      <span
                        key={country}
                        className="px-2 py-1 bg-gray-900 text-white text-xs font-mono rounded"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-600 text-sm">No hotspots detected</div>
        )}
      </div>
    </div>
  );
}
