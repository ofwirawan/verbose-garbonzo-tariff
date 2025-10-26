//https://ship.freightos.com/api/shippingCalculator

import type { Country } from "@/app/dashboard/components/utils/types";

export interface FreightQuoteRequest {
  origin: string; // Country code OR city,country format
  destination: string; // Country code OR city,country format
  weight: number; // Weight in kilograms
  mode?: "air" | "ocean" | "express"; // Shipping mode
  loadtype?: "boxes" | "pallets" | "envelopes" | "crates"; // Load type
  format?: "json" | "xml"; // Response format
  // Optional: pass full country objects to use city data
  originCountry?: Country;
  destinationCountry?: Country;
}

export interface FreightQuoteResponse {
  success: boolean;
  data?: {
    minCost: number; // Minimum estimated cost in USD
    maxCost: number; // Maximum estimated cost in USD
    avgCost: number; // Average cost (calculated)
    currency: string; // Currency code (typically USD)
    transitDays?: number; // Estimated transit time in days
    transitDaysMin?: number; // Minimum transit days
    transitDaysMax?: number; // Maximum transit days
    mode: string; // Shipping mode used
  };
  error?: string;
}

/**
 * Convert country code or Country object to location string for Freightos API
 * Uses city field from Country if available, otherwise falls back to country code
 */
function countryCodeToLocation(
  countryCode: string,
  countryObject?: Country
): string {
  // If country object has city field, use it
  if (countryObject?.city) {
    return countryObject.city;
  }

  // Fallback to country code (may not work well with Freightos)
  return countryCode;
}

export async function getFreightQuote(
  request: FreightQuoteRequest
): Promise<FreightQuoteResponse> {
  try {
    // Convert country codes to location strings (using city field if available)
    const origin = countryCodeToLocation(request.origin, request.originCountry);
    const destination = countryCodeToLocation(
      request.destination,
      request.destinationCountry
    );

    // Build query parameters
    // Note: Freightos API requires dimensions for boxes
    const estimatedVolume = request.weight * 0.005; // m³ (assumes 200kg/m³ density)
    const sideDim = Math.cbrt(estimatedVolume) * 100; // Convert to cm and calculate cube dimensions

    const params = new URLSearchParams({
      origin,
      destination,
      weight: request.weight.toString(),
      width: sideDim.toFixed(0),
      length: sideDim.toFixed(0),
      height: sideDim.toFixed(0),
      loadtype: request.loadtype || "boxes",
      quantity: "1",
    });

    // Use backend proxy to avoid CORS issues
    const url = `/api/freight?${params.toString()}`;

    // Make API request to proxy endpoint
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(
        `Freightos API error: ${response.status} ${response.statusText}`
      );
    }

    // Parse response
    const data = await response.json();

    // Check for errors in response
    if (data.response?.errors) {
      throw new Error(`Freightos API: ${data.response.errors}`);
    }

    // Extract data from estimatedFreightRates
    const rates = data.response?.estimatedFreightRates;

    if (!rates || !rates.mode || rates.mode.length === 0) {
      throw new Error("No freight rates available for this route");
    }

    // Find the appropriate mode (air, ocean, express)
    const modeMap: Record<string, string[]> = {
      air: ["air"],
      ocean: ["LCL", "FCL"],
      express: ["express", "courier", "priority"],
    };

    const requestedMode = request.mode || "air";
    const matchingModes = modeMap[requestedMode];

    // Find first matching mode in response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selectedMode = rates.mode.find((m: any) =>
      matchingModes.some((mm) =>
        m.mode?.toLowerCase().includes(mm.toLowerCase())
      )
    );

    // Fallback to first available mode
    if (!selectedMode && rates.mode.length > 0) {
      selectedMode = rates.mode[0];
    }

    if (!selectedMode || !selectedMode.price) {
      throw new Error("No price data available in response");
    }

    // Extract cost information
    const minCost = selectedMode.price.min?.moneyAmount?.amount || 0;
    const maxCost = selectedMode.price.max?.moneyAmount?.amount || 0;
    const avgCost = (minCost + maxCost) / 2;
    const currency = selectedMode.price.min?.moneyAmount?.currency || "USD";

    // Extract transit times
    const transitTimes = selectedMode.transitTimes;
    const transitDaysMin = transitTimes?.min || undefined;
    const transitDaysMax = transitTimes?.max || undefined;
    const transitDays =
      transitDaysMin && transitDaysMax
        ? Math.round((transitDaysMin + transitDaysMax) / 2)
        : transitDaysMin || transitDaysMax;

    return {
      success: true,
      data: {
        minCost,
        maxCost,
        avgCost,
        currency,
        transitDays,
        transitDaysMin,
        transitDaysMax,
        mode: selectedMode.mode || requestedMode,
      },
    };
  } catch (error) {
    console.error("Freightos API Error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch freight quote. Please try again later.",
    };
  }
}

// Calculate freight cost based on country codes/objects and weight
export async function calculateFreightCost(
  originCountry: string | Country,
  destinationCountry: string | Country,
  weight: number,
  mode: "air" | "ocean" | "express" = "air"
): Promise<FreightQuoteResponse> {
  // Extract country code and object if Country type is passed
  const originCode =
    typeof originCountry === "string"
      ? originCountry
      : originCountry.country_code;
  const destCode =
    typeof destinationCountry === "string"
      ? destinationCountry
      : destinationCountry.country_code;
  const originObj =
    typeof originCountry === "object" ? originCountry : undefined;
  const destObj =
    typeof destinationCountry === "object" ? destinationCountry : undefined;

  return getFreightQuote({
    origin: originCode,
    destination: destCode,
    weight,
    mode,
    loadtype: "boxes",
    originCountry: originObj,
    destinationCountry: destObj,
  });
}
