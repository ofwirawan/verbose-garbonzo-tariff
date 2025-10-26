"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import TariffChart from "./components/TariffChart";

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
            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tariff Calculator</h1>
                <p className="text-sm text-gray-600">
                  Calculate import tariffs and freight costs for international trade
                </p>
              </div>

              {/* Main Tariff Calculation Section - Centered, Clean */}
              <div className="w-full">
                <TariffChart chartTitle="Calculate Tariff" />
              </div>

              {/* Footer Note */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Tariff rates sourced from WITS database. Freight estimates provided by Freightos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
