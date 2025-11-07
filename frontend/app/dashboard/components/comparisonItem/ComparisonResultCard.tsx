"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { ComparisonResult } from "@/app/dashboard/components/utils/types";

interface ComparisonResultCardProps {
  result: ComparisonResult;
  totalResults: number;
}

export function ComparisonResultCard({
  result,
}: ComparisonResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const totalCost = result.result.totalLandedCost || result.result.tradeFinal;
  const dutyAmount = (result.result.tradeFinal || 0) - (result.result.tradeOriginal || 0);
  const percentDiff = result.percentDiff;

  return (
    <div className="space-y-0 w-full">
      <Card className={`overflow-hidden transition-all w-full bg-white border border-gray-200 cursor-pointer`}>
        <div className="flex flex-row transition-all duration-300 gap-0 items-stretch">
          {/* Summary Section - Left */}
          <div
            className={`p-4 sm:p-5 md:p-6 transition-all duration-300 ${expanded ? "border-r border-gray-200" : ""}`}
            style={{ flex: expanded ? "0 0 32%" : "1" }}
            onClick={() => setExpanded(!expanded)}
          >
            {/* Header with Rank and Country */}
            <div className="flex items-end justify-between gap-3 mb-4">
              {/* Left: Rank and Country */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Rank Badge */}
                <div className="text-center px-3 py-1.5 rounded-md font-bold text-sm bg-black text-white flex-shrink-0">
                  #{result.rank}
                </div>

                {/* Country Info */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {result.countryName}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.rank === 1 ? "Best Option" : `+${percentDiff.toFixed(1)}% more expensive`}
                  </p>
                </div>
              </div>

              {/* Toggle Button - Minimal */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="p-1 transition-colors duration-200 hover:text-gray-700 text-gray-400 flex-shrink-0"
                title={expanded ? "Collapse details" : "Expand to see details"}
              >
                <div className="transition-all duration-300" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <ChevronDown className="h-5 w-5" />
                </div>
              </button>
            </div>

            {/* Summary Metrics - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Cost - Highlighted */}
              <div className="bg-black text-white rounded-lg p-4 sm:p-5 md:p-6 border border-gray-300">
                <div className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-2">
                  Total Cost
                </div>
                <div className="text-lg sm:text-2xl font-bold break-words">
                  ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Base Value */}
              <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Base Value
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                  ${Number(result.result.tradeOriginal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Duty Amount */}
              <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Tariff Duty
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                  ${dutyAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Additional Costs */}
              <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Additional
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                  ${(Number(result.result.freightCost || 0) + Number(result.result.insuranceCost || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Details Section - Right */}
          {expanded && (
            <div className="flex-1 p-4 sm:p-5 md:p-6 overflow-x-auto bg-white border-l border-gray-200">
              <div className="flex flex-col gap-4">
                {/* Breakdown Table */}
                <div className="flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ minWidth: "480px" }}>
                  <table className="w-full text-sm">
                <tbody>
                  {/* Tariff Rates Section */}
                  {(result.result.appliedRate?.mfnAdval !== undefined ||
                    result.result.appliedRate?.specific !== undefined ||
                    result.result.appliedRate?.prefAdval !== undefined ||
                    result.result.appliedRate?.suspension !== undefined) && (
                    <>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td colSpan={2} className="px-4 py-3">
                          <p className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                            Tariff Rates
                          </p>
                        </td>
                      </tr>

                      {result.result.appliedRate?.mfnAdval !== undefined && (
                        <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-4 py-2.5 text-gray-700 font-medium text-sm">
                            MFN Ad-valorem
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-black text-sm">
                            {(result.result.appliedRate.mfnAdval as number).toFixed(2)}%
                          </td>
                        </tr>
                      )}

                      {result.result.appliedRate?.specific !== undefined && (
                        <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-4 py-2.5 text-gray-700 font-medium text-sm">
                            Specific Duty
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-black text-sm">
                            ${(result.result.appliedRate.specific as number).toFixed(2)}/kg
                          </td>
                        </tr>
                      )}

                      {result.result.appliedRate?.prefAdval !== undefined && (
                        <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-4 py-2.5 text-gray-700 font-medium text-sm">
                            Preferential Rate
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-black text-sm">
                            {(result.result.appliedRate.prefAdval as number).toFixed(2)}%
                          </td>
                        </tr>
                      )}

                      {result.result.appliedRate?.suspension !== undefined && (
                        <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-4 py-2.5 text-gray-700 font-medium text-sm">
                            Suspension Rate
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-black text-sm">
                            {(result.result.appliedRate.suspension as number).toFixed(2)}%
                          </td>
                        </tr>
                      )}
                    </>
                  )}

                  {/* Additional Costs Section */}
                  {(() => {
                    const freightValue = Number(result.result.freightCost) || 0;
                    const insuranceValue = Number(result.result.insuranceCost) || 0;
                    const hasFreight = freightValue > 0;
                    const hasInsurance = insuranceValue > 0;

                    if (!hasFreight && !hasInsurance) return null;

                    return (
                      <>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <td colSpan={2} className="px-4 py-3">
                            <p className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                              Additional Charges
                            </p>
                          </td>
                        </tr>

                        {hasFreight && (
                          <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
                            <td className="px-4 py-2.5 text-gray-700 font-medium text-sm">
                              Freight ({result.result.freightType})
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-black text-sm">
                              ${((result.result.freightCost as number) / 1000).toFixed(1)}k
                            </td>
                          </tr>
                        )}

                        {hasInsurance && (
                          <tr className="hover:bg-gray-50 transition">
                            <td className="px-4 py-2.5 text-gray-700 font-medium text-sm">
                              Insurance ({(result.result.insuranceRate as number).toFixed(1)}%)
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-black text-sm">
                              ${((result.result.insuranceCost as number) / 1000).toFixed(1)}k
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Cost Summary - Detailed Breakdown */}
            <div className="flex gap-4" style={{ width: "100%", overflowX: "auto" }}>
              {/* Base Value Card */}
              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg border border-gray-200 flex-shrink-0" style={{ minWidth: "200px" }}>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Base Value
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                  ${Number(result.result.tradeOriginal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Duty Card */}
              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg border border-gray-200 flex-shrink-0" style={{ minWidth: "200px" }}>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Tariff Duty
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                  ${dutyAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Additional Costs Card */}
              <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg border border-gray-200 flex-shrink-0" style={{ minWidth: "200px" }}>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Additional
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                  ${(Number(result.result.freightCost || 0) + Number(result.result.insuranceCost || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Total Cost Card - Highlighted */}
              <div className="bg-black text-white p-4 sm:p-5 md:p-6 rounded-lg border border-gray-300 flex-shrink-0" style={{ minWidth: "200px" }}>
                <div className="text-xs font-medium text-gray-300 uppercase tracking-wide mb-2">
                  Total Landed
                </div>
                <div className="text-lg sm:text-2xl font-bold break-words">
                  ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
