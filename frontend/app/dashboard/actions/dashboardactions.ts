"use server";
import { PrismaClient } from "@prisma/client";
import { supabase } from "@/lib/supabaseClient";

export async function fetchUser() {
  // Use shared Supabase client instance
  const { data: user } = await supabase.auth.getUser();
  return { user };
}

export async function fetchCountries() {
  const prisma = new PrismaClient();
  let countries = [];
  try {
    countries = await prisma.country.findMany({
      select: { country_code: true, name: true, numeric_code: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unknown error fetching countries"
    );
  } finally {
    await prisma.$disconnect();
  }
  return { countries };
}

export async function fetchProduct() {
  const prisma = new PrismaClient();
  let products = [];
  try {
    products = await prisma.product.findMany({
      select: { hs6code: true, description: true },
      orderBy: { description: "asc" },
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Unknown error fetching products"
    );
  } finally {
    await prisma.$disconnect();
  }
  return { products };
}

export async function fetchTopSuspension() {
  const prisma = new PrismaClient();
  try {
    const suspension = await prisma.suspension.findFirst({
      where: { suspension_flag: true },
      orderBy: { suspension_id: "desc" },
      select: {
        importer_code: true,
        product_code: true,
        valid_from: true,
        valid_to: true,
      },
    });
    return { suspension };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unknown error fetching suspension"
    );
  } finally {
    await prisma.$disconnect();
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
