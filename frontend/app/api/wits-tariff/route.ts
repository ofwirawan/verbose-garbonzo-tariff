import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reporterCode = searchParams.get("reporter");
  const partnerCode = searchParams.get("partner") || "000";
  const productCode = searchParams.get("product");
  const year = searchParams.get("year");

  if (!reporterCode || !productCode || !year) {
    return NextResponse.json(
      { error: "Missing required parameters: reporter, product, and year are required" },
      { status: 400 }
    );
  }

  try {
    // Build WITS API URL
    const witsUrl = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN/reporter/${reporterCode}/partner/${partnerCode}/product/${productCode}/year/${year}/datatype/reported`;

    console.log("Proxying request to WITS API:", witsUrl);

    // Fetch from WITS API
    const response = await fetch(witsUrl, {
      headers: {
        Accept: "application/xml",
      },
    });

    if (!response.ok) {
      console.error(`WITS API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `WITS API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const xmlData = await response.text();

    // Return XML data with proper content type
    return new NextResponse(xmlData, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error fetching from WITS API:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from WITS API" },
      { status: 500 }
    );
  }
}
