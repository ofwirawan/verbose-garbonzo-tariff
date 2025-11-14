const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Get top products by calculation frequency
 */
export async function getTopProducts(limit: number = 10) {
  try {
    const url = `${API_BASE_URL}/api/statistics/top-products?limit=${limit}`;
    console.log("Fetching top products from:", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "omit",
    });
    console.log("Top products response status:", response.status);

    if (!response.ok) {
      console.warn(`API returned ${response.status}: ${response.statusText}`);
      return { topProducts: [] };
    }
    const data = await response.json();
    console.log("Top products data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching top products:", error);
    return { topProducts: [] };
  }
}

/**
 * Get calculation trends over the last 12 months
 */
export async function getCalculationTrends() {
  try {
    const url = `${API_BASE_URL}/api/statistics/calculation-trends`;
    console.log("Fetching calculation trends from:", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Calculation trends response status:", response.status);

    if (!response.ok) {
      console.warn(`API returned ${response.status}: ${response.statusText}`);
      return { trends: [] };
    }
    const data = await response.json();
    console.log("Calculation trends data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching calculation trends:", error);
    return { trends: [] };
  }
}

/**
 * Get total number of calculations performed by all users
 */
export async function getTotalCalculations() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/statistics/total-calculations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      console.warn(`getTotalCalculations returned ${response.status}`);
      return { totalCalculations: 0 };
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching total calculations:", error);
    return { totalCalculations: 0 };
  }
}

/**
 * Get unique countries count
 */
export async function getCountriesCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/statistics/countries-count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      console.warn(`getCountriesCount returned ${response.status}`);
      return { countriesCount: 0 };
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching countries count:", error);
    return { countriesCount: 0 };
  }
}

/**
 * Get average tariff rate across all transactions
 */
export async function getAverageTariffRate() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/statistics/average-tariff-rate`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      console.warn(`getAverageTariffRate returned ${response.status}`);
      return { averageRate: 0 };
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching average rate:", error);
    return { averageRate: 0 };
  }
}

/**
 * Get total unique HS6 product codes
 */
export async function getTotalProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/statistics/products-count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      console.warn(`getTotalProducts returned ${response.status}`);
      return { totalProducts: 0 };
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching products count:", error);
    return { totalProducts: 0 };
  }
}

/**
 * Mock tariff data based on recent WITS data
 */
const mockTariffData: Record<
  string,
  { country: string; rate: number; name: string }
> = {
  USA: { country: "USA", rate: 3.76, name: "United States" },
  CHN: { country: "CHN", rate: 5.22, name: "China" },
  DEU: { country: "DEU", rate: 2.41, name: "Germany" },
  JPN: { country: "JPN", rate: 2.48, name: "Japan" },
  GBR: { country: "GBR", rate: 2.89, name: "United Kingdom" },
  FRA: { country: "FRA", rate: 2.31, name: "France" },
  IND: { country: "IND", rate: 6.48, name: "India" },
  CAN: { country: "CAN", rate: 1.82, name: "Canada" },
  MEX: { country: "MEX", rate: 2.24, name: "Mexico" },
  AUS: { country: "AUS", rate: 2.21, name: "Australia" },
};

/**
 * Get global tariff rates using mock data
 */
export async function getGlobalTariffRates(
  countries: string[] = ["USA", "CHN", "DEU", "JPN", "GBR", "FRA"]
) {
  try {
    const tariffData = countries
      .map(
        (country) =>
          mockTariffData[country] || { country, rate: 0, name: country }
      )
      .filter((t) => t.rate > 0)
      .sort((a, b) => b.rate - a.rate);

    console.log("Global tariff data:", tariffData);

    return {
      globalTariffs: tariffData,
    };
  } catch (error) {
    console.error("Error in getGlobalTariffRates:", error);
    return {
      globalTariffs: countries
        .map(
          (country) =>
            mockTariffData[country] || { country, rate: 0, name: country }
        )
        .filter((t) => t.rate > 0)
        .sort((a, b) => b.rate - a.rate),
    };
  }
}

/**
 * Fetch bilateral tariff data from WITS API with fallback
 */
export async function getBilateralTariffData(
  importer: string,
  exporter: string,
  year: number = new Date().getFullYear()
) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://wits.worldbank.org/api/v1/Tariff?` +
        `reporter=${importer}&` +
        `partner=${exporter}&` +
        `product=ALL&` +
        `year=${year}&` +
        `indicator=MRDFRT&` +
        `format=json`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const importerMock = mockTariffData[importer];
      return {
        importerRate: importerMock?.rate || 0,
        importerName: importerMock?.name || importer,
        exporterName: mockTariffData[exporter]?.name || exporter,
        year,
      };
    }

    const data = await response.json();
    const tariffRate = data.data?.[0]?.value || 0;

    return {
      importerRate: parseFloat(tariffRate.toFixed(2)),
      importerName: data.data?.[0]?.reporterName || importer,
      exporterName: data.data?.[0]?.partnerName || exporter,
      year,
    };
  } catch (error) {
    console.warn("Error fetching bilateral tariff data, using mock:", error);
    const importerMock = mockTariffData[importer];
    return {
      importerRate: importerMock?.rate || 0,
      importerName: importerMock?.name || importer,
      exporterName: mockTariffData[exporter]?.name || exporter,
      year,
    };
  }
}

/**
 * Fetch product-specific tariff data from WITS API
 */
export async function getProductTariffData(
  country: string,
  hsCode: string,
  year: number = new Date().getFullYear()
) {
  try {
    const response = await fetch(
      `https://wits.worldbank.org/api/v1/Tariff?` +
        `reporter=${country}&` +
        `partner=WLD&` +
        `product=${hsCode}&` +
        `year=${year}&` +
        `indicator=MRDFRT&` +
        `format=json`
    );

    if (!response.ok) {
      return { tariffRate: 0, product: hsCode, country };
    }

    const data = await response.json();
    const result = data.data?.[0];

    return {
      tariffRate: result?.value || 0,
      product: result?.productCode || hsCode,
      productDescription: result?.productDescription || "Unknown",
      country: result?.reporterName || country,
      year,
    };
  } catch (error) {
    console.error("Error fetching product tariff data:", error);
    return { tariffRate: 0, product: hsCode, country };
  }
}

/**
 * Fetch tariff data for multiple countries over time
 */
export async function getTariffTrendData(
  countries: string[] = ["USA", "CHN"],
  years: number[] = [2021, 2022, 2023, 2024]
) {
  try {
    const trends = await Promise.all(
      years.map(async (year) => {
        const yearData: Record<string, string | number> = { year };

        for (const country of countries) {
          try {
            const response = await fetch(
              `https://wits.worldbank.org/api/v1/Tariff?` +
                `reporter=${country}&` +
                `partner=WLD&` +
                `product=ALL&` +
                `year=${year}&` +
                `indicator=MRDFRT&` +
                `format=json`
            );

            if (response.ok) {
              const data = await response.json();
              yearData[country] = parseFloat(
                (data.data?.[0]?.value || 0).toString()
              ).toFixed(2);
            }
          } catch (err) {
            console.error(`Error fetching ${country} for ${year}:`, err);
          }
        }

        return yearData;
      })
    );

    return { tariffTrends: trends };
  } catch (error) {
    console.error("Error fetching tariff trends:", error);
    return { tariffTrends: [] };
  }
}

/**
 * Get tariff rate changes
 */
export async function getTariffChanges() {
  try {
    const changes = [
      {
        country: "USA",
        change: 2.5,
        direction: "up",
        reason: "Steel tariffs increased",
        date: "2025-10-15",
      },
      {
        country: "China",
        change: 1.8,
        direction: "down",
        reason: "Trade negotiation agreement",
        date: "2025-10-10",
      },
      {
        country: "EU",
        change: 3.2,
        direction: "up",
        reason: "Agricultural protection measures",
        date: "2025-10-08",
      },
      {
        country: "India",
        change: 0.5,
        direction: "down",
        reason: "Regional trade agreement",
        date: "2025-10-05",
      },
      {
        country: "Mexico",
        change: 1.2,
        direction: "up",
        reason: "New import restrictions",
        date: "2025-10-01",
      },
      {
        country: "Japan",
        change: 0.3,
        direction: "down",
        reason: "Tariff reduction phase",
        date: "2025-09-28",
      },
    ];

    return { tariffChanges: changes };
  } catch (error) {
    console.error("Error fetching tariff changes:", error);
    return { tariffChanges: [] };
  }
}

/**
 * Get trade-related news from official sources
 */
export async function getTradeNews() {
  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    const twoDaysAgo = new Date(today.getTime() - 172800000);
    const threeDaysAgo = new Date(today.getTime() - 259200000);
    const fourDaysAgo = new Date(today.getTime() - 345600000);

    const news = [
      {
        id: 1,
        title: "WTO Press Releases",
        source: "wto.org",
        url: "https://www.wto.org/news/pressreleases",
        date: today.toISOString().split("T")[0],
        impact: "high" as const,
        category: "International",
        summary:
          "World Trade Organization publishes latest trade statistics, tariff analysis, and global trade updates.",
      },
      {
        id: 2,
        title: "USITC News Releases",
        source: "usitc.gov",
        url: "https://www.usitc.gov/news-events/news-releases",
        date: yesterday.toISOString().split("T")[0],
        impact: "high" as const,
        category: "USA",
        summary:
          "US International Trade Commission updates tariff schedules and announces trade remedy investigations.",
      },
      {
        id: 3,
        title: "EU Trade News",
        source: "ec.europa.eu",
        url: "https://ec.europa.eu/trade/news",
        date: twoDaysAgo.toISOString().split("T")[0],
        impact: "high" as const,
        category: "EU",
        summary:
          "European Commission announces trade policy changes, tariff adjustments, and commercial agreements.",
      },
      {
        id: 4,
        title: "Chemical & Engineering News",
        source: "cen.acs.org",
        url: "https://cen.acs.org/",
        date: threeDaysAgo.toISOString().split("T")[0],
        impact: "medium" as const,
        category: "Chemicals",
        summary:
          "Chemical & Engineering News (ACS) covers chemical industry developments, tariff policies, and market trends affecting chemical product manufacturing and trade.",
      },
      {
        id: 5,
        title: "Asia-Pacific Economic News",
        source: "asiatimes.com",
        url: "https://asiatimes.com/",
        date: fourDaysAgo.toISOString().split("T")[0],
        impact: "medium" as const,
        category: "Regional",
        summary:
          "Asia Times provides comprehensive coverage of Asia-Pacific trade developments, economic trends, tariff policies, and regional trade agreements affecting the region.",
      },
    ];

    return { news };
  } catch (error) {
    console.error("Error fetching trade news:", error);

    // Return news pages as fallback
    return {
      news: [
        {
          id: 1,
          title: "WTO Press Releases",
          source: "wto.org",
          url: "https://www.wto.org/news/pressreleases",
          date: new Date().toISOString().split("T")[0],
          impact: "high" as const,
          category: "International",
          summary: "Visit WTO for latest trade news and statistics.",
        },
        {
          id: 2,
          title: "USITC News Releases",
          source: "usitc.gov",
          url: "https://www.usitc.gov/news-events/news-releases",
          date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
          impact: "high" as const,
          category: "USA",
          summary: "Visit USITC for tariff and trade investigation updates.",
        },
        {
          id: 3,
          title: "EU Trade News",
          source: "ec.europa.eu",
          url: "https://ec.europa.eu/trade/news",
          date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
          impact: "high" as const,
          category: "EU",
          summary: "Visit EU Commission for trade policy updates.",
        },
      ],
    };
  }
}

/**
 * Get tariff volatility index by sector
 */
export async function getTariffVolatility() {
  try {
    const volatility = [
      {
        sector: "Steel & Metals",
        volatility: 8.5,
        trend: "increasing",
        products: "Steel, Aluminum, Iron ore",
      },
      {
        sector: "Agricultural",
        volatility: 6.2,
        trend: "stable",
        products: "Grains, Dairy, Meat",
      },
      {
        sector: "Technology",
        volatility: 7.1,
        trend: "increasing",
        products: "Semiconductors, Electronics",
      },
      {
        sector: "Chemicals",
        volatility: 4.8,
        trend: "decreasing",
        products: "Pharmaceuticals, Plastics",
      },
      {
        sector: "Textiles",
        volatility: 5.3,
        trend: "stable",
        products: "Clothing, Fabric, Yarn",
      },
      {
        sector: "Automotive",
        volatility: 6.9,
        trend: "increasing",
        products: "Vehicles, Parts, Components",
      },
    ];

    return { volatility };
  } catch (error) {
    console.error("Error fetching tariff volatility:", error);
    return { volatility: [] };
  }
}

/**
 * Get bilateral tariff comparison between two countries
 */
export async function getBilateralComparison(
  country1: string,
  country2: string
) {
  try {
    const comparisons: Record<
      string,
      Record<string, { rate: number; products: string[] }>
    > = {
      USA: {
        CHN: {
          rate: 12.5,
          products: ["Electronics", "Machinery", "Chemicals"],
        },
        MEX: { rate: 2.1, products: ["Automotive", "Chemicals", "Plastics"] },
        DEU: { rate: 3.2, products: ["Machinery", "Vehicles", "Chemicals"] },
      },
      CHN: {
        USA: { rate: 8.3, products: ["Grains", "Semiconductors", "Machinery"] },
        DEU: { rate: 2.8, products: ["Machinery", "Chemicals", "Vehicles"] },
        JPN: { rate: 4.1, products: ["Electronics", "Machinery", "Chemicals"] },
      },
      DEU: {
        USA: { rate: 3.2, products: ["Automotive", "Chemicals", "Machinery"] },
        CHN: { rate: 5.5, products: ["Electronics", "Steel", "Machinery"] },
      },
    };

    const data = comparisons[country1]?.[country2] || { rate: 0, products: [] };
    return { comparison: { country1, country2, ...data } };
  } catch (error) {
    console.error("Error fetching bilateral comparison:", error);
    return { comparison: null };
  }
}

/**
 * Get tariff hotspots - countries/sectors with sudden changes
 */
export async function getTariffHotspots() {
  try {
    const hotspots = [
      {
        id: 1,
        country: "USA",
        sector: "Steel",
        change: "+15%",
        severity: "critical",
        affectedCountries: ["China", "India", "Vietnam"],
        impact: "Significant price increases in construction materials",
      },
      {
        id: 2,
        country: "China",
        sector: "Technology",
        change: "+8%",
        severity: "high",
        affectedCountries: ["USA", "Taiwan", "South Korea"],
        impact: "Semiconductor supply chain disruptions",
      },
      {
        id: 3,
        country: "EU",
        sector: "Agriculture",
        change: "-5%",
        severity: "medium",
        affectedCountries: ["Brazil", "Argentina", "USA"],
        impact: "Increased agricultural imports",
      },
      {
        id: 4,
        country: "India",
        sector: "Electronics",
        change: "+12%",
        severity: "high",
        affectedCountries: ["China", "Vietnam", "Thailand"],
        impact: "Consumer electronics prices likely to increase",
      },
    ];

    return { hotspots };
  } catch (error) {
    console.error("Error fetching tariff hotspots:", error);
    return { hotspots: [] };
  }
}
