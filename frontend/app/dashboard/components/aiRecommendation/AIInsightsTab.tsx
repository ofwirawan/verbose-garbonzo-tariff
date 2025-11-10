"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfidenceIndicator } from "././ConfidenceIndicator";
import { TimingRecommendationCard } from "././TimingRecommendationCard";
import { getAIRecommendation, getGeminiSummary, formatCurrency } from "../utils/ai-service";
import {
  AIRecommendationResponse,
  AIRecommendationRequest,
  GeminiSummaryRequest,
} from "../utils/types";
import { AlertCircle, RefreshCw, Zap, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIInsightsTabProps {
  importerCode: string;
  exporterCode?: string;
  hs6Code: string;
}

type LoadingState = "idle" | "loading" | "success" | "error";
type GeminiState = "idle" | "loading" | "loaded" | "error";

export function AIInsightsTab({
  importerCode,
  exporterCode,
  hs6Code,
}: AIInsightsTabProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [geminiState, setGeminiState] = useState<GeminiState>("idle");
  const [recommendation, setRecommendation] =
    useState<AIRecommendationResponse | null>(null);
  const [geminiSummary, setGeminiSummary] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchGeminiSummary = useCallback(async () => {
    if (!recommendation) return;

    console.log("🤖 [Gemini] Starting Gemini summary fetch...");
    setGeminiState("loading");

    try {
      const request: GeminiSummaryRequest = {
        importerCode,
        exporterCode: exporterCode || undefined,
        hs6Code,
        recommendation,
      };

      console.log("🤖 [Gemini] Sending request to /api/ai/gemini-summary");
      const response = await getGeminiSummary(request);

      console.log("🤖 [Gemini] Response received:", {
        success: response.success,
        profileType: response.profileType,
        summaryLength: response.summary?.length || 0,
      });

      if (response.success && response.summary) {
        console.log("✅ [Gemini] Summary loaded successfully!");
        setGeminiSummary(response.summary);
        setGeminiState("loaded");
      } else {
        console.warn("⚠️ [Gemini] Response indicates no summary available");
        setGeminiState("error");
      }
    } catch (err) {
      console.error("❌ [Gemini] Error fetching Gemini summary:", err);
      setGeminiState("error");
    }
  }, [importerCode, exporterCode, hs6Code, recommendation]);

  // Option 1: Two-Phase Approach - Fetch Gemini summary after ML results
  useEffect(() => {
    if (loadingState === "success" && recommendation && geminiState === "idle") {
      fetchGeminiSummary();
    }
  }, [loadingState, recommendation, geminiState, fetchGeminiSummary]);

  const handleGenerateRecommendations = async () => {
    setLoadingState("loading");
    setGeminiState("idle");
    setGeminiSummary("");
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
      {/* Empty State - Minimalist Design */}
      {loadingState === "idle" && !recommendation && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="mb-6">
              <Zap className="w-14 h-14 text-primary mx-auto opacity-80" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Timing Insights</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Unlock AI-powered recommendations for optimal import/export timing based on historical tariff patterns.
            </p>
            <Button
              onClick={handleGenerateRecommendations}
              size="lg"
              className="bg-primary hover:bg-primary/90 px-8"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Insights
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loadingState === "loading" && (
        <Card>
          <CardContent className="pt-16 pb-16 text-center">
            <Spinner className="w-8 h-8 mx-auto mb-6" />
            <p className="text-sm text-muted-foreground font-medium">
              Analyzing historical data...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {loadingState === "error" && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to Generate Insights</AlertTitle>
          <AlertDescription className="mt-2">{error}</AlertDescription>
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

      {/* Insufficient Data State */}
      {recommendation && recommendation.hasInsufficientData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limited Historical Data</AlertTitle>
          <AlertDescription className="mt-2">{recommendation.explanation}</AlertDescription>
        </Alert>
      )}

      {/* Success State - Minimalist Layout */}
      {recommendation && !recommendation.hasInsufficientData && (
        <div className="space-y-4">
          {/* Key Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Current Rate */}
            <Card className="border border-border/50">
              <CardContent className="pt-5 pb-5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Current Rate
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {recommendation.currentRate.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            {/* Potential Savings */}
            <Card className="border border-primary/20 bg-primary/5">
              <CardContent className="pt-5 pb-5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Max Savings
                </div>
                <div className="text-3xl font-bold text-primary">
                  {recommendation.potentialSavingsPercent.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(recommendation.potentialSavings)}
                </div>
              </CardContent>
            </Card>

            {/* Confidence */}
            <Card className="border border-border/50">
              <CardContent className="pt-5 pb-5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Confidence
                </div>
                <ConfidenceIndicator
                  confidence={recommendation.averageConfidence}
                  showLabel={false}
                  showPercentage={true}
                  size="sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* ML Analysis Summary */}
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {recommendation.explanation}
              </p>
            </CardContent>
          </Card>

          {/* Gemini AI Summary Section (Option 1: Two-Phase) */}
          {geminiState === "loading" && (
            <Card className="border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <Spinner className="w-5 h-5" />
                  <div className="text-sm text-muted-foreground">
                    AI is generating personalized insights...
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {geminiState === "loaded" && geminiSummary && (
            <Card className="border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent animate-in fade-in duration-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">AI Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-foreground/90 leading-relaxed space-y-3">
                  {geminiSummary.split('\n').map((line, idx) => {
                    // Bold lines that start with **
                    if (line.includes('**')) {
                      return (
                        <div key={idx} className="font-semibold text-foreground">
                          {line.replace(/\*\*/g, '')}
                        </div>
                      );
                    }
                    // Skip empty lines but preserve paragraph breaks
                    if (line.trim() === '') {
                      return null;
                    }
                    // Regular text
                    return (
                      <p key={idx} className="text-sm">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimal Periods */}
          {recommendation.optimalPeriods.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Best Times to Trade
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {recommendation.optimalPeriods.length} periods
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2">
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
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold text-destructive">
                  Periods to Avoid
                </h3>
                <Badge variant="destructive" className="text-xs">
                  {recommendation.avoidPeriods.length} periods
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2">
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

          {/* Regenerate Button */}
          <Button
            onClick={handleGenerateRecommendations}
            variant="outline"
            className="w-full text-sm"
            disabled={loadingState === "loading"}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate Insights
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
