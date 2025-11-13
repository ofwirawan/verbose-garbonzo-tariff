"use server";

import { cookies } from "next/headers";
import type { ProfileType } from "../components/profileTypes";

export interface UserProfile {
  uid: string;
  name: string | null;
  email: string;
  avatar: string;
  profileType: ProfileType | null;
}

interface UserProfileResponse {
  uid: string;
  name: string | null;
  email: string;
  roles: string;
  profileType: string | null;
}

export async function fetchCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt_token")?.value;

    if (!token) {
      console.error("[Profile] ❌ No JWT token found in cookies");
      return null;
    }

    console.log("[Profile] ✓ JWT token found in cookies");

    // Get the API base URL - use environment variable or default to localhost
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    console.log("[Profile] 🔄 Calling backend API at:", apiBaseUrl);

    // Call backend API endpoint to get user profile
    const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("[Profile] ❌ API response failed:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("[Profile] Error details:", errorText);
      return null;
    }

    const profileData: UserProfileResponse = await response.json();
    console.log("[Profile] ✓ Profile data received from backend");

    return {
      uid: profileData.uid,
      name: profileData.name || profileData.email.split("@")[0],
      email: profileData.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profileData.name || profileData.email
      )}&background=cccccc&color=ffffff`,
      profileType: (profileData.profileType as ProfileType) || null,
    };
  } catch (error) {
    console.error("[Profile] ❌ Error fetching user profile:", error);
    if (error instanceof Error) {
      console.error("[Profile] Error message:", error.message);
    }
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

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Call backend API to update profile
    const response = await fetch(`${apiBaseUrl}/api/auth/profile/update-name`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update profile: ${errorText}`);
    }

    const profileData: UserProfileResponse = await response.json();

    return {
      uid: profileData.uid,
      name: profileData.name || profileData.email.split("@")[0],
      email: profileData.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profileData.name || profileData.email
      )}&background=cccccc&color=000000`,
      profileType: (profileData.profileType as ProfileType) || null,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function updateUserProfileType(
  profileType: ProfileType | null
): Promise<UserProfile | null> {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("jwt_token")?.value;

    if (!token) {
      throw new Error("Not authenticated");
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    console.log("[ProfileType Update] Sending profile type:", profileType);

    // Call backend API to update profile type
    const response = await fetch(`${apiBaseUrl}/api/auth/profile/update-type`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profileType }),
    });

    console.log("[ProfileType Update] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ProfileType Update] Error response:", errorText);
      throw new Error(`Failed to update profile type: ${response.status} ${errorText}`);
    }

    const profileData: UserProfileResponse = await response.json();
    console.log("[ProfileType Update] Received profile data:", profileData);

    return {
      uid: profileData.uid,
      name: profileData.name || profileData.email.split("@")[0],
      email: profileData.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profileData.name || profileData.email
      )}&background=cccccc&color=ffffff`,
      profileType: (profileData.profileType as ProfileType) || null,
    };
  } catch (error) {
    console.error("[ProfileType Update] Error updating profile type:", error);
    throw error;
  }
}
