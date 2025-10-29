"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  fetchCountries,
  fetchProduct,
} from "@/app/dashboard/actions/dashboardactions";
import { Combobox } from "@/app/dashboard/components/SharedComponents";
import {
  convertCountriesToOptions,
  convertProductsToOptions,
} from "@/app/dashboard/components/utils/service";
import { DropdownOption } from "@/app/dashboard/components/utils/types";

interface CountryOption {
  country_code: string;
  name: string;
  numeric_code: string;
}

interface ProductOption {
  hs6code: string;
  description: string | null;
}

const END_YEAR = 2022;
const START_YEAR = 2006;
const YEAR_INTERVAL = 2;

export default function TariffHistoryPage() {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [chartData, setChartData] = useState<
    { year: string; tariffRate: number; date: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string>("");

  const YEARS = Array.from(
    { length: Math.floor((END_YEAR - START_YEAR) / YEAR_INTERVAL) + 1 },
    (_, i) => (START_YEAR + i * YEAR_INTERVAL).toString()
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [countriesResult, productsResult] = await Promise.all([
          fetchCountries(),
          fetchProduct(),
        ]);
        setCountries(countriesResult.countries);
        setProducts(productsResult.products);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load countries and products");
      }
    };
    loadData();
  }, []);

  const extractTariffRate = (xmlDoc: Document): number | null => {
    const series = xmlDoc.querySelectorAll("Series");
    const obs = xmlDoc.querySelectorAll("Obs");

    for (const seriesNode of Array.from(series)) {
      for (let i = 0; i < seriesNode.attributes.length; i++) {
        const attr = seriesNode.attributes[i];
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (
          (name.includes("value") ||
            name.includes("rate") ||
            name.includes("average")) &&
          value
        ) {
          const rate = parseFloat(value);
          if (!isNaN(rate)) return rate;
        }
      }

      const childObs = seriesNode.querySelectorAll("Obs");
      for (const obsNode of Array.from(childObs)) {
        for (let i = 0; i < obsNode.attributes.length; i++) {
          const attr = obsNode.attributes[i];
          const name = attr.name.toLowerCase();
          const value = attr.value;

          if ((name.includes("value") || name.includes("rate")) && value) {
            const rate = parseFloat(value);
            if (!isNaN(rate)) return rate;
          }
        }
      }
    }

    for (const obsNode of Array.from(obs)) {
      for (let i = 0; i < obsNode.attributes.length; i++) {
        const attr = obsNode.attributes[i];
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if ((name.includes("value") || name.includes("rate")) && value) {
          const rate = parseFloat(value);
          if (!isNaN(rate)) return rate;
        }
      }
    }

    return null;
  };

  const fetchFromWITS = async () => {
    if (!selectedCountry || !selectedProduct) {
      setError("Please select both a country and a chemical product");
      return;
    }

    setIsFetching(true);
    setError(null);
    setChartData([]);
    setFetchStatus("");

    const country = countries.find((c) => c.country_code === selectedCountry);
    if (!country) {
      setError("Invalid country selected");
      setIsFetching(false);
      return;
    }

    try {
      const downloadedData: {
        year: string;
        tariffRate: number;
        date: string;
      }[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const year of YEARS) {
        setFetchStatus(
          `Fetching ${year}... (${successCount + failCount + 1}/${
            YEARS.length
          })`
        );

        try {
          const url = `/api/wits-tariff?reporter=${country.numeric_code}&partner=000&product=${selectedProduct}&year=${year}`;
          const response = await fetch(url);

          if (!response.ok) {
            console.error(`Failed to fetch ${year}: ${response.status}`);
            failCount++;
            continue;
          }

          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");

          const tariffRate = extractTariffRate(xmlDoc);

          if (tariffRate !== null) {
            downloadedData.push({
              year: year,
              tariffRate: tariffRate,
              date: `${year}-01-01`,
            });
            successCount++;
          } else {
            failCount++;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Error processing ${year}:`, err);
          failCount++;
        }
      }

      setFetchStatus(
        `Complete! Success: ${successCount}, Failed: ${failCount}`
      );

      if (downloadedData.length === 0) {
        setError("No tariff data found for the selected country and product.");
      } else {
        setChartData(downloadedData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsFetching(false);
    }
  };

  const selectedCountryName = countries.find(
    (c) => c.country_code === selectedCountry
  )?.name;
  const selectedProductName = products.find(
    (p) => p.hs6code === selectedProduct
  )?.description;

  const countryOptions: DropdownOption[] = convertCountriesToOptions(countries);
  const productOptions: DropdownOption[] = convertProductsToOptions(products);

  const chartConfig = {
    tariffRate: {
      label: "Tariff Rate (%)",
      color: "hsl(var(--chart-1))",
    },
  };

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
            <div className="flex flex-col gap-6 p-4 md:p-8 mx-auto w-full">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Tariff History
                </h1>
                <p className="text-sm text-gray-600">
                  Explore historical tariff rate trends for chemical products
                </p>
              </div>

              <Card className="shadow-sm">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100/50 pb-4">
                  <CardTitle className="text-lg font-semibold">
                    Chemical Products Tariff History
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Fetch historical tariff rate trends for chemical products
                    directly from WITS API
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="country"
                          className="text-sm font-bold text-black uppercase tracking-wide"
                        >
                          Country (Reporter)
                        </Label>
                        <Combobox
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                          placeholder="Select country"
                          id="country"
                          options={countryOptions}
                          searchPlaceholder="Search countries..."
                          emptyText="No country found."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="product"
                          className="text-sm font-bold text-black uppercase tracking-wide"
                        >
                          Chemical Product
                        </Label>
                        <Combobox
                          value={selectedProduct}
                          onValueChange={setSelectedProduct}
                          placeholder="Select chemical"
                          id="product"
                          options={productOptions}
                          searchPlaceholder="Search products..."
                          emptyText="No product found."
                          showSecondaryText={true}
                        />
                      </div>
                    </div>

                    <div className="flex justify-center sm:justify-end">
                      <Button
                        onClick={fetchFromWITS}
                        disabled={
                          !selectedCountry || !selectedProduct || isFetching
                        }
                        className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed h-10 px-6 font-semibold text-sm uppercase tracking-wide transition-all duration-200"
                      >
                        {isFetching ? (
                          <span className="flex items-center gap-3">
                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Fetching...
                          </span>
                        ) : (
                          <span className="flex items-center gap-3">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Fetch Historical Data
                          </span>
                        )}
                      </Button>
                    </div>

                    {fetchStatus && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm font-medium">
                          {fetchStatus}
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm font-medium">
                          {error}
                        </p>
                      </div>
                    )}

                    {chartData.length > 0 && (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Tariff Rate Trend</CardTitle>
                            <CardDescription>
                              Showing <strong>{selectedProductName}</strong> (
                              {selectedProduct}) from{" "}
                              <strong>{selectedCountryName}</strong> to the
                              World
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer
                              config={chartConfig}
                              className="h-[350px] w-full"
                            >
                              <AreaChart
                                accessibilityLayer
                                data={chartData}
                                margin={{
                                  top: 30,
                                  left: 20,
                                  right: 20,
                                  bottom: 60,
                                }}
                              >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                  dataKey="year"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  interval={0}
                                />
                                <ChartTooltip
                                  cursor={false}
                                  content={
                                    <ChartTooltipContent indicator="line" />
                                  }
                                />
                                <Area
                                  dataKey="tariffRate"
                                  type="natural"
                                  fill="var(--color-tariffRate)"
                                  fillOpacity={0.4}
                                  stroke="var(--color-tariffRate)"
                                />
                              </AreaChart>
                            </ChartContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Data Table
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="p-3 text-left font-bold">
                                      Year
                                    </th>
                                    <th className="p-3 text-right font-bold">
                                      Tariff Rate (%)
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {chartData.map((item, index) => (
                                    <tr key={index} className="border-t">
                                      <td className="p-3">{item.year}</td>
                                      <td className="p-3 text-right font-mono">
                                        {item.tariffRate.toFixed(2)}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
