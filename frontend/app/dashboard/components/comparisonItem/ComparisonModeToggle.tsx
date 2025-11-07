"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, Calculator } from "lucide-react";

interface ComparisonModeToggleProps {
  mode: "single" | "compare";
  onModeChange: (mode: "single" | "compare") => void;
}

export function ComparisonModeToggle({
  mode,
  onModeChange,
}: ComparisonModeToggleProps) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="text-sm font-medium text-gray-700">Calculation Mode:</span>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(value) => {
          if (value) {
            onModeChange(value as "single" | "compare");
          }
        }}
        className="border border-gray-200 rounded-lg p-1"
      >
        <ToggleGroupItem
          value="single"
          aria-label="Single calculation"
          className="gap-2"
        >
          <Calculator className="h-4 w-4" />
          <span className="hidden sm:inline">Single Calculation</span>
          <span className="sm:hidden">Single</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="compare"
          aria-label="Compare countries"
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Compare Countries</span>
          <span className="sm:hidden">Compare</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
