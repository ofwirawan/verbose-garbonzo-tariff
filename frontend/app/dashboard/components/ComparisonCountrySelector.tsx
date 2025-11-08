"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Country, DropdownOption } from "./utils/types";
import { Combobox } from "./SharedComponents";

interface ComparisonCountrySelectorProps {
  comparisonCountries: string[];
  countryOptions: DropdownOption[];
  countries: Country[];
  exportingCountry: string;
  comparisonError: string | null;
  onAddCountry: (countryCode: string) => void;
  onRemoveCountry: (countryCode: string) => void;
  onViewResults?: () => void;
  showButton?: boolean;
}

/**
 * ComparisonCountrySelector Component
 *
 * Reusable component for selecting countries to compare.
 * Can be used in both Result and Comparison tabs.
 *
 * Features:
 * - Add up to 2 countries for comparison
 * - Visual feedback for constraints
 * - Remove selected countries
 * - Optional button to switch tabs
 * - Error handling
 */
export function ComparisonCountrySelector({
  comparisonCountries,
  countryOptions,
  countries,
  exportingCountry,
  comparisonError,
  onAddCountry,
  onRemoveCountry,
  onViewResults,
  showButton = true,
}: ComparisonCountrySelectorProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Compare with Other Source Countries
        </h3>
        <p className="text-sm text-gray-600">
          Add up to 2 additional countries to compare tariff costs side-by-side
        </p>
      </div>

      {/* Country Selector */}
      <div className="space-y-3">
        {comparisonCountries.length < 2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a country {comparisonCountries.length > 0 && `(${2 - comparisonCountries.length} remaining)`}
            </label>
            <Combobox
              value=""
              onValueChange={onAddCountry}
              options={countryOptions.filter(
                (c) =>
                  c.value !== exportingCountry &&
                  !comparisonCountries.includes(c.value)
              )}
              placeholder="Select a country..."
              searchPlaceholder="Search countries..."
              emptyText="No countries available."
            />
          </div>
        )}
        {comparisonCountries.length >= 2 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Maximum reached:</strong> Remove a country to add another
            </p>
          </div>
        )}
      </div>

      {/* Selected Countries */}
      {comparisonCountries.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Selected countries:
          </p>
          <div className="flex flex-wrap gap-2">
            {comparisonCountries.map((code) => {
              const country = countries.find(
                (c) => c.country_code === code
              );
              return (
                <div
                  key={code}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-900 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {country?.name || code}
                  <button
                    onClick={() => onRemoveCountry(code)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    type="button"
                    title="Remove country"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          {showButton && onViewResults && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={onViewResults}
                className="w-full bg-black text-white hover:bg-gray-800 font-semibold"
              >
                View Comparison Results
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Comparison Error */}
      {comparisonError && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{comparisonError}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
