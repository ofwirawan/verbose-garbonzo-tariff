"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { TariffChart } from "./components/TariffChart";
import data from "./data.json";

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <TariffChart chartTitle="Tariff Data Analysis" />
                {/* Advanced Tariff Simulation Panel */}
                <div className="mt-8 p-6 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    Advanced Tariff Simulation
                    <span className="relative group">
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        className="inline-block text-blue-500 cursor-pointer"
                        aria-label="Simulation Info"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="9"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          fill="#fff"
                        />
                        <text
                          x="10"
                          y="15"
                          textAnchor="middle"
                          fontSize="12"
                          fill="#3b82f6"
                          fontWeight="bold"
                        >
                          i
                        </text>
                      </svg>
                      <div className="absolute left-full top-1/2 z-10 w-72 -translate-y-1/2 ml-4 rounded-lg bg-white border border-gray-200 shadow-lg p-4 text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        <strong>Simulation Mode:</strong>
                        <br />
                        The chart above will show simulated tariff rates for the
                        next 10 years based on your chosen parameters.
                        <br />
                        <br />
                        <ul className="list-disc ml-4">
                          <li>
                            <b>Base Tariff Rate</b>: Sets the starting tariff
                            percentage for the selected product.
                          </li>
                          <li>
                            <b>Country Modifier</b>: Multiplies the base rate to
                            reflect trade relationships (e.g. agreements,
                            disputes).
                          </li>
                          <li>
                            <b>Trend Factor</b>: Controls yearly % change in
                            tariffs (negative = decrease, positive = increase).
                          </li>
                        </ul>
                        <br />
                        <span className="text-blue-500">
                          This simulation ignores historical data and generates
                          a hypothetical scenario.
                        </span>
                      </div>
                    </span>
                  </h2>
                  <p className="mb-4 text-gray-600">
                    Simulate tariff changes by adjusting parameters below and
                    visualize their impact.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label
                          htmlFor="simBaseRate"
                          className="block text-sm font-medium"
                        >
                          Base Tariff Rate (%)
                        </label>
                        <span className="relative group">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            className="inline-block text-blue-500 cursor-pointer"
                            aria-label="Base Rate Info"
                          >
                            <circle
                              cx="8"
                              cy="8"
                              r="7"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              fill="#fff"
                            />
                            <text
                              x="8"
                              y="12"
                              textAnchor="middle"
                              fontSize="10"
                              fill="#3b82f6"
                              fontWeight="bold"
                            >
                              i
                            </text>
                          </svg>
                          <div className="absolute left-1/2 top-0 z-10 w-56 -translate-x-1/2 -translate-y-full mb-2 rounded-lg bg-white border border-gray-200 shadow-lg p-2 text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                            Sets the starting tariff percentage for the selected
                            product.
                          </div>
                        </span>
                      </div>
                      <input
                        id="simBaseRate"
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        defaultValue={10}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) =>
                          window.dispatchEvent(
                            new CustomEvent("tariffSimChange", {
                              detail: { baseRate: parseFloat(e.target.value) },
                            })
                          )
                        }
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label
                          htmlFor="simCountryModifier"
                          className="block text-sm font-medium"
                        >
                          Country Modifier
                        </label>
                        <span className="relative group">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            className="inline-block text-blue-500 cursor-pointer"
                            aria-label="Country Modifier Info"
                          >
                            <circle
                              cx="8"
                              cy="8"
                              r="7"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              fill="#fff"
                            />
                            <text
                              x="8"
                              y="12"
                              textAnchor="middle"
                              fontSize="10"
                              fill="#3b82f6"
                              fontWeight="bold"
                            >
                              i
                            </text>
                          </svg>
                          <div className="absolute left-1/2 top-0 z-10 w-64 -translate-x-1/2 -translate-y-full mb-2 rounded-lg bg-white border border-gray-200 shadow-lg p-2 text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                            Multiplies the base rate to reflect trade
                            relationships.
                            <br />
                            <br />
                            <b>How it works:</b>
                            <ul className="list-disc ml-4">
                              <li>
                                Lower values (e.g. 0.6) simulate strong trade
                                agreements or partnerships, resulting in lower
                                tariffs.
                              </li>
                              <li>
                                Higher values (e.g. 1.4) simulate trade disputes
                                or barriers, resulting in higher tariffs.
                              </li>
                              <li>Default is 1 (no adjustment).</li>
                              <li>
                                Modifier is calculated based on country
                                development level, region, and trade
                                relationship.
                              </li>
                            </ul>
                          </div>
                        </span>
                      </div>
                      <input
                        id="simCountryModifier"
                        type="number"
                        min={0.5}
                        max={2}
                        step={0.01}
                        defaultValue={1}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) =>
                          window.dispatchEvent(
                            new CustomEvent("tariffSimChange", {
                              detail: {
                                countryModifier: parseFloat(e.target.value),
                              },
                            })
                          )
                        }
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label
                          htmlFor="simTrend"
                          className="block text-sm font-medium"
                        >
                          Trend Factor (Yearly % Change)
                        </label>
                        <span className="relative group">
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            className="inline-block text-blue-500 cursor-pointer"
                            aria-label="Trend Info"
                          >
                            <circle
                              cx="8"
                              cy="8"
                              r="7"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              fill="#fff"
                            />
                            <text
                              x="8"
                              y="12"
                              textAnchor="middle"
                              fontSize="10"
                              fill="#3b82f6"
                              fontWeight="bold"
                            >
                              i
                            </text>
                          </svg>
                          <div className="absolute left-1/2 top-0 z-10 w-56 -translate-x-1/2 -translate-y-full mb-2 rounded-lg bg-white border border-gray-200 shadow-lg p-2 text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                            Controls yearly % change in tariffs (negative =
                            decrease, positive = increase).
                          </div>
                        </span>
                      </div>
                      <input
                        id="simTrend"
                        type="number"
                        min={-10}
                        max={10}
                        step={0.01}
                        defaultValue={-2}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) =>
                          window.dispatchEvent(
                            new CustomEvent("tariffSimChange", {
                              detail: { trend: parseFloat(e.target.value) },
                            })
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Adjust parameters to model different scenarios. Results
                    update in the chart above.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
