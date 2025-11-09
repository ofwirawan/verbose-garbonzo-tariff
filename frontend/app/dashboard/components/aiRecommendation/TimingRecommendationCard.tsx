"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { OptimalPeriod, AvoidPeriod } from "../utils/types";
import {
  formatDateToDDMMYYYY,
  formatCurrency,
  isUpcomingPeriod,
  isPastPeriod,
  daysUntilPeriod,
} from "../utils/ai-service";
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimingRecommendationCardProps {
  period: OptimalPeriod | AvoidPeriod;
  type: "optimal" | "avoid";
  rank?: number;
}

export function TimingRecommendationCard({
  period,
  type,
  rank,
}: TimingRecommendationCardProps) {
  const isOptimal = type === "optimal";
  const startDate = formatDateToDDMMYYYY(period.startDate);
  const endDate = formatDateToDDMMYYYY(period.endDate);
  const isPast = isPastPeriod(period.endDate);
  const isUpcoming = isUpcomingPeriod(period.startDate) && !isPast;
  const daysUntil = daysUntilPeriod(period.startDate);

  // Type-specific values
  const percentage = isOptimal
    ? (period as OptimalPeriod).savingsPercent
    : (period as AvoidPeriod).increasePercent;

  const amount = isOptimal
    ? (period as OptimalPeriod).estimatedSavingsAmount
    : (period as AvoidPeriod).estimatedAdditionalCostAmount;

  const bgColor = isOptimal
    ? "bg-card"
    : "bg-card";
  const headerBgColor = isOptimal ? "bg-muted" : "bg-muted";
  const badgeVariant = isOptimal ? "default" : "destructive";
  const Icon = isOptimal ? TrendingDown : TrendingUp;

  return (
    <Card className={`${bgColor} border border-border overflow-hidden`}>
      <CardHeader className={`${headerBgColor} pb-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Icon
              className={
                isOptimal ? "w-5 h-5 text-primary" : "w-5 h-5 text-destructive"
              }
            />
            <div className="flex-1">
              <CardTitle
                className={isOptimal ? "text-primary" : "text-destructive"}
              >
                {isOptimal ? "Optimal Period" : "Period to Avoid"}
                {rank !== undefined && (
                  <span className="text-sm font-normal ml-2">#{rank}</span>
                )}
              </CardTitle>
            </div>
          </div>
          <div className="flex gap-2">
            {isPast && <Badge variant="outline">Past</Badge>}
            {isUpcoming && <Badge className="bg-accent">Upcoming</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Period Dates */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Period:</span>
            <span className="font-semibold">
              {startDate} to {endDate}
            </span>
          </div>
          {!isPast && daysUntil >= 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Days until:</span>
              <span
                className={
                  daysUntil <= 30
                    ? "font-semibold text-destructive"
                    : "font-semibold"
                }
              >
                {daysUntil} days
              </span>
            </div>
          )}
        </div>

        {/* Rate Information */}
        <div className="border-t border-border pt-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Rate:</span>
              <span className="font-semibold">
                {period.currentRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expected Rate:</span>
              <span className="font-semibold">
                {period.avgRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Savings/Additional Cost */}
        <div
          className={`border-t border-border pt-3 bg-muted -mx-4 px-4 py-3`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-sm font-medium ${
                isOptimal ? "text-primary" : "text-destructive"
              }`}
            >
              {isOptimal ? "Potential Savings" : "Potential Additional Cost"}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`font-bold text-lg ${
                  isOptimal ? "text-primary" : "text-destructive"
                }`}
              >
                {percentage.toFixed(2)}%
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex-shrink-0">
                      <AlertCircle
                        className={`w-4 h-4 ${
                          isOptimal ? "text-primary" : "text-destructive"
                        }`}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based on $10,000 trade value estimate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div
            className={`text-sm ${
              isOptimal ? "text-primary" : "text-destructive"
            } font-semibold`}
          >
            {isOptimal ? "Save: " : "Extra cost: "}
            {formatCurrency(amount)}
          </div>
        </div>

        {/* Confidence */}
        <div className="border-t border-border pt-3">
          <div className="mb-2">
            <span className="text-sm text-muted-foreground block mb-2">
              Confidence Level:
            </span>
            <ConfidenceIndicator
              confidence={period.confidence}
              showLabel={true}
              showPercentage={true}
              size="sm"
            />
          </div>
        </div>

        {/* Reason */}
        <div className="border-t border-border pt-3">
          <div className="flex items-start gap-2">
            <CheckCircle2
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                isOptimal ? "text-primary" : "text-destructive"
              }`}
            />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Why:</p>
              <p className="text-sm text-foreground mt-1">{period.reason}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
