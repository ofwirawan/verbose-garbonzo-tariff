"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { format } from "date-fns";
import { Combobox } from "../SharedComponents";
import {
  Country,
  DropdownOption,
} from "@/app/dashboard/components/utils/types";

interface ComparisonFormProps {
  countries: Country[];
  products: DropdownOption[];
  onCompare: (data: {
    destinationCountry: string;
    sourceCountries: string[];
    productCode: string;
    tradeValue: number;
    netWeight?: number;
    transactionDate: string;
    includeFreight: boolean;
    freightMode: string;
    includeInsurance: boolean;
    insuranceRate: number;
  }) => void;
  isLoading?: boolean;
  initialDestinationCountry?: string;
  initialExportingCountry?: string;
  initialProductCode?: string;
  initialTradeValue?: number;
  initialNetWeight?: number;
  initialTransactionDate?: Date;
  initialIncludeFreight?: boolean;
  initialFreightMode?: string;
  initialIncludeInsurance?: boolean;
  initialInsuranceRate?: number;
  onBack?: () => void;
}

export function ComparisonForm({
  countries,
  products,
  onCompare,
  isLoading,
  initialDestinationCountry = "",
  initialExportingCountry = "",
  initialProductCode = "",
  initialTradeValue = 1000,
  initialNetWeight,
  initialTransactionDate = new Date(),
  initialIncludeFreight = false,
  initialFreightMode = "ocean",
  initialIncludeInsurance = false,
  initialInsuranceRate = 0.5,
  onBack,
}: ComparisonFormProps) {
  const [destinationCountry, setDestinationCountry] = useState<string>(
    initialDestinationCountry
  );
  const [sourceCountries, setSourceCountries] = useState<string[]>(
    initialExportingCountry ? [initialExportingCountry] : []
  );
  const [productCode, setProductCode] = useState<string>(initialProductCode);
  const [tradeValue, setTradeValue] = useState<number>(initialTradeValue);
  const [netWeight, setNetWeight] = useState<number | undefined>(
    initialNetWeight
  );
  const [transactionDate, setTransactionDate] = useState<Date>(
    initialTransactionDate
  );
  const [includeFreight, setIncludeFreight] = useState(initialIncludeFreight);
  const [freightMode, setFreightMode] = useState<string>(initialFreightMode);
  const [includeInsurance, setIncludeInsurance] = useState(
    initialIncludeInsurance
  );
  const [insuranceRate, setInsuranceRate] =
    useState<number>(initialInsuranceRate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const countryOptions: DropdownOption[] = countries.map((c) => ({
    label: c.name,
    value: c.country_code,
  }));

  const handleAddSourceCountry = (code: string) => {
    if (!sourceCountries.includes(code) && sourceCountries.length < 3) {
      setSourceCountries([...sourceCountries, code]);
    }
  };

  const handleRemoveSourceCountry = (code: string) => {
    setSourceCountries(sourceCountries.filter((c) => c !== code));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!destinationCountry) {
      newErrors.push("Destination country is required");
    }

    if (sourceCountries.length === 0) {
      newErrors.push("Select at least one source country");
    }

    if (!productCode) {
      newErrors.push("Product is required");
    }

    if (tradeValue <= 0) {
      newErrors.push("Trade value must be greater than 0");
    }

    if (netWeight !== undefined && netWeight <= 0) {
      newErrors.push("Net weight must be greater than 0");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleCompare = () => {
    if (!validateForm()) return;

    onCompare({
      destinationCountry,
      sourceCountries,
      productCode,
      tradeValue,
      netWeight,
      transactionDate: format(transactionDate, "yyyy-MM-dd"),
      includeFreight,
      freightMode,
      includeInsurance,
      insuranceRate,
    });
  };

  const getCountryName = (code: string): string => {
    return countries.find((c) => c.country_code === code)?.name || code;
  };

  const getProductName = (code: string): string => {
    return products.find((p) => p.value === code)?.label || code;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Compare Tariff Routes</CardTitle>
            <CardDescription>
              Compare tariff costs for the same product across up to 3 source
              countries
            </CardDescription>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
              title="Back to single calculation"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Destination Country */}
        <div className="space-y-2">
          <Label htmlFor="destination">Destination Country</Label>
          <Combobox
            options={countryOptions}
            value={destinationCountry}
            onValueChange={setDestinationCountry}
            placeholder="Select destination country..."
            id="destination"
            searchPlaceholder="Search countries..."
            emptyText="No country found."
          />
        </div>

        {/* Product */}
        <div className="space-y-2">
          <Label htmlFor="product">Product (HS6 Code)</Label>
          <Combobox
            options={products}
            value={productCode}
            onValueChange={setProductCode}
            placeholder="Search by product or HS6 code..."
            id="product"
            searchPlaceholder="Search products or HS6 codes..."
            emptyText="No product found."
          />
        </div>

        {/* Source Countries */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="source-countries">
              Source Countries ({sourceCountries.length}/3)
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Select 2-3 countries to compare
            </p>
          </div>

          <Combobox
            options={countryOptions.filter(
              (c) => !sourceCountries.includes(c.value)
            )}
            value=""
            onValueChange={handleAddSourceCountry}
            placeholder="Add source country..."
            id="source-countries"
            searchPlaceholder="Search countries..."
            emptyText="No countries available."
          />

          {sourceCountries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {sourceCountries.map((code) => (
                <Badge key={code} variant="secondary" className="gap-2 py-1.5">
                  {getCountryName(code)}
                  <button
                    onClick={() => handleRemoveSourceCountry(code)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Trade Value */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trade-value">Trade Value (USD)</Label>
            <Input
              id="trade-value"
              type="number"
              min="0"
              step="100"
              value={tradeValue}
              onChange={(e) => setTradeValue(Number(e.target.value))}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="net-weight">Net Weight (kg) - Optional</Label>
            <Input
              id="net-weight"
              type="number"
              min="0"
              step="0.1"
              value={netWeight || ""}
              onChange={(e) =>
                setNetWeight(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Transaction Date */}
        <div className="space-y-2">
          <Label>Transaction Date</Label>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={isLoading}
              >
                {format(transactionDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={transactionDate}
                onSelect={(date) => {
                  if (date) {
                    setTransactionDate(date);
                    setShowDatePicker(false);
                  }
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("2000-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Freight Options */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-freight"
              checked={includeFreight}
              onChange={(e) => setIncludeFreight(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4"
            />
            <Label htmlFor="include-freight" className="cursor-pointer">
              Include Freight Costs
            </Label>
          </div>

          {includeFreight && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="freight-mode">Freight Mode</Label>
              <Select value={freightMode} onValueChange={setFreightMode}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="air">Air Freight</SelectItem>
                  <SelectItem value="ocean">Ocean Freight</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Insurance Options */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-insurance"
              checked={includeInsurance}
              onChange={(e) => setIncludeInsurance(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4"
            />
            <Label htmlFor="include-insurance" className="cursor-pointer">
              Include Insurance
            </Label>
          </div>

          {includeInsurance && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="insurance-rate">Insurance Rate (%)</Label>
              <Input
                id="insurance-rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={insuranceRate}
                onChange={(e) => setInsuranceRate(Number(e.target.value))}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Compare Button */}
        <Button
          onClick={handleCompare}
          disabled={isLoading}
          size="lg"
          className="w-full"
        >
          {isLoading ? "Comparing..." : "Compare Tariffs"}
        </Button>
      </CardContent>
    </Card>
  );
}
