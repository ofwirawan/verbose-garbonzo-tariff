"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { StatisticsOverview } from "./components/StatisticsOverview";
import { TariffNews } from "./components/TariffNews";
import { TariffHotspots } from "./components/TariffHotspots";
import { TariffChanges } from "./components/TariffChanges";
import { GlobalTariffComparison } from "./components/GlobalTariffComparison";
import { TariffInsights } from "./components/TariffInsights";

export default function InsightsPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="@container/main flex-1 overflow-auto">
            <div className="flex flex-col gap-6 p-4 md:p-8 mx-auto">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Trade & Tariff Analytics
                </h1>
                <p className="text-sm text-gray-600">
                  Global tariff rates and trade market insights
                </p>
              </div>

              {/* Key Statistics */}
              <StatisticsOverview />

              {/* Alerts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TariffHotspots />
                <TariffChanges />
              </div>

              {/* News */}
              <TariffNews />

              {/* Data Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlobalTariffComparison />
                <TariffInsights />
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Data sourced from trade databases and market reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
