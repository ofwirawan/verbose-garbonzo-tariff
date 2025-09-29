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
