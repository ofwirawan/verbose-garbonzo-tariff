"use client";

import { useEffect, useState } from "react";
import { getTariffChanges } from "../utils/actions";

interface Change {
  country: string;
  change: number;
  direction: "up" | "down";
  reason: string;
  date: string;
}

export function TariffChanges() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChanges = async () => {
      try {
        const result = await getTariffChanges();
        setChanges((result.tariffChanges || []) as Change[]);
      } catch (error) {
        console.error("Error fetching changes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();
  }, []);

  return (
    <div className="w-full">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground">Recent Tariff Changes</h2>
          <p className="text-xs text-muted-foreground mt-1">Tariff rate adjustments by country</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : changes.length > 0 ? (
          <div className="space-y-4">
            {changes.map((change) => (
              <div
                key={`${change.country}-${change.date}`}
                className={`border-l-4 border-l-border p-5 bg-muted rounded transition-colors hover:bg-muted/80 ${
                  change.direction === "up"
                    ? "border-l-primary"
                    : "border-l-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{change.country}</span>
                    <p className="text-xs text-muted-foreground">{change.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        change.direction === "up" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {change.change}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{change.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">No recent changes</div>
        )}
      </div>
    </div>
  );
}
