"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File } from "lucide-react";
import { ComparisonResult } from "@/app/dashboard/components/utils/types";

interface ComparisonExportProps {
  results: ComparisonResult[];
  destinationCountry: string;
  productCode: string;
  fileName?: string;
}

export function ComparisonExport({
  results,
  destinationCountry,
  productCode,
  fileName = "tariff-comparison",
}: ComparisonExportProps) {
  const generateCSV = (): void => {
    if (results.length === 0) return;

    // CSV headers
    const headers = [
      "Rank",
      "Source Country",
      "Country Code",
      "Product Code",
      "Destination",
      "Product Value (USD)",
      "MFN Rate (%)",
      "Preferential Rate (%)",
      "Suspension Rate (%)",
      "Specific Duty (per kg)",
      "Duty Amount (USD)",
      "Freight Cost (USD)",
      "Freight Type",
      "Insurance Cost (USD)",
      "Insurance Rate (%)",
      "Total Landed Cost (USD)",
      "Percent Difference (%)",
    ];

    // CSV rows
    const rows = results.map((result) => {
      const appliedRate = result.result.appliedRate || {};
      const totalCost = result.result.totalLandedCost || result.result.tradeFinal;
      const dutyAmount = (result.result.tradeFinal || 0) - (result.result.tradeOriginal || 0);

      return [
        result.rank,
        result.countryName,
        result.country,
        productCode,
        destinationCountry,
        result.result.tradeOriginal || 0,
        appliedRate.mfnAdval || "",
        appliedRate.prefAdval || "",
        appliedRate.suspension || "",
        appliedRate.specific || "",
        dutyAmount,
        result.result.freightCost || 0,
        result.result.freightType || "",
        result.result.insuranceCost || 0,
        result.result.insuranceRate || 0,
        totalCost,
        result.percentDiff.toFixed(2),
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const cellStr = String(cell);
            if (cellStr.includes(",") || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${fileName}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = (): void => {
    generateCSV();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
          <File className="h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-2 text-gray-500">
          <FileText className="h-4 w-4" />
          <span>Export as PDF (Coming soon)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
