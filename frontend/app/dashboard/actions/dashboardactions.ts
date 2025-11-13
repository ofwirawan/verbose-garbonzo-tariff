"use server";
import { PrismaClient } from "@prisma/client";
import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Country {
  countryCode: string;
  name: string;
  numericCode: string;
  city?: string;
  valuationBasis?: string;
}

interface Product {
  hs6Code: string;
  description?: string;
}

export async function fetchUser() {
  // Use shared Supabase client instance
  const { data: user } = await supabase.auth.getUser();
  return { user };
}

/**
 * Fetch all countries from Java backend API
 * Calls GET /api/metadata/countries endpoint
 */
export async function fetchCountries() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/metadata/countries`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "force-cache",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.statusText}`);
    }

    const countries: Country[] = await response.json();

    // Transform API response to match frontend expectations
    const transformedCountries = countries.map((country) => ({
      country_code: country.countryCode,
      name: country.name,
      numeric_code: country.numericCode,
      city: country.city || null,
      valuation_basis: country.valuationBasis || null,
    }));

    return { countries: transformedCountries };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unknown error fetching countries from API"
    );
  }
}

/**
 * Fetch all products from Java backend API
 * Calls GET /api/metadata/products endpoint
 */
export async function fetchProduct() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/metadata/products`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "force-cache",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const products: Product[] = await response.json();

    // Transform API response to match frontend expectations
    const transformedProducts = products.map((product) => ({
      hs6code: product.hs6Code,
      description: product.description || null,
    }));

    return { products: transformedProducts };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unknown error fetching products from API"
    );
  }
}

export async function fetchSuspensionsByProduct(
  importerCode: string,
  productCode: string,
  startYear: number,
  endYear: number
) {
  const prisma = new PrismaClient();
  try {
    const suspensions = await prisma.suspension.findMany({
      where: {
        importer_code: importerCode,
        product_code: productCode,
        suspension_flag: true,
        OR: [
          {
            valid_from: {
              gte: new Date(`${startYear}-01-01`),
              lte: new Date(`${endYear}-12-31`),
            },
          },
          {
            AND: [
              { valid_from: { lte: new Date(`${endYear}-12-31`) } },
              {
                OR: [
                  { valid_to: null },
                  { valid_to: { gte: new Date(`${startYear}-01-01`) } },
                ],
              },
            ],
          },
        ],
      },
      select: {
        valid_from: true,
        valid_to: true,
      },
      orderBy: { valid_from: "asc" },
    });
    return { suspensions };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unknown error fetching suspensions"
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function fetchSuspensionNote(
  importerCode: string,
  productCode: string,
  transactionDate: string
) {
  const prisma = new PrismaClient();
  try {
    const suspension = await prisma.suspension.findFirst({
      where: {
        importer_code: importerCode,
        product_code: productCode,
        suspension_flag: true,
        valid_from: { lte: new Date(transactionDate) },
        OR: [
          { valid_to: null },
          { valid_to: { gte: new Date(transactionDate) } },
        ],
      },
      select: {
        suspension_note: true,
      },
    });
    return { suspensionNote: suspension?.suspension_note || null };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unknown error fetching suspension note"
    );
  } finally {
    await prisma.$disconnect();
  }
}
