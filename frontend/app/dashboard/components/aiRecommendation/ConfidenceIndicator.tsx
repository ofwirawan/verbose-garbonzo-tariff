"use client";

import { getConfidenceLevel } from "../utils/ai-service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface ConfidenceIndicatorProps {
  confidence: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceIndicator({
  confidence,
  showLabel = true,
  showPercentage = true,
  size = "md",
}: ConfidenceIndicatorProps) {
  const { label, color } = getConfidenceLevel(confidence);
  const progressColor = getProgressBarColor(confidence);

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Percentage font sizes match the summary card values: text-lg sm:text-2xl
  const percentageSizeClasses = {
    sm: "text-lg sm:text-2xl",
    md: "text-lg sm:text-2xl",
    lg: "text-lg sm:text-2xl",
  };

  const containerPadding = {
    sm: "px-2 py-1",
    md: "px-3 py-2",
    lg: "px-4 py-3",
  };

  const progressHeight = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3",
  };

  return (
    <TooltipProvider>
      <div className={`${containerPadding[size]}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              {showLabel && (
                <span
                  className={`${labelSizeClasses[size]} font-semibold ${color}`}
                >
                  {label}
                </span>
              )}
              {showPercentage && (
                <span
                  className={`${percentageSizeClasses[size]} font-bold text-foreground`}
                >
                  {confidence}%
                </span>
              )}
            </div>
            <div className={`${progressHeight[size]} w-full bg-secondary/20 rounded-full overflow-hidden border border-secondary/30`}>
              <div
                className={`${progressHeight[size]} rounded-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex-shrink-0 hover:opacity-75 transition-opacity">
                <InfoIcon
                  className={`${
                    size === "sm"
                      ? "w-5 h-5"
                      : size === "lg"
                      ? "w-6 h-6"
                      : "w-5 h-5"
                  } ${color}`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              <p className="text-sm">
                Confidence level indicates how reliable this prediction is based
                on historical data. Higher confidence means more reliable
                recommendations.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Get progress bar color based on confidence level
 * Uses vibrant theme colors with distinct visual differences
 */
function getProgressBarColor(confidence: number): string {
  if (confidence >= 80) {
    // High confidence - vibrant primary (warm brown)
    return "bg-primary shadow-md";
  } else if (confidence >= 60) {
    // Medium-high confidence - vibrant accent (warm taupe)
    return "bg-accent shadow-sm";
  } else if (confidence >= 40) {
    // Medium confidence - vibrant secondary
    return "bg-secondary";
  } else {
    // Low confidence - vibrant destructive (warm red)
    return "bg-destructive shadow-sm";
  }
}
