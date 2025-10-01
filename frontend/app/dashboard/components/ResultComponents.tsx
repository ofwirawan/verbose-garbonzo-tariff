"use client";

import { TariffCalculationResult } from "./utils/types";

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
    <div
      className={`mt-8 p-6 rounded-lg ${
        result.suspensionActive === true
          ? "bg-green-50 border-2 border-green-200"
          : result.suspensionActive === false
          ? "bg-amber-50 border-2 border-amber-200"
          : "bg-gray-50"
      }`}
    >
      <ResultHeader result={result} />
      <SuspensionNotice result={result} />
      <ResultSummaryCards
        result={result}
        hasAppliedRateCard={hasAppliedRateCard}
      />
      <RateDetails result={result} suspensionNote={suspensionNote} />
      <TransactionInfo result={result} />
      <ChartLegend />
    </div>
  );
}

function ResultHeader({ result }: { result: TariffCalculationResult }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-lg font-semibold">Tariff Calculation Results</h3>
      {result.suspensionActive === true && (
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          TARIFF SUSPENDED (ACTIVE)
        </span>
      )}
      {result.suspensionActive === false && (
        <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          TARIFF SUSPENDED (INACTIVE)
        </span>
      )}
    </div>
  );
}

function SuspensionNotice({ result }: { result: TariffCalculationResult }) {
  if (result.suspensionActive === true) {
    return (
      <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-400 rounded">
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-sm text-green-700">
              <strong>Tariff Suspension Active:</strong> This trade relationship
              has an active tariff suspension, meaning no duties are charged on
              this product from the specified exporter to importer.
            </p>
            {result.suspensionNote && (
              <p className="text-sm text-green-600 mt-2 italic">
                {result.suspensionNote}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (result.suspensionActive === false) {
    return (
      <div className="mb-4 p-3 bg-amber-100 border-l-4 border-amber-400 rounded">
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              <strong>Historical Suspension Record:</strong> This trade
              relationship had a tariff suspension in the past, but it is
              currently inactive or expired. No tariff rate data is available.
            </p>
            {result.suspensionNote && (
              <p className="text-sm text-amber-600 mt-2 italic">
                {result.suspensionNote}
              </p>
            )}
          </div>
        </div>
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
      className={`grid gap-4 ${
        hasAppliedRateCard
          ? "grid-cols-2 md:grid-cols-4"
          : "grid-cols-1 md:grid-cols-3"
      }`}
    >
      {hasAppliedRateCard && <AppliedRateCard appliedRate={appliedRate} />}
      <div className="bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500">Original Trade Value</div>
        <div className="text-xl font-bold">
          ${Number(result.tradeOriginal).toLocaleString()}
        </div>
      </div>
      <DutyAmountCard result={result} />
      <div className="bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500">Final Amount</div>
        <div className="text-xl font-bold text-green-600">
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

  const getColor = () => {
    if (appliedRate?.suspension !== undefined) return "text-green-600";
    if (appliedRate?.prefAdval !== undefined) return "text-purple-600";
    return "text-blue-600";
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
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500">Applied Rate</div>
      <div className={`text-xl font-bold ${getColor()}`}>{getRate()}%</div>
      <div className="text-xs text-gray-400 mt-1">{getLabel()}</div>
    </div>
  );
}

function DutyAmountCard({ result }: { result: TariffCalculationResult }) {
  const dutyAmount = Number(result.tradeFinal) - Number(result.tradeOriginal);
  const appliedRate = result.appliedRate || {};

  const getDutyLabel = () => {
    if (dutyAmount === 0 && appliedRate.suspension !== undefined) {
      return (
        <div className="text-xs text-green-600 mt-1 font-medium">
          No duty - Suspended
        </div>
      );
    }
    if (dutyAmount === 0 && appliedRate.prefAdval !== undefined) {
      return (
        <div className="text-xs text-purple-600 mt-1 font-medium">
          No duty - FTA
        </div>
      );
    }
    if (dutyAmount > 0 && appliedRate.prefAdval !== undefined) {
      return (
        <div className="text-xs text-purple-600 mt-1 font-medium">
          Reduced - FTA
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500">Duty Amount</div>
      <div
        className={`text-xl font-bold ${
          dutyAmount === 0 ? "text-green-600" : "text-red-600"
        }`}
      >
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
    <div className="mt-4 p-4 bg-white rounded border">
      <h4 className="font-medium mb-2">Rate Details:</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {appliedRate.suspension !== undefined && (
          <div className="bg-green-50 p-3 rounded">
            <span className="text-gray-700 font-medium">Suspension Rate:</span>
            <span className="ml-2 font-bold text-green-700">
              {Number(appliedRate.suspension).toFixed(2)}%
            </span>
            <div className="text-xs text-gray-600 mt-1">Tariff suspended</div>
          </div>
        )}
        {appliedRate.prefAdval !== undefined && (
          <div className="bg-purple-50 p-3 rounded">
            <span className="text-gray-700 font-medium">
              Preferential Rate:
            </span>
            <span className="ml-2 font-bold text-purple-700">
              {Number(appliedRate.prefAdval).toFixed(2)}%
            </span>
            <div className="text-xs text-gray-600 mt-1">
              From trade agreement between {result.importerCode} and{" "}
              {result.exporterCode}
            </div>
          </div>
        )}
        {appliedRate.mfnAdval !== undefined && (
          <div className="bg-blue-50 p-3 rounded">
            <span className="text-gray-700 font-medium">MFN Ad-valorem:</span>
            <span className="ml-2 font-bold text-blue-700">
              {Number(appliedRate.mfnAdval).toFixed(2)}%
            </span>
            <div className="text-xs text-gray-600 mt-1">Standard MFN rate</div>
          </div>
        )}
        {appliedRate.specific !== undefined && (
          <div className="bg-amber-50 p-3 rounded">
            <span className="text-gray-700 font-medium">⚖️ Specific Duty:</span>
            <span className="ml-2 font-bold text-amber-700">
              ${Number(appliedRate.specific).toFixed(2)}/kg
            </span>
            <div className="text-xs text-gray-600 mt-1">Per kilogram rate</div>
          </div>
        )}
      </div>
      {suspensionNote && (
        <div className="mt-4 pt-4 border-t">
          <span className="text-gray-500">Suspension Note:</span>
          <p className="mt-1 text-gray-700 italic">{suspensionNote}</p>
        </div>
      )}
    </div>
  );
}

function TransactionInfo({ result }: { result: TariffCalculationResult }) {
  return (
    <>
      <div className="mt-4 text-sm text-gray-600">
        <strong>Product:</strong> {result.hs6} |
        <strong> Transaction Date:</strong> {result.transactionDate} |
        <strong> Importer:</strong> {result.importerCode} |
        <strong> Exporter:</strong> {result.exporterCode || "Not specified"}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <strong>Transaction ID:</strong> {result.transactionId}
      </div>
    </>
  );
}

function ChartLegend() {
  return (
    <div className="mt-4 p-3 bg-white rounded border">
      <h5 className="text-sm font-medium mb-2">Chart Legend:</h5>
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span> Suspended (0%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-600 rounded"></div>
          <span> Preferential (FTA)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span> MFN (Standard)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-black rounded"></div>
          <span>Other Tariff</span>
        </div>
      </div>
    </div>
  );
}
