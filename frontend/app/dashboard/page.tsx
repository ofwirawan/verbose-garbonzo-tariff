"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import TariffChart from "./components/TariffChart";
import { RecentCalculations } from "./components/dataDisplay/RecentCalculations";
import { TopProducts } from "./components/dataDisplay/TopProducts";
import { RegionalComparison } from "./components/dataDisplay/RegionalComparison";
import { TradeAgreements } from "./components/dataDisplay/TradeAgreements";

export default function Page() {
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
            <div className="flex flex-col gap-6 p-4 md:p-6">
              {/* Key Metrics Cards */}
              <SectionCards />

              {/* Tariff Calculation Section - Full Width */}
              <div className="w-full">
                <TariffChart chartTitle="Tariff Rate Analysis" />
              </div>

              {/* Analytics Dashboard Grid - Equal Height Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProducts />
                <RegionalComparison />
              </div>

              {/* Recent Activity and Agreements - 2:1 Ratio */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RecentCalculations />
                </div>
                <div className="lg:col-span-1">
                  <TradeAgreements />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
