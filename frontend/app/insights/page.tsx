"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TariffInsights } from "./components/TariffInsights";
import { StatisticsOverview } from "./components/StatisticsOverview";
import { RegionalComparison } from "./components/RegionalComparison";
import { RecentCalculations } from "./components/RecentCalculations";
import { TradeAgreements } from "./components/TradeAgreements";

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
            <div className="flex flex-col gap-8 p-4 md:p-8 mx-auto">
              {/* Page Header */}
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-black mb-2">Insights</h1>
                <p className="text-sm text-gray-600">
                  Tariff data trends and calculation statistics
                </p>
              </div>

              {/* Statistics Overview */}
              <div className="w-full">
                <StatisticsOverview />
              </div>

              {/* Tariff Insights Section */}
              <div className="w-full">
                <TariffInsights />
              </div>

              {/* Regional Comparison and Trade Agreements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <RegionalComparison />
                <TradeAgreements />
              </div>

              {/* Recent Calculations */}
              <div className="w-full">
                <RecentCalculations />
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Data sourced from WITS database and Freightos marketplace
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
