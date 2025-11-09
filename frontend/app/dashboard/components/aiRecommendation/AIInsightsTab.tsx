"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfidenceIndicator } from "././ConfidenceIndicator";
import { TimingRecommendationCard } from "././TimingRecommendationCard";
import { getAIRecommendation, formatCurrency } from "../utils/ai-service";
import {
  AIRecommendationResponse,
  AIRecommendationRequest,
} from "../utils/types";
import { AlertCircle, RefreshCw, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIInsightsTabProps {
  importerCode: string;
  exporterCode?: string;
  hs6Code: string;
}

type LoadingState = "idle" | "loading" | "success" | "error";

export function AIInsightsTab({
  importerCode,
  exporterCode,
  hs6Code,
}: AIInsightsTabProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [recommendation, setRecommendation] =
    useState<AIRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRecommendations = async () => {
    setLoadingState("loading");
    setError(null);

    try {
      const request: AIRecommendationRequest = {
        importerCode,
        exporterCode: exporterCode || undefined,
        hs6Code,
      };

      const response = await getAIRecommendation(request);
      setRecommendation(response);
      setLoadingState("success");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate recommendations";
      setError(errorMessage);
      setLoadingState("error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Empty State */}
      {loadingState === "idle" && !recommendation && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Timing Insights</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get AI-powered recommendations for the best times to import/export
              this product based on historical tariff patterns.
            </p>
            <Button
              onClick={handleGenerateRecommendations}
              className="bg-primary hover:bg-primary/90"
            >
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loadingState === "loading" && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Spinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Analyzing historical data and generating recommendations...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {loadingState === "error" && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            onClick={handleGenerateRecommendations}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Alert>
      )}

      {/* Success State - Insufficient Data */}
      {recommendation && recommendation.hasInsufficientData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limited Data</AlertTitle>
          <AlertDescription>{recommendation.explanation}</AlertDescription>
        </Alert>
      )}

      {/* Success State - Results */}
      {recommendation && !recommendation.hasInsufficientData && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Analysis Summary</CardTitle>
                  <CardDescription>
                    Model v{recommendation.modelVersion}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="whitespace-nowrap">
                  {recommendation.optimalPeriods.length} Optimal Periods
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Current Rate Card */}
                <div className="bg-card rounded-lg border border-border p-4 sm:p-5 md:p-6">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Current Rate
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-foreground break-words">
                    {recommendation.currentRate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Market rate
                  </div>
                </div>

                {/* Max Potential Savings Card */}
                <div className="bg-card rounded-lg border border-border p-4 sm:p-5 md:p-6">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Max Potential Savings
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-primary break-words">
                    {recommendation.potentialSavingsPercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(recommendation.potentialSavings)}
                  </div>
                </div>

                {/* Average Confidence Card */}
                <div className="bg-card rounded-lg border border-border p-4 sm:p-5 md:p-6">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Average Confidence
                  </div>
                  <div className="mt-2">
                    <ConfidenceIndicator
                      confidence={recommendation.averageConfidence}
                      showLabel={false}
                      showPercentage={true}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Explanation Section */}
              <div className="bg-muted rounded-lg p-4 sm:p-5 md:p-6 border border-border">
                <div className="text-sm font-medium text-foreground uppercase tracking-wide mb-2">
                  Analysis Summary
                </div>
                <p className="text-sm text-foreground">
                  {recommendation.explanation}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Optimal Periods */}
          {recommendation.optimalPeriods.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">
                  🎯 Best Times to Import/Export
                </h3>
                <Badge className="bg-primary">
                  {recommendation.optimalPeriods.length} periods
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {recommendation.optimalPeriods.map((period, index) => (
                  <TimingRecommendationCard
                    key={`optimal-${index}`}
                    period={period}
                    type="optimal"
                    rank={index + 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Avoid Periods */}
          {recommendation.avoidPeriods.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-destructive">
                  ⚠️ Periods to Avoid
                </h3>
                <Badge variant="destructive">
                  {recommendation.avoidPeriods.length} periods
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {recommendation.avoidPeriods.map((period, index) => (
                  <TimingRecommendationCard
                    key={`avoid-${index}`}
                    period={period}
                    type="avoid"
                    rank={index + 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <Button
            onClick={handleGenerateRecommendations}
            variant="outline"
            className="w-full"
            disabled={loadingState === "loading"}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate Recommendations
          </Button>
        </div>
      )}

      {/* Retry button for initial error state */}
      {loadingState === "idle" && error && (
        <Button
          onClick={handleGenerateRecommendations}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
