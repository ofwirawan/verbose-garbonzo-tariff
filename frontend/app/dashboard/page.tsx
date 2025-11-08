"use client";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import TariffChart from "./components/TariffChart";
import { Country, DropdownOption } from "./components/utils/types";
import { convertProductsToOptions } from "./components/utils/service";
import { fetchCountries, fetchProduct } from "./actions/dashboardactions";

export default function Page() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch countries and products using server actions
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch countries and products in parallel
        const [countriesResult, productsResult] = await Promise.all([
          fetchCountries(),
          fetchProduct(),
        ]);

        setCountries(countriesResult.countries);
        const productOptions = convertProductsToOptions(productsResult.products);
        setProducts(productOptions);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Continue with empty state - components will handle loading
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Tariff Calculator
                </h1>
                <p className="text-sm text-gray-600">
                  Calculate import tariffs and freight costs for international
                  trade
                </p>
              </div>

              {/* Main Tariff Calculation Section */}
              <div className="w-full">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-96 w-full" />
                  </div>
                ) : (
                  <TariffChart
                    chartTitle="Calculate Tariff"
                    countries={countries}
                    products={products}
                  />
                )}
              </div>

              {/* Footer Note */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Tariff rates sourced from WITS database. Freight estimates
                  provided by Freightos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
