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
    countries = await prisma.countries.findMany({
      select: { iso_code: true, name: true },
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
