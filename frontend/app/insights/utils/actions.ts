"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get total number of calculations performed by all users
 */
export async function getTotalCalculations() {
  try {
    const total = await prisma.transaction.count();
    return { totalCalculations: total };
  } catch (error) {
    console.error("Error fetching total calculations:", error);
    return { totalCalculations: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get unique countries count
 */
export async function getCountriesCount() {
  try {
    const count = await prisma.country.count();
    return { countriesCount: count };
  } catch (error) {
    console.error("Error fetching countries count:", error);
    return { countriesCount: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get average tariff rate across all transactions
 */
export async function getAverageTariffRate() {
  try {
    const transactions = await prisma.transaction.findMany({
      select: {
        applied_rate: true,
      },
    });

    if (transactions.length === 0) {
      return { averageRate: 0 };
    }

    let totalRate = 0;
    let rateCount = 0;

    transactions.forEach((tx) => {
      if (tx.applied_rate && typeof tx.applied_rate === "object") {
        const rate = tx.applied_rate as Record<string, unknown>;

        // Try different rate fields in priority order
        if (typeof rate.suspension === "number") {
          totalRate += rate.suspension;
          rateCount++;
        } else if (typeof rate.prefAdval === "number") {
          totalRate += rate.prefAdval;
          rateCount++;
        } else if (typeof rate.mfnAdval === "number") {
          totalRate += rate.mfnAdval;
          rateCount++;
        }
      }
    });

    const averageRate = rateCount > 0 ? (totalRate / rateCount).toFixed(2) : 0;
    return { averageRate };
  } catch (error) {
    console.error("Error fetching average rate:", error);
    return { averageRate: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get total unique HS6 product codes
 */
export async function getTotalProducts() {
  try {
    const count = await prisma.product.count();
    return { totalProducts: count };
  } catch (error) {
    console.error("Error fetching products count:", error);
    return { totalProducts: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get top products by calculation frequency
 */
export async function getTopProducts(limit = 6) {
  try {
    const topProducts = await prisma.transaction.groupBy({
      by: ["hs6code"],
      _count: {
        tid: true,
      },
      orderBy: {
        _count: {
          tid: "desc",
        },
      },
      take: limit,
    });

    // Fetch product details for each top product
    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { hs6code: item.hs6code },
        });

        return {
          product: item.hs6code,
          calculations: item._count.tid,
          description: product?.description || "Unknown",
        };
      })
    );

    return { topProducts: productsWithDetails };
  } catch (error) {
    console.error("Error fetching top products:", error);
    return { topProducts: [] };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get calculation trends by month
 */
export async function getCalculationTrends() {
  try {
    const transactions = await prisma.transaction.findMany({
      select: {
        t_date: true,
      },
      orderBy: {
        t_date: "asc",
      },
    });

    // Group by month
    const monthlyData: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.t_date) {
        const date = new Date(tx.t_date);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      }
    });

    // Convert to array and get last 10 months
    const trends = Object.entries(monthlyData)
      .slice(-10)
      .map(([month, calculations]) => {
        const [, monthNum] = month.split("-");
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return {
          month: monthNames[parseInt(monthNum) - 1],
          calculations,
        };
      });

    return { trends };
  } catch (error) {
    console.error("Error fetching calculation trends:", error);
    return { trends: [] };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get regional tariff comparison (average rate by importing country)
 */
export async function getRegionalComparison() {
  try {
    const regionalData = await prisma.transaction.groupBy({
      by: ["importer_code"],
      _count: {
        tid: true,
      },
      orderBy: {
        _count: {
          tid: "desc",
        },
      },
      take: 6,
    });

    // Fetch country details and calculate average rates
    const regionsWithDetails = await Promise.all(
      regionalData.map(async (item) => {
        const country = await prisma.country.findUnique({
          where: { country_code: item.importer_code },
        });

        // Get average rate for this importer
        const transactions = await prisma.transaction.findMany({
          where: { importer_code: item.importer_code },
          select: { applied_rate: true },
        });

        let avgRate = 0;
        let rateCount = 0;

        transactions.forEach((tx) => {
          if (tx.applied_rate && typeof tx.applied_rate === "object") {
            const rate = tx.applied_rate as Record<string, unknown>;
            if (typeof rate.mfnAdval === "number") {
              avgRate += rate.mfnAdval;
              rateCount++;
            }
          }
        });

        avgRate =
          rateCount > 0 ? parseFloat((avgRate / rateCount).toFixed(1)) : 0;

        return {
          region: country?.name || item.importer_code,
          avgRate,
          totalRoutes: item._count.tid,
          change: 0, // Calculate based on previous period if needed
        };
      })
    );

    return { regions: regionsWithDetails };
  } catch (error) {
    console.error("Error fetching regional comparison:", error);
    return { regions: [] };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get recent calculations
 */
export async function getRecentCalculations(limit = 5) {
  try {
    const calculations = await prisma.transaction.findMany({
      select: {
        tid: true,
        t_date: true,
        importer_code: true,
        exporter_code: true,
        hs6code: true,
        applied_rate: true,
      },
      orderBy: {
        t_date: "desc",
      },
      take: limit,
    });

    const detailedCalculations = await Promise.all(
      calculations.map(async (calc) => {
        const importerCountry = await prisma.country.findUnique({
          where: { country_code: calc.importer_code },
        });

        const exporterCountry = calc.exporter_code
          ? await prisma.country.findUnique({
              where: { country_code: calc.exporter_code },
            })
          : null;

        // Determine rate and status
        let rate = 0;
        let type = "Ad-valorem";
        let status: "suspended" | "active" | "preferential" = "active";

        if (calc.applied_rate && typeof calc.applied_rate === "object") {
          const appliedRate = calc.applied_rate as Record<string, unknown>;

          if (typeof appliedRate.suspension === "number") {
            rate = appliedRate.suspension;
            status = "suspended";
            type = "Suspended";
          } else if (typeof appliedRate.prefAdval === "number") {
            rate = appliedRate.prefAdval;
            status = "preferential";
            type = "Preferential";
          } else if (typeof appliedRate.mfnAdval === "number") {
            rate = appliedRate.mfnAdval;
            type = "Ad-valorem";
          }
        }

        return {
          id: calc.tid.toString(),
          date: calc.t_date
            ? new Date(calc.t_date).toISOString().split("T")[0]
            : "N/A",
          importer: importerCountry?.name || calc.importer_code,
          exporter: exporterCountry?.name || calc.exporter_code || "N/A",
          product: calc.hs6code,
          rate: parseFloat(rate.toString()),
          type,
          status,
        };
      })
    );

    return { calculations: detailedCalculations };
  } catch (error) {
    console.error("Error fetching recent calculations:", error);
    return { calculations: [] };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get active trade agreements (unique importer-exporter pairs with preferential rates)
 */
export async function getTradeAgreements(limit = 5) {
  try {
    // Get unique importer-exporter pairs with preferential rates
    const preferences = await prisma.preference.findMany({
      select: {
        importer_code: true,
        exporter_code: true,
        product_code: true,
        valid_from: true,
        valid_to: true,
      },
      distinct: ["importer_code", "exporter_code"],
      take: limit,
    });

    const agreementsWithDetails = await Promise.all(
      preferences.map(async (pref) => {
        const importerCountry = await prisma.country.findUnique({
          where: { country_code: pref.importer_code },
        });

        const exporterCountry = await prisma.country.findUnique({
          where: { country_code: pref.exporter_code },
        });

        // Count suspended tariffs for this pair
        const suspendedCount = await prisma.suspension.count({
          where: {
            importer_code: pref.importer_code,
          },
        });

        // Determine status
        const now = new Date();
        let status: "active" | "expiring" | "inactive" = "active";
        let expiryDate: string | undefined;

        if (pref.valid_to) {
          const validToDate = new Date(pref.valid_to);
          const daysUntilExpiry = Math.floor(
            (validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
            status = "expiring";
            expiryDate = pref.valid_to.toISOString().split("T")[0];
          } else if (daysUntilExpiry <= 0) {
            status = "inactive";
          }
        }

        return {
          id: `${pref.importer_code}-${pref.exporter_code}`,
          name: `${importerCountry?.name || pref.importer_code} ↔ ${
            exporterCountry?.name || pref.exporter_code
          }`,
          countries: [pref.importer_code, pref.exporter_code],
          status,
          suspendedTariffs: suspendedCount,
          expiryDate,
        };
      })
    );

    return { agreements: agreementsWithDetails };
  } catch (error) {
    console.error("Error fetching trade agreements:", error);
    return { agreements: [] };
  } finally {
    await prisma.$disconnect();
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
 * Get tariff rate changes (increases/decreases) by country
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
 * Scrape news articles from WTO press releases
 */
async function scrapeWTOArticles() {
  try {
    const response = await fetch(
      "https://www.wto.org/english/news_e/news_e.htm",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) return null;

    const html = await response.text();

    // Collect multiple articles
    const articles = [];
    const articleRegex =
      /<a\s+href="([^"]*\/english\/news_e\/[^"]+\.htm)"[^>]*>([^<]{15,})<\/a>/gi;
    let match;

    while ((match = articleRegex.exec(html)) && articles.length < 5) {
      const href = match[1];
      const title = match[2]?.trim();

      // Skip generic pages and navigation
      if (
        title &&
        !href.includes("news_e.htm") &&
        !href.includes("news_e/news") &&
        title.length > 15
      ) {
        const url = href.startsWith("http")
          ? href
          : `https://www.wto.org${href}`;
        articles.push({
          title: title,
          url: url,
        });
      }
    }

    // Return random article from collected articles
    return articles.length > 0
      ? articles[Math.floor(Math.random() * articles.length)]
      : null;
  } catch (error) {
    console.error("Error scraping WTO:", error);
    return null;
  }
}

/**
 * Scrape news articles from USITC news releases
 */
async function scrapeUSITCArticles() {
  try {
    const response = await fetch("https://www.usitc.gov", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Collect multiple press release links
    const articles = [];
    const articleRegex =
      /<a\s+href="([^"]*\/press_room\/news_release\/\d{4}\/[^"]+\.htm)"[^>]*>([^<]{10,})<\/a>/gi;
    let match;

    while ((match = articleRegex.exec(html)) && articles.length < 5) {
      if (match[1]) {
        const url = match[1].startsWith("http")
          ? match[1]
          : `https://www.usitc.gov${match[1]}`;
        articles.push({
          title: match[2]?.trim() || "USITC News Release",
          url: url,
        });
      }
    }

    // Return random article from collected articles
    return articles.length > 0
      ? articles[Math.floor(Math.random() * articles.length)]
      : null;
  } catch (error) {
    console.error("Error scraping USITC:", error);
    return null;
  }
}

/**
 * Scrape news articles from EU Commission trade news
 */
async function scrapeEUTradeArticles() {
  try {
    const response = await fetch("https://ec.europa.eu/trade/news", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Collect multiple article links
    const articles = [];
    const articleRegex = /<a\s+href="([^"]*\/news\/[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = articleRegex.exec(html)) && articles.length < 5) {
      const href = match[1];
      const title = match[2]?.trim();

      // Make sure it's not just the main news page
      if (
        title &&
        !href.endsWith("/news") &&
        !href.endsWith("/news/") &&
        href.includes("_")
      ) {
        const url = href.startsWith("http")
          ? href
          : `https://ec.europa.eu${href}`;
        articles.push({
          title: title,
          url: url,
        });
      }
    }

    // Return random article from collected articles
    return articles.length > 0
      ? articles[Math.floor(Math.random() * articles.length)]
      : null;
  } catch (error) {
    console.error("Error scraping EU:", error);
    return null;
  }
}

/**
 * Scrape chemical industry news from Chemical & Engineering News (ACS)
 */
async function scrapeChemicalProductsNews() {
  try {
    // Chemical & Engineering News (ACS) - reliable source for chemical industry news
    const response = await fetch("https://cen.acs.org/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Collect multiple article links
    const articles = [];
    const articleRegex =
      /<a\s+href="([^"]*\/articles\/\d+\/[^"]*\.html)"[^>]*>([^<]{10,})<\/a>/gi;
    let match;

    while ((match = articleRegex.exec(html)) && articles.length < 5) {
      if (match[1]) {
        const href = match[1];
        const url = href.startsWith("http")
          ? href
          : `https://cen.acs.org${href}`;
        articles.push({
          title: match[2]?.trim() || "Chemical & Engineering News Article",
          url: url,
        });
      }
    }

    // Return random article from collected articles
    return articles.length > 0
      ? articles[Math.floor(Math.random() * articles.length)]
      : null;
  } catch (error) {
    console.error("Error scraping chemical products news:", error);
    return null;
  }
}

/**
 * Scrape Asia-Pacific news from Asia Times
 */
async function scrapeAsiaPacificNews() {
  try {
    // Asia Times - reliable source for Asia-Pacific trade and economic news
    const response = await fetch("https://asiatimes.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Collect multiple article links
    const articles = [];
    const articleRegex =
      /<a\s+href="(https:\/\/asiatimes\.com\/\d{4}\/\d{2}\/[^"]+\/)"[^>]*>([^<]{10,})<\/a>/gi;
    let match;

    while ((match = articleRegex.exec(html)) && articles.length < 5) {
      if (match[1] && match[2]) {
        articles.push({
          title: match[2]?.trim() || "Asia Times Article",
          url: match[1],
        });
      }
    }

    // Return random article from collected articles
    return articles.length > 0
      ? articles[Math.floor(Math.random() * articles.length)]
      : null;
  } catch (error) {
    console.error("Error scraping Asia-Pacific news:", error);
    return null;
  }
}

/**
 * Get trade-related news from official sources with web scraping
 * Tries to fetch real articles, falls back to news pages
 */
export async function getTradeNews() {
  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    const twoDaysAgo = new Date(today.getTime() - 172800000);
    const threeDaysAgo = new Date(today.getTime() - 259200000);
    const fourDaysAgo = new Date(today.getTime() - 345600000);

    // Scrape real articles from sources with timeout
    const scrapePromises = Promise.race([
      Promise.allSettled([
        scrapeWTOArticles(),
        scrapeUSITCArticles(),
        scrapeEUTradeArticles(),
        scrapeChemicalProductsNews(),
        scrapeAsiaPacificNews(),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Scraping timeout")), 5000)
      ),
    ]);

    interface ScrapedArticle {
      title: string;
      url: string;
    }

    interface SettledPromise {
      status: "fulfilled" | "rejected";
      value?: ScrapedArticle | null;
    }

    let scrapedArticles: SettledPromise[] = [];
    try {
      const result = await scrapePromises;
      if (Array.isArray(result)) {
        scrapedArticles = result as SettledPromise[];
      }
    } catch (error) {
      // Timeout or error in scraping, use fallback
      console.warn("Scraping timeout or error:", error);
      scrapedArticles = [];
    }

    const wtoData =
      scrapedArticles[0]?.status === "fulfilled"
        ? scrapedArticles[0].value
        : null;
    const usitcData =
      scrapedArticles[1]?.status === "fulfilled"
        ? scrapedArticles[1].value
        : null;
    const euData =
      scrapedArticles[2]?.status === "fulfilled"
        ? scrapedArticles[2].value
        : null;
    const chemicalData =
      scrapedArticles[3]?.status === "fulfilled"
        ? scrapedArticles[3].value
        : null;
    const asiaPacificData =
      scrapedArticles[4]?.status === "fulfilled"
        ? scrapedArticles[4].value
        : null;

    // Log successful scrapes for debugging
    console.log("Scrape results:");
    console.log("  WTO:", wtoData ? `✓ ${wtoData.title}` : "✗ Failed");
    console.log("  USITC:", usitcData ? `✓ ${usitcData.title}` : "✗ Failed");
    console.log("  EU:", euData ? `✓ ${euData.title}` : "✗ Failed");
    console.log(
      "  Chemical:",
      chemicalData ? `✓ ${chemicalData.title}` : "✗ Failed"
    );
    console.log(
      "  Asia-Pacific:",
      asiaPacificData ? `✓ ${asiaPacificData.title}` : "✗ Failed"
    );

    const news = [
      {
        id: 1,
        title: wtoData?.title || "WTO Press Releases",
        source: "wto.org",
        url: wtoData?.url || "https://www.wto.org/news/pressreleases",
        date: today.toISOString().split("T")[0],
        impact: "high" as const,
        category: "International",
        summary:
          "World Trade Organization publishes latest trade statistics, tariff analysis, and global trade updates.",
      },
      {
        id: 2,
        title: usitcData?.title || "USITC News Releases",
        source: "usitc.gov",
        url:
          usitcData?.url || "https://www.usitc.gov/news-events/news-releases",
        date: yesterday.toISOString().split("T")[0],
        impact: "high" as const,
        category: "USA",
        summary:
          "US International Trade Commission updates tariff schedules and announces trade remedy investigations.",
      },
      {
        id: 3,
        title: euData?.title || "EU Trade News",
        source: "ec.europa.eu",
        url: euData?.url || "https://ec.europa.eu/trade/news",
        date: twoDaysAgo.toISOString().split("T")[0],
        impact: "high" as const,
        category: "EU",
        summary:
          "European Commission announces trade policy changes, tariff adjustments, and commercial agreements.",
      },
      {
        id: 4,
        title: chemicalData?.title || "Chemical & Engineering News",
        source: "cen.acs.org",
        url: chemicalData?.url || "https://cen.acs.org/",
        date: threeDaysAgo.toISOString().split("T")[0],
        impact: "medium" as const,
        category: "Chemicals",
        summary:
          "Chemical & Engineering News (ACS) covers chemical industry developments, tariff policies, and market trends affecting chemical product manufacturing and trade.",
      },
      {
        id: 5,
        title: asiaPacificData?.title || "Asia-Pacific Economic News",
        source: "asiatimes.com",
        url: asiaPacificData?.url || "https://asiatimes.com/",
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
