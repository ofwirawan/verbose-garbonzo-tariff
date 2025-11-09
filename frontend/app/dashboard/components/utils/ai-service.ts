import { AIRecommendationRequest, AIRecommendationResponse } from "@/app/dashboard/components/utils/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Get AI timing recommendations for a trade route
 * Analyzes historical tariff data and personalizes based on user profile
 */
export async function getAIRecommendation(
  request: AIRecommendationRequest
): Promise<AIRecommendationResponse> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/recommendation`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMsg = errorData.message;
      } else if (errorData?.error) {
        errorMsg = errorData.error;
      } else if (typeof errorData === "string") {
        errorMsg = errorData;
      }
    } catch (e) {
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMsg = errorText;
        }
      } catch (textError) {
        // Keep default HTTP status message
      }
    }

    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Format date string from ISO format to DD/MM/YYYY
 */
export function formatDateToDDMMYYYY(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Format currency value with appropriate decimal places
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Get confidence level description from percentage
 * Uses theme colors: primary for high, accent for medium-high, secondary for medium, destructive for low
 */
export function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
} {
  if (confidence >= 80) {
    return { label: "Very High", color: "text-primary" };
  } else if (confidence >= 60) {
    return { label: "High", color: "text-accent" };
  } else if (confidence >= 40) {
    return { label: "Moderate", color: "text-secondary" };
  } else {
    return { label: "Low", color: "text-destructive" };
  }
}

/**
 * Get confidence background color
 * Returns empty string for transparent background
 */
export function getConfidenceBackgroundColor(): string {
  return "";
}

/**
 * Calculate days until period start
 */
export function daysUntilPeriod(startDateStr: string): number {
  try {
    const startDate = new Date(startDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    const diffTime = startDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return -1;
  }
}

/**
 * Check if a period is upcoming (within next 90 days)
 */
export function isUpcomingPeriod(startDateStr: string): boolean {
  const daysUntil = daysUntilPeriod(startDateStr);
  return daysUntil >= 0 && daysUntil <= 90;
}

/**
 * Check if a period is in the past
 */
export function isPastPeriod(endDateStr: string): boolean {
  try {
    const endDate = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return endDate.getTime() < today.getTime();
  } catch {
    return false;
  }
}

/**
 * Calculate savings amount in percentage for easy display
 */
export function calculateSavingsPercentage(savings: number, currentRate: number): number {
  if (currentRate === 0) return 0;
  return (savings / currentRate) * 100;
}
