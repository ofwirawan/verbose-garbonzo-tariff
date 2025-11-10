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
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground">Tariff Hotspots</h2>
          <p className="text-xs text-muted-foreground mt-1">Critical tariff rate adjustments</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : hotspots.length > 0 ? (
          <div className="space-y-4">
            {hotspots.map((hotspot) => {
              const severityInfo = getSeverityInfo(hotspot.severity);
              const isUp = hotspot.change.startsWith("+");

              return (
                <div key={hotspot.id} className="border-l-4 border-l-border p-5 bg-muted rounded hover:bg-muted/80 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{hotspot.country}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{hotspot.sector}</p>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${isUp ? "text-foreground" : "text-muted-foreground"}`}>
                        {hotspot.change}
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold mt-0.5">{severityInfo.label}</div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{hotspot.impact}</p>

                  <div className="flex flex-wrap gap-2">
                    {hotspot.affectedCountries.map((country) => (
                      <span
                        key={country}
                        className="px-2 py-1 bg-primary text-primary-foreground text-xs font-mono rounded"
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
          <div className="text-center py-6 text-muted-foreground text-sm">No hotspots detected</div>
        )}
      </div>
    </div>
  );
}
