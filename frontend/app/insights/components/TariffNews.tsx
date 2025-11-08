"use client";

import { useEffect, useState } from "react";
import { getTradeNews } from "../utils/actions";

interface NewsItem {
  id: number;
  title: string;
  source: string;
  date: string;
  impact: "high" | "medium" | "low";
  category: string;
  summary: string;
  url?: string;
}

export function TariffNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const fetchNews = async () => {
    setIsFetching(true);
    console.log("Refreshing news...");
    try {
      const result = await getTradeNews();
      console.log("News fetched:", result.news);
      setNews((result.news || []) as NewsItem[]);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const initializeNews = async () => {
      try {
        const result = await getTradeNews();
        setNews((result.news || []) as NewsItem[]);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeNews();
  }, []);

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "high":
        return "[HIGH]";
      case "medium":
        return "[MEDIUM]";
      case "low":
        return "[LOW]";
      default:
        return "[INFO]";
    }
  };

  return (
    <div className="w-full">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Trade & Tariff News</h2>
            <p className="text-xs text-muted-foreground mt-1">Latest developments in international trade</p>
          </div>
          <button
            onClick={fetchNews}
            disabled={isFetching || loading}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isFetching ? "Fetching..." : "Refresh News"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="space-y-3">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border-l-4 border-l-border p-4 bg-muted rounded transition-colors hover:bg-muted/80 cursor-pointer block no-underline"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-foreground text-sm flex-1 hover:underline">{item.title}</h3>
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {getImpactLabel(item.impact)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{item.summary}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-blue-600 hover:underline">{item.source}</span>
                  <span>{item.date}</span>
                  <span className="bg-background px-2 py-1 rounded text-foreground font-medium">
                    {item.category}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">No news available</div>
        )}
      </div>
    </div>
  );
}
