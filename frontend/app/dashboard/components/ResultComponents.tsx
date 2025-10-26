"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { TariffCalculationResult } from "./utils/types";
import { authenticatedFetch } from "@/lib/auth";

interface CalculationResultsProps {
  result: TariffCalculationResult;
  suspensionNote: string | null;
}

export function CalculationResultsSkeleton() {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="mt-8 space-y-4 animate-pulse">
        {/* Cost Summary Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-50 p-6 rounded-lg border border-gray-200"
            >
              <div className="h-3 w-24 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Details Skeleton */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalculationResults({
  result,
  suspensionNote,
}: CalculationResultsProps) {
  const hasFreightData =
    result.freightCost !== undefined && result.freightCost > 0;
  const dutyAmount = Number(result.tradeFinal) - Number(result.tradeOriginal);

  return (
    <div className="mt-8 space-y-6">
      {/* Main Cost Summary - Always Visible */}
      <CostSummary
        result={result}
        dutyAmount={dutyAmount}
        hasFreightData={hasFreightData}
      />

      {/* Collapsible Details Section */}
      <DetailsSection
        result={result}
        suspensionNote={suspensionNote}
        hasFreightData={hasFreightData}
      />

      {/* Save Button */}
      <SaveHistoryButton result={result} />
    </div>
  );
}

function CostSummary({
  result,
  dutyAmount,
  hasFreightData,
}: {
  result: TariffCalculationResult;
  dutyAmount: number;
  hasFreightData: boolean;
}) {
  const appliedRate = result.appliedRate || {};
  const getRateInfo = () => {
    if (appliedRate.suspension !== undefined)
      return { rate: appliedRate.suspension, type: "Suspended" };
    if (appliedRate.prefAdval !== undefined)
      return { rate: appliedRate.prefAdval, type: "Preferential (FTA)" };
    if (appliedRate.mfnAdval !== undefined)
      return { rate: appliedRate.mfnAdval, type: "MFN Standard" };
    return { rate: 0, type: "No Rate" };
  };

  const rateInfo = getRateInfo();
  const totalCost = hasFreightData
    ? Number(result.totalLandedCost)
    : Number(result.tradeFinal);

  return (
    <div className="space-y-4">
      {/* Visual Cost Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trade Value Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Trade Value
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            $
            {Number(result.tradeOriginal).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Base transaction value
          </div>
        </div>

        {/* Tariff Duty Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Tariff Duty
            </div>
            {result.suspensionActive === true && (
              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Suspended
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${dutyAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {rateInfo.rate.toFixed(2)}% · {rateInfo.type}
          </div>
        </div>

        {/* Freight Card (if applicable) */}
        {hasFreightData ? (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Freight Cost
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              $
              {Number(result.freightCost).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {result.freightMode === "air"
                ? "Air Freight"
                : result.freightMode === "ocean"
                ? "Ocean Freight"
                : "Express Delivery"}
              {result.transitDays && ` · ${result.transitDays} days`}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-5 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-8 h-8 text-gray-300 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="text-xs text-gray-400">
                No freight data available for this route
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total Landed Cost - Prominent Display */}
      <div className="bg-gray-100 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-black uppercase tracking-wide mb-1">
              Total Landed Cost
            </div>
            <div className="text-xs text-black">
              {result.hs6} · {result.importerCode} ←{" "}
              {result.exporterCode || "—"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-black">
              ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            {hasFreightData &&
              result.freightCostMin &&
              result.freightCostMax && (
                <div className="text-xs text-gray-400 mt-1">
                  Freight range: ${Number(result.freightCostMin).toLocaleString("en-US", { maximumFractionDigits: 0 })}-$
                  {Number(result.freightCostMax).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsSection({
  result,
  suspensionNote,
  hasFreightData,
}: {
  result: TariffCalculationResult;
  suspensionNote: string | null;
  hasFreightData: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const appliedRate = result.appliedRate || {};

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900">
            Transaction Details
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {isExpanded ? "Hide details" : "View details"}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-6 space-y-6 bg-gray-50">
          {/* Transaction Info Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              Transaction Information
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Product Code" value={result.hs6} />
              <InfoItem
                label="Transaction Date"
                value={result.transactionDate}
              />
              <InfoItem label="Importing Country" value={result.importerCode} />
              <InfoItem
                label="Exporting Country"
                value={result.exporterCode || "—"}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Transaction ID:</span>{" "}
                <span className="font-mono">{result.transactionId}</span>
              </p>
            </div>
          </div>

          {/* Rate Details Section */}
          {(appliedRate.mfnAdval !== undefined ||
            appliedRate.prefAdval !== undefined ||
            appliedRate.specific !== undefined) && (
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                Tariff Rate Breakdown
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {appliedRate.prefAdval !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium mb-1">
                      Preferential Rate (FTA)
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {appliedRate.prefAdval.toFixed(2)}%
                    </div>
                  </div>
                )}
                {appliedRate.mfnAdval !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium mb-1">
                      MFN Ad-valorem
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {appliedRate.mfnAdval.toFixed(2)}%
                    </div>
                  </div>
                )}
                {appliedRate.specific !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium mb-1">
                      Specific Duty
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${appliedRate.specific.toFixed(2)}/kg
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Freight Details Section */}
          {hasFreightData && (
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                Shipping Information
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem
                  label="Shipping Method"
                  value={
                    result.freightMode === "air"
                      ? "Air Freight"
                      : result.freightMode === "ocean"
                      ? "Ocean Freight"
                      : "Express Courier"
                  }
                />
                <InfoItem
                  label="Cost Range"
                  value={
                    result.freightCostMin && result.freightCostMax
                      ? `$${Number(result.freightCostMin).toLocaleString("en-US", { maximumFractionDigits: 0 })}-$${Number(result.freightCostMax).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                      : "—"
                  }
                />
                <InfoItem
                  label="Transit Time"
                  value={
                    result.transitDays ? `${result.transitDays} days` : "—"
                  }
                />
                <InfoItem
                  label="Shipment Weight"
                  value={result.netWeight ? `${result.netWeight} kg` : "—"}
                />
              </div>
            </div>
          )}

          {/* Suspension Note */}
          {suspensionNote && (
            <div className="bg-black rounded-lg p-5 border-l-4 border-white">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-white mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wide mb-2">
                    Tariff Suspension Notice
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {suspensionNote}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
      <div className="text-sm text-gray-900 font-semibold">{value}</div>
    </div>
  );
}

function SaveHistoryButton({ result }: { result: TariffCalculationResult }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [canSaveHistory, setCanSaveHistory] = useState(true);

  async function handleSaveHistory() {
    if (!result) return;

    try {
      const appliedRate = result.appliedRate || {};

      const requestBody = {
        t_date: result.transactionDate,
        importer_code: result.importerCode,
        exporter_code: result.exporterCode,
        hs6code: result.hs6,
        trade_original: Number(result.tradeOriginal),
        net_weight: result.netWeight || null,
        trade_final: Number(result.tradeFinal),
        applied_rate: appliedRate,
      };

      const response = await authenticatedFetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "An error occurred while saving history"
        );
      }

      setCanSaveHistory(false);
      setIsDialogOpen(false);
      toast.success("Calculation saved to history!");
    } catch (err) {
      console.error("Save history error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to save calculation history"
      );
      setIsDialogOpen(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={!canSaveHistory}
          className="bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2 font-semibold text-sm uppercase tracking-wide"
        >
          Save to History
        </Button>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Calculation</AlertDialogTitle>
            <AlertDialogDescription>
              Save this tariff calculation to your history for future reference?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveHistory}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
