import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from the request
    const { searchParams } = new URL(request.url);

    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const weight = searchParams.get("weight");
    const width = searchParams.get("width");
    const length = searchParams.get("length");
    const height = searchParams.get("height");
    const loadtype = searchParams.get("loadtype") || "boxes";
    const quantity = searchParams.get("quantity") || "1";

    // Validate required parameters
    if (!origin || !destination || !weight) {
      return NextResponse.json(
        { error: "Missing required parameters: origin, destination, weight" },
        { status: 400 }
      );
    }

    // Build Freightos API URL
    const freightosParams = new URLSearchParams({
      origin,
      destination,
      weight,
      width: width || "50",
      length: length || "50",
      height: height || "50",
      loadtype,
      quantity,
    });

    const freightosUrl = `https://ship.freightos.com/api/shippingCalculator?${freightosParams.toString()}`;

    // Make request to Freightos API from server-side
    const response = await fetch(freightosUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0", // Some APIs require a user agent
      },
    });

    if (!response.ok) {
      console.error(
        "[Freight Proxy] Freightos API error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        {
          error: `Freightos API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the response with CORS headers
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("[Freight Proxy] Error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch freight quote",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
