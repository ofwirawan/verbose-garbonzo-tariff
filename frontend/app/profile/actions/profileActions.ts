"use server";

import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import type { ProfileType } from "../components/profileTypes";

export interface UserProfile {
  uid: string;
  name: string | null;
  email: string;
  avatar: string;
  profileType: ProfileType | null;
}

interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: string | number;
}

// Helper function to decode JWT without external library
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWT format");
      return null;
    }

    const payload = parts[1];
    // Add padding if needed
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export async function fetchCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt_token")?.value;

    if (!token) {
      console.error("No JWT token found in cookies");
      return null;
    }

    // Decode JWT token to get email (without verification since we just need the email)
    // The token was already verified by the backend
    const decoded = decodeJWT(token);
    if (!decoded) {
      console.error("Failed to decode JWT token");
      return null;
    }

    const email = decoded?.sub;
    if (!email) {
      console.error("Email not found in JWT token");
      return null;
    }

    // Fetch user info from Prisma database
    const prisma = new PrismaClient();
    try {
      const userInfo = await prisma.user_info.findUnique({
        where: { email },
        select: {
          uid: true,
          name: true,
          email: true,
          profile_type: true,
        },
      });

      if (!userInfo) {
        console.error("User not found in database for email:", email);
        return null;
      }

      return {
        uid: userInfo.uid,
        name: userInfo.name || email.split("@")[0],
        email: userInfo.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          userInfo.name || email
        )}&background=cccccc&color=ffffff`,
        profileType: userInfo.profile_type as ProfileType | null,
      };
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  newName: string
): Promise<UserProfile | null> {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt_token")?.value;

    if (!token) {
      throw new Error("Not authenticated");
    }

    // Decode JWT token to get email
    const decoded = decodeJWT(token);
    if (!decoded) {
      throw new Error("Invalid token");
    }

    const email = decoded?.sub;
    if (!email) {
      throw new Error("Email not found in token");
    }

    // Update user info in database
    const prisma = new PrismaClient();
    try {
      const updatedUser = await prisma.user_info.update({
        where: { email },
        data: {
          name: newName.trim(),
        },
        select: {
          uid: true,
          name: true,
          email: true,
          profile_type: true,
        },
      });

      return {
        uid: updatedUser.uid,
        name: updatedUser.name || email.split("@")[0],
        email: updatedUser.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          updatedUser.name || email
        )}&background=cccccc&color=000000`,
        profileType: updatedUser.profile_type as ProfileType | null,
      };
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function updateUserProfileType(
  profileType: string
): Promise<UserProfile | null> {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt_token")?.value;

    if (!token) {
      throw new Error("Not authenticated");
    }

    // Decode JWT token to get email
    const decoded = decodeJWT(token);
    if (!decoded) {
      throw new Error("Invalid token");
    }

    const email = decoded?.sub;
    if (!email) {
      throw new Error("Email not found in token");
    }

    // Update user profile type in database
    const prisma = new PrismaClient();
    try {
      const updatedUser = await prisma.user_info.update({
        where: { email },
        data: {
          profile_type: profileType,
        },
        select: {
          uid: true,
          name: true,
          email: true,
          profile_type: true,
        },
      });

      return {
        uid: updatedUser.uid,
        name: updatedUser.name || email.split("@")[0],
        email: updatedUser.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          updatedUser.name || email
        )}&background=cccccc&color=ffffff`,
        profileType: updatedUser.profile_type as ProfileType | null,
      };
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Error updating profile type:", error);
    throw error;
  }
}
