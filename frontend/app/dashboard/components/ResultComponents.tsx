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

export function CalculationResults({
  result,
  suspensionNote,
}: CalculationResultsProps) {
  const appliedRate = result.appliedRate || {};
  const hasAppliedRateCard = !(
    appliedRate.specific !== undefined && appliedRate.mfnAdval === undefined
  );

  return (
    <div className="mt-8 p-6 rounded-lg bg-white border border-gray-200">
      <ResultHeader result={result} />
      <SuspensionNotice result={result} />
      <ResultSummaryCards
        result={result}
        hasAppliedRateCard={hasAppliedRateCard}
      />
      <RateDetails result={result} suspensionNote={suspensionNote} />
      <TransactionInfo result={result} />
      <ChartLegend result={result} />
    </div>
  );
}

function ResultHeader({ result }: { result: TariffCalculationResult }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
      <h3 className="text-xl font-bold text-gray-900">Calculation Results</h3>
      {result.suspensionActive === true && (
        <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded uppercase tracking-wide">
          Suspension Active
        </span>
      )}
      {result.suspensionActive === false && (
        <span className="bg-gray-400 text-white text-xs font-medium px-3 py-1 rounded uppercase tracking-wide">
          Suspension Inactive
        </span>
      )}
    </div>
  );
}

function SuspensionNotice({ result }: { result: TariffCalculationResult }) {
  if (result.suspensionActive === true) {
    return (
      <div className="mb-6 p-4 bg-gray-50 border-l-4 border-gray-900 rounded">
        <p className="text-sm text-gray-900">
          <strong>Tariff Suspension Active:</strong> This trade relationship has
          an active tariff suspension, meaning no duties are charged on this
          product from the specified exporter to importer.
        </p>
        {result.suspensionNote && (
          <p className="text-sm text-gray-600 mt-2 italic">
            {result.suspensionNote}
          </p>
        )}
      </div>
    );
  }

  if (result.suspensionActive === false) {
    return (
      <div className="mb-6 p-4 bg-gray-50 border-l-4 border-gray-400 rounded">
        <p className="text-sm text-gray-900">
          <strong>Historical Suspension Record:</strong> This trade relationship
          had a tariff suspension in the past, but it is currently inactive or
          expired. No tariff rate data is available.
        </p>
        {result.suspensionNote && (
          <p className="text-sm text-gray-600 mt-2 italic">
            {result.suspensionNote}
          </p>
        )}
      </div>
    );
  }

  return null;
}

function ResultSummaryCards({
  result,
  hasAppliedRateCard,
}: {
  result: TariffCalculationResult;
  hasAppliedRateCard: boolean;
}) {
  const appliedRate = result.appliedRate || {};

  return (
    <div
      className={`grid gap-4 mb-6 ${
        hasAppliedRateCard
          ? "grid-cols-2 md:grid-cols-4"
          : "grid-cols-1 md:grid-cols-3"
      }`}
    >
      {hasAppliedRateCard && <AppliedRateCard appliedRate={appliedRate} />}
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
          Original Trade Value
        </div>
        <div className="text-2xl font-bold text-gray-900">
          ${Number(result.tradeOriginal).toLocaleString()}
        </div>
      </div>
      <DutyAmountCard result={result} />
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
          Final Amount
        </div>
        <div className="text-2xl font-bold text-gray-900">
          $
          {Number(result.tradeFinal).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    </div>
  );
}

function AppliedRateCard({
  appliedRate,
}: {
  appliedRate: TariffCalculationResult["appliedRate"];
}) {
  const getRate = () => {
    if (appliedRate?.suspension !== undefined) {
      return Number(appliedRate.suspension).toFixed(2);
    }
    if (appliedRate?.prefAdval !== undefined) {
      return Number(appliedRate.prefAdval).toFixed(2);
    }
    if (appliedRate?.mfnAdval !== undefined) {
      return Number(appliedRate.mfnAdval).toFixed(2);
    }
    return "0.00";
  };

  const getLabel = () => {
    if (appliedRate?.suspension !== undefined) return "Suspended";
    if (appliedRate?.prefAdval !== undefined) return "Preferential (FTA)";
    if (
      appliedRate?.mfnAdval !== undefined &&
      appliedRate?.specific !== undefined
    )
      return "Compound (MFN+Specific)";
    if (appliedRate?.mfnAdval !== undefined) return "MFN (Standard)";
    return "No Rate";
  };

  return (
    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
        Applied Rate
      </div>
      <div className="text-2xl font-bold text-gray-900">{getRate()}%</div>
      <div className="text-xs text-gray-600 mt-1 font-medium">{getLabel()}</div>
    </div>
  );
}

function DutyAmountCard({ result }: { result: TariffCalculationResult }) {
  const dutyAmount = Number(result.tradeFinal) - Number(result.tradeOriginal);
  const appliedRate = result.appliedRate || {};

  const getDutyLabel = () => {
    if (dutyAmount === 0 && appliedRate.suspension !== undefined) {
      return (
        <div className="text-xs text-gray-600 mt-1 font-medium">
          No duty - Suspended
        </div>
      );
    }
    if (dutyAmount === 0 && appliedRate.prefAdval !== undefined) {
      return (
        <div className="text-xs text-gray-600 mt-1 font-medium">
          No duty - FTA
        </div>
      );
    }
    if (dutyAmount > 0 && appliedRate.prefAdval !== undefined) {
      return (
        <div className="text-xs text-gray-600 mt-1 font-medium">
          Reduced - FTA
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
        Duty Amount
      </div>
      <div className="text-2xl font-bold text-gray-900">
        $
        {dutyAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      {getDutyLabel()}
    </div>
  );
}

function RateDetails({
  result,
  suspensionNote,
}: {
  result: TariffCalculationResult;
  suspensionNote: string | null;
}) {
  const appliedRate = result.appliedRate || {};

  return (
    <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
        Rate Details
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {appliedRate.suspension !== undefined && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Suspension Rate
            </div>
            <div className="font-bold text-gray-900 text-lg">
              {Number(appliedRate.suspension).toFixed(2)}%
            </div>
            <div className="text-xs text-gray-600 mt-2">Tariff suspended</div>
          </div>
        )}
        {appliedRate.prefAdval !== undefined && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Preferential Rate
            </div>
            <div className="font-bold text-gray-900 text-lg">
              {Number(appliedRate.prefAdval).toFixed(2)}%
            </div>
            <div className="text-xs text-gray-600 mt-2">
              From trade agreement between {result.importerCode} and{" "}
              {result.exporterCode}
            </div>
          </div>
        )}
        {appliedRate.mfnAdval !== undefined && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              MFN Ad-valorem
            </div>
            <div className="font-bold text-gray-900 text-lg">
              {Number(appliedRate.mfnAdval).toFixed(2)}%
            </div>
            <div className="text-xs text-gray-600 mt-2">Standard MFN rate</div>
          </div>
        )}
        {appliedRate.specific !== undefined && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Specific Duty
            </div>
            <div className="font-bold text-gray-900 text-lg">
              ${Number(appliedRate.specific).toFixed(2)}/kg
            </div>
            <div className="text-xs text-gray-600 mt-2">Per kilogram rate</div>
          </div>
        )}
      </div>
      {suspensionNote && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Note:
          </span>
          <p className="mt-2 text-sm text-gray-700 italic">{suspensionNote}</p>
        </div>
      )}
    </div>
  );
}

function TransactionInfo({ result }: { result: TariffCalculationResult }) {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Product
          </div>
          <div className="text-gray-900 font-medium">{result.hs6}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Transaction Date
          </div>
          <div className="text-gray-900 font-medium">
            {result.transactionDate}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Importer
          </div>
          <div className="text-gray-900 font-medium">{result.importerCode}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            Exporter
          </div>
          <div className="text-gray-900 font-medium">
            {result.exporterCode || "Not specified"}
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        <span className="font-medium">Transaction ID:</span>{" "}
        {result.transactionId}
      </div>
    </div>
  );
}

function ChartLegend({ result }: { result: TariffCalculationResult }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [canSaveHistory, setCanSaveHistory] = useState(true);
  const appliedRate = result.appliedRate || {};

  async function handleSaveHistory() {
    if (!result) return;

    try {
      // Use the transaction date from the result instead of today's date
      const formattedDate = result.transactionDate; // This is already in YYYY-MM-DD format

      const requestBody = {
        t_date: formattedDate,
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

  const isSuspended = appliedRate.suspension !== undefined;
  const isPreferential = appliedRate.prefAdval !== undefined;
  const isMFN = appliedRate.mfnAdval !== undefined;
  const isSpecific = appliedRate.specific !== undefined;

  return (
    <>
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h5 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
          Rate Types Applied
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div
            className={`flex items-center gap-2 p-2 rounded border transition-all ${
              isSuspended
                ? "bg-gray-700 border-gray-700 shadow-md"
                : "bg-gray-50 border-gray-200 opacity-40"
            }`}
          >
            <div
              className={`w-2 h-2 border-2 rounded-full flex-shrink-0 ${
                isSuspended ? "border-white" : "border-gray-400"
              }`}
            ></div>
            <span
              className={`font-medium ${
                isSuspended ? "text-white" : "text-gray-500"
              }`}
            >
              Suspended
            </span>
          </div>
          <div
            className={`flex items-center gap-2 p-2 rounded border transition-all ${
              isPreferential
                ? "bg-gray-700 border-gray-700 shadow-md"
                : "bg-gray-50 border-gray-200 opacity-40"
            }`}
          >
            <div
              className={`w-2 h-2 border-2 rounded-full flex-shrink-0 ${
                isPreferential ? "border-white" : "border-gray-400"
              }`}
            ></div>
            <span
              className={`font-medium ${
                isPreferential ? "text-white" : "text-gray-500"
              }`}
            >
              Preferential (FTA)
            </span>
          </div>
          <div
            className={`flex items-center gap-2 p-2 rounded border transition-all ${
              isMFN
                ? "bg-gray-700 border-gray-700 shadow-md"
                : "bg-gray-50 border-gray-200 opacity-40"
            }`}
          >
            <div
              className={`w-2 h-2 border-2 rounded-full flex-shrink-0 ${
                isMFN ? "border-white" : "border-gray-400"
              }`}
            ></div>
            <span
              className={`font-medium ${
                isMFN ? "text-white" : "text-gray-500"
              }`}
            >
              MFN (Standard)
            </span>
          </div>
          <div
            className={`flex items-center gap-2 p-2 rounded border transition-all ${
              isSpecific
                ? "bg-gray-700 border-gray-700 shadow-md"
                : "bg-gray-50 border-gray-200 opacity-40"
            }`}
          >
            <div
              className={`w-2 h-2 border-2 rounded-full flex-shrink-0 ${
                isSpecific ? "border-white" : "border-gray-400"
              }`}
            ></div>
            <span
              className={`font-medium ${
                isSpecific ? "text-white" : "text-gray-500"
              }`}
            >
              Specific Duty
            </span>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={!canSaveHistory}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed h-10 px-6 font-semibold text-sm uppercase tracking-wide transition-all duration-200"
          >
            Save History
          </Button>
        </div>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Save</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to save this calculation to history. Are you sure
              you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveHistory}>
              Yes, Save it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
