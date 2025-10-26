/**
 * Freightos API Client
 *
 * Direct integration with Freightos public shipping calculator API
 * API Documentation: https://ship.freightos.com/api/shippingCalculator
 *
 * No authentication required for public marketplace rates
 * Rate limit: 100 calls per hour per IP address
 */

export interface FreightQuoteRequest {
  origin: string; // Country code will be converted to city,country
  destination: string; // Country code will be converted to city,country
  weight: number; // Weight in kilograms
  mode?: "air" | "ocean" | "express"; // Shipping mode
  loadtype?: "boxes" | "pallets" | "envelopes" | "crates"; // Load type
  format?: "json" | "xml"; // Response format
}

/**
 * Map country codes to major city,country format for Freightos API
 */
const COUNTRY_TO_LOCATION: Record<string, string> = {
  USA: "New York,NY",
  CHN: "Shanghai,China",
  JPN: "Tokyo,Japan",
  KOR: "Seoul,South Korea",
  DEU: "Hamburg,Germany",
  GBR: "London,UK",
  FRA: "Paris,France",
  IND: "Mumbai,India",
  SGP: "Singapore",
  AUS: "Sydney,Australia",
  CAN: "Toronto,Canada",
  MEX: "Mexico City,Mexico",
  BRA: "Sao Paulo,Brazil",
  ITA: "Milan,Italy",
  ESP: "Barcelona,Spain",
  NLD: "Rotterdam,Netherlands",
  BEL: "Antwerp,Belgium",
  THA: "Bangkok,Thailand",
  VNM: "Ho Chi Minh City,Vietnam",
  MYS: "Kuala Lumpur,Malaysia",
  IDN: "Jakarta,Indonesia",
  PHL: "Manila,Philippines",
  ARE: "Dubai,UAE",
  SAU: "Jeddah,Saudi Arabia",
  ZAF: "Cape Town,South Africa",
  EGY: "Cairo,Egypt",
  TUR: "Istanbul,Turkey",
  RUS: "Moscow,Russia",
  POL: "Warsaw,Poland",
  SWE: "Stockholm,Sweden",
  NOR: "Oslo,Norway",
  DNK: "Copenhagen,Denmark",
  FIN: "Helsinki,Finland",
};

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
 * Convert country code to location string for Freightos API
 */
function countryCodeToLocation(countryCode: string): string {
  return COUNTRY_TO_LOCATION[countryCode] || countryCode;
}

export async function getFreightQuote(
  request: FreightQuoteRequest
): Promise<FreightQuoteResponse> {
  try {
    // Convert country codes to location strings
    const origin = countryCodeToLocation(request.origin);
    const destination = countryCodeToLocation(request.destination);

    console.log(
      `[Freight] Requesting quote: ${origin} → ${destination} (${
        request.weight
      }kg, ${request.mode || "air"})`
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

    // Construct API URL
    const url = `https://ship.freightos.com/api/shippingCalculator?${params.toString()}`;

    // Make API request
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

    console.log("[Freight] API Response:", JSON.stringify(data, null, 2));

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
      express: ["express", "air"],
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

    console.log(
      `[Freight] Quote: $${avgCost.toFixed(2)} (${minCost}-${maxCost}), ${
        transitDays || "N/A"
      } days`
    );

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

// Calculate freight cost based on country codes and weight
export async function calculateFreightCost(
  originCountry: string,
  destinationCountry: string,
  weight: number,
  mode: "air" | "ocean" | "express" = "air"
): Promise<FreightQuoteResponse> {
  return getFreightQuote({
    origin: originCountry,
    destination: destinationCountry,
    weight,
    mode,
    loadtype: "boxes",
  });
}
