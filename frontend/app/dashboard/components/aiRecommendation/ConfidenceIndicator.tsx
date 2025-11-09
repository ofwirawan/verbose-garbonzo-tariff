"use client";

import {
  getConfidenceLevel,
  getConfidenceBackgroundColor,
} from "../utils/ai-service";
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
  const bgColor = getConfidenceBackgroundColor(confidence);

  // Calculate progress width
  const progressWidth = Math.max(0, Math.min(100, confidence));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const containerPadding = {
    sm: "px-2 py-1",
    md: "px-3 py-2",
    lg: "px-4 py-3",
  };

  return (
    <TooltipProvider>
      <div className={`${containerPadding[size]} ${bgColor} rounded-lg border border-border`}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              {showLabel && (
                <span
                  className={`${labelSizeClasses[size]} font-medium ${color}`}
                >
                  {label}
                </span>
              )}
              {showPercentage && (
                <span
                  className={`${labelSizeClasses[size]} font-semibold ${color}`}
                >
                  {confidence}%
                </span>
              )}
            </div>
            <div
              className={`${sizeClasses[size]} w-full bg-muted rounded-full overflow-hidden`}
            >
              <div
                className={`${
                  sizeClasses[size]
                } rounded-full transition-all duration-300 ${getProgressBarColor(
                  confidence
                )}`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex-shrink-0">
                <InfoIcon
                  className={`${
                    size === "sm"
                      ? "w-3 h-3"
                      : size === "lg"
                      ? "w-5 h-5"
                      : "w-4 h-4"
                  } ${color}`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>
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
 * Uses theme colors: primary for high confidence, accent for medium-high, muted for medium, destructive for low
 */
function getProgressBarColor(confidence: number): string {
  if (confidence >= 80) {
    // High confidence - use primary (warm brown)
    return "bg-primary";
  } else if (confidence >= 60) {
    // Medium-high confidence - use accent (warm taupe)
    return "bg-accent";
  } else if (confidence >= 40) {
    // Medium confidence - use secondary
    return "bg-secondary";
  } else {
    // Low confidence - use destructive (warm red)
    return "bg-destructive";
  }
}
