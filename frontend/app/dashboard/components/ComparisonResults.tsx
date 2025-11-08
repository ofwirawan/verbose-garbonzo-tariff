"use client";

import { ComparisonAnalysis } from "./utils/types";
import { CalculationResults } from "./ResultComponents";
import { ComparisonChart } from "./comparisonItem/ComparisonChart";
import { ComparisonExport } from "./comparisonItem/ComparisonExport";

interface ComparisonResultsProps {
  comparison: ComparisonAnalysis;
  destinationCountry: string;
  productCode: string;
  isLoading?: boolean;
}

/**
 * ComparisonResults Component
 *
 * Displays the results of a tariff comparison across multiple source countries.
 * Reuses the CalculationResults component for consistent display of individual results.
 *
 * Key Features:
 * - Visual comparison chart
 * - Individual results for each source country using CalculationResults
 * - Export functionality
 * - Summary information
 */
export function ComparisonResults({
  comparison,
  destinationCountry,
  productCode,
  isLoading = false,
}: ComparisonResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 mt-6 pt-6 border-t border-border">
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-border">
      {/* Export Button */}
      <div className="flex justify-end">
        <ComparisonExport
          results={comparison.results}
          destinationCountry={destinationCountry}
          productCode={productCode}
        />
      </div>

      {/* Comparison Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Cost Comparison</h3>
        <ComparisonChart data={comparison.chartData} />
      </div>

      {/* Individual Results */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Detailed Results by Country</h3>
        <div className="space-y-6">
          {comparison.results.map((result, index) => (
            <div key={index} className="border-t border-border pt-6 first:border-t-0 first:pt-0">
              {/* Country Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center px-3 py-1 bg-primary text-primary-foreground rounded-md font-semibold text-sm">
                    #{result.rank}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-foreground">
                      {result.countryName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.rank === 1
                        ? "Best Option"
                        : `+${result.percentDiff.toFixed(1)}% more expensive`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reuse CalculationResults Component */}
              <CalculationResults
                result={result.result}
                suspensionNote={null}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Summary Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Results show total landed cost including product
          value, applicable tariffs, freight, and insurance. Expand each result
          to view the detailed breakdown of applied rates and charges.
        </p>
      </div>
    </div>
  );
}
