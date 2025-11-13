"use client";

// Admin API Service Layer
// Use Next.js API proxy instead of direct backend calls to avoid mixed content errors
const API_BASE_URL = `/api/admin`;

// Helper function to get auth headers - retrieve token from cookies
function getAuthHeaders(): HeadersInit {
  let token: string | null = null;

  // Only access cookies in browser environment
  if (typeof window !== "undefined") {
    // Get token from cookies
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("jwt_token="))
      ?.split("=")[1];

    token = cookieValue || null;
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Helper function to refresh the access token using refresh token
async function refreshToken(): Promise<string | null> {
  try {
    console.log("[API] Attempting to refresh access token...");

    // Get refresh token from cookies
    let refreshTokenValue: string | null = null;
    if (typeof window !== "undefined") {
      const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("refresh_token="))
        ?.split("=")[1];
      refreshTokenValue = cookieValue || null;
    }

    if (!refreshTokenValue) {
      console.error("[API] No refresh token found");
      // Redirect to login if no refresh token
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return null;
    }

    // Call refresh endpoint with refresh token
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshTokenValue}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const newAccessToken = data.accessToken;

      if (newAccessToken) {
        // Update the access token cookie (30 minutes)
        document.cookie = `jwt_token=${newAccessToken}; path=/; max-age=1800; SameSite=Strict`;
        console.log("[API] Access token refreshed successfully");
        return newAccessToken;
      }
    }

    // If refresh fails, redirect to login
    if (response.status === 401 || response.status === 403) {
      console.warn("[API] Token refresh failed with status:", response.status, "- Redirecting to login");
      if (typeof window !== "undefined") {
        // Clear both token cookies
        document.cookie = "jwt_token=; path=/; max-age=0;";
        document.cookie = "refresh_token=; path=/; max-age=0;";
        // Redirect to login
        window.location.href = "/login";
      }
    } else {
      console.warn("[API] Token refresh failed with status:", response.status);
    }
  } catch (error) {
    console.error("[API] Error refreshing token:", error);
    // On error, redirect to login for safety
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return null;
}

// Generic fetch wrapper with automatic token refresh
async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  let response = await fetch(url, {
    ...options,
    headers: getAuthHeaders(),
  });

  // If we get a 401 or 403, try to refresh the token and retry once
  if ((response.status === 401 || response.status === 403) && typeof window !== "undefined") {
    console.log("[API] Received 401/403, attempting token refresh...");
    const newToken = await refreshToken();

    if (newToken) {
      console.log("[API] Retrying request with refreshed token");
      response = await fetch(url, {
        ...options,
        headers: getAuthHeaders(),
      });
    }
  }

  return response;
}

// Helper function for API calls with better error handling and token refresh
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API Error (${response.status}): ${errorText || response.statusText}`
    );
  }

  return response.json();
}

// Types
export interface Country {
  countryCode: string;
  numericCode: string;
  name: string;
  city: string;
  valuationBasis?: string;
}

export interface Product {
  hs6Code: string;
  description: string;
}

export interface User {
  uid: string;
  email: string;
  pwHash?: string;
  roles: string;
  createdAt?: string;
}

export interface Measure {
  measureId?: number;
  importerCode: string;
  productCode: string;
  validFrom: string;
  validTo: string;
  mfnAdvalRate: number;
  specificRatePerKg: number;
}

export interface Preference {
  preferenceId?: number;
  importerCode: string;
  exporterCode: string;
  productCode: string;
  validFrom: string;
  validTo: string;
  prefAdValRate: number;
}

export interface Suspension {
  suspensionId?: number;
  importerCode: string;
  productCode: string;
  validFrom: string;
  validTo: string;
  suspensionFlag: boolean;
  suspensionNote: string;
  suspensionRate: number;
}

export interface Transaction {
  tid?: number;
  user: string;
  tDate: string;
  importer: string;
  exporter: string;
  product: string;
  tradeOriginal: number;
  netWeight: number;
  tradeFinal: number;
  appliedRate: { rate: number };
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // Current page number (0-indexed)
  size: number;
  pageSize?: number;
  currentPage?: number;
}

// Country API
export const countryAPI = {
  async getAll(page = 0, size = 10, search = ""): Promise<PaginatedResponse<Country>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiCall<PaginatedResponse<Country>>(
      `${API_BASE_URL}/countries?page=${page}&size=${size}${searchParam}`
    );
  },

  async getByCode(code: string): Promise<Country> {
    const response = await fetchWithRetry(`${API_BASE_URL}/countries/${code}`);
    if (!response.ok) throw new Error("Failed to fetch country");
    return response.json();
  },

  async create(data: Country): Promise<Country> {
    const response = await fetchWithRetry(`${API_BASE_URL}/countries`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create country: ${errorData}`);
    }
    return response.json();
  },

  async update(code: string, data: Country): Promise<Country> {
    const response = await fetchWithRetry(`${API_BASE_URL}/countries/${code}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update country");
    return response.json();
  },

  async delete(code: string): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/countries/${code}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete country");
  },
};

// Product API
export const productAPI = {
  async getAll(page = 0, size = 10, search = ""): Promise<PaginatedResponse<Product>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiCall<PaginatedResponse<Product>>(
      `${API_BASE_URL}/products?page=${page}&size=${size}${searchParam}`
    );
  },

  async getByCode(code: string): Promise<Product> {
    const response = await fetchWithRetry(`${API_BASE_URL}/products/${code}`);
    if (!response.ok) throw new Error("Failed to fetch product");
    return response.json();
  },

  async create(data: Product): Promise<Product> {
    const response = await fetchWithRetry(`${API_BASE_URL}/products`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create product");
    return response.json();
  },

  async update(code: string, data: Product): Promise<Product> {
    const response = await fetchWithRetry(`${API_BASE_URL}/products/${code}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update product");
    return response.json();
  },

  async delete(code: string): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/products/${code}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete product");
  },
};

// User API
export const userAPI = {
  async getAll(page = 0, size = 10, search = ""): Promise<PaginatedResponse<User>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiCall<PaginatedResponse<User>>(
      `${API_BASE_URL}/users?page=${page}&size=${size}${searchParam}`
    );
  },

  async getById(uid: string): Promise<User> {
    const response = await fetchWithRetry(`${API_BASE_URL}/users/${uid}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json();
  },

  async create(data: User): Promise<User> {
    const { uid, pwHash, ...userDataWithoutUid } = data;

    // Validate password is provided
    if (!pwHash || pwHash.trim() === "") {
      throw new Error("Password is required for new users");
    }

    const userPayload = {
      ...userDataWithoutUid,
      password: pwHash,
    };
    const response = await fetchWithRetry(`${API_BASE_URL}/users`, {
      method: "POST",
      body: JSON.stringify(userPayload),
    });
    if (!response.ok) throw new Error("Failed to create user");
    return response.json();
  },

  async update(uid: string, data: Partial<User>): Promise<User> {
    const response = await fetchWithRetry(`${API_BASE_URL}/users/${uid}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update user");
    return response.json();
  },

  async delete(uid: string): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/users/${uid}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete user");
  },
};

// Measure API
export const measureAPI = {
  async getAll(page = 0, size = 10, search = ""): Promise<PaginatedResponse<Measure>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiCall<PaginatedResponse<Measure>>(
      `${API_BASE_URL}/measures?page=${page}&size=${size}${searchParam}`
    );
  },

  async getById(measureId: number): Promise<Measure> {
    const response = await fetchWithRetry(`${API_BASE_URL}/measures/${measureId}`);
    if (!response.ok) throw new Error("Failed to fetch measure");
    return response.json();
  },

  async create(data: Measure): Promise<Measure> {
    const response = await fetchWithRetry(`${API_BASE_URL}/measures`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create measure");
    return response.json();
  },

  async update(measureId: number, data: Measure): Promise<Measure> {
    const response = await fetchWithRetry(`${API_BASE_URL}/measures/${measureId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update measure");
    return response.json();
  },

  async delete(measureId: number): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/measures/${measureId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete measure");
  },

  async search(
    importerCode: string,
    productCode: string,
    validFrom: string
  ): Promise<Measure[]> {
    const params = new URLSearchParams({
      importerCode,
      productCode,
      validFrom,
    });
    const response = await fetchWithRetry(`${API_BASE_URL}/measures/search?${params}`);
    if (!response.ok) throw new Error("Failed to search measures");
    return response.json();
  },
};

// Preference API
export const preferenceAPI = {
  async getAll(page = 0, size = 10, search = ""): Promise<PaginatedResponse<Preference>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiCall<PaginatedResponse<Preference>>(
      `${API_BASE_URL}/preferences?page=${page}&size=${size}${searchParam}`
    );
  },

  async getById(preferenceId: number): Promise<Preference> {
    const response = await fetchWithRetry(`${API_BASE_URL}/preferences/${preferenceId}`);
    if (!response.ok) throw new Error("Failed to fetch preference");
    return response.json();
  },

  async create(data: Preference): Promise<Preference> {
    const response = await fetchWithRetry(`${API_BASE_URL}/preferences`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create preference");
    return response.json();
  },

  async update(preferenceId: number, data: Preference): Promise<Preference> {
    const response = await fetchWithRetry(`${API_BASE_URL}/preferences/${preferenceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update preference");
    return response.json();
  },

  async delete(preferenceId: number): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/preferences/${preferenceId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete preference");
  },

  async search(
    importerCode: string,
    exporterCode: string,
    productCode: string,
    validFrom: string
  ): Promise<Preference[]> {
    const params = new URLSearchParams({
      importerCode,
      exporterCode,
      productCode,
      validFrom,
    });
    const response = await fetchWithRetry(
      `${API_BASE_URL}/preferences/search?${params}`
    );
    if (!response.ok) throw new Error("Failed to search preferences");
    return response.json();
  },
};

// Suspension API
export const suspensionAPI = {
  async getAll(page = 0, size = 10, search = ""): Promise<PaginatedResponse<Suspension>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiCall<PaginatedResponse<Suspension>>(
      `${API_BASE_URL}/suspensions?page=${page}&size=${size}${searchParam}`
    );
  },

  async getById(id: number): Promise<Suspension> {
    const response = await fetchWithRetry(`${API_BASE_URL}/suspensions/${id}`);
    if (!response.ok) throw new Error("Failed to fetch suspension");
    return response.json();
  },

  async create(data: Suspension): Promise<Suspension> {
    const response = await fetchWithRetry(`${API_BASE_URL}/suspensions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create suspension");
    return response.json();
  },

  async update(id: number, data: Suspension): Promise<Suspension> {
    const response = await fetchWithRetry(`${API_BASE_URL}/suspensions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update suspension");
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/suspensions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete suspension");
  },

  async search(
    importerCode: string,
    productCode: string,
    validFrom: string
  ): Promise<Suspension[]> {
    const params = new URLSearchParams({
      importerCode,
      productCode,
      validFrom,
    });
    const response = await fetchWithRetry(
      `${API_BASE_URL}/suspensions/search?${params}`
    );
    if (!response.ok) throw new Error("Failed to search suspensions");
    return response.json();
  },
};

// Transaction API
export const transactionAPI = {
  async getAll(page = 0, size = 10, search = ""): Promise<PaginatedResponse<Transaction>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    return apiCall<PaginatedResponse<Transaction>>(
      `${API_BASE_URL}/transactions?page=${page}&size=${size}${searchParam}`
    );
  },

  async getById(tid: number): Promise<Transaction> {
    const response = await fetchWithRetry(`${API_BASE_URL}/transactions/${tid}`);
    if (!response.ok) throw new Error("Failed to fetch transaction");
    return response.json();
  },

  async create(data: Transaction): Promise<Transaction> {
    const response = await fetchWithRetry(`${API_BASE_URL}/transactions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create transaction");
    return response.json();
  },

  async update(tid: number, data: Partial<Transaction>): Promise<Transaction> {
    const response = await fetchWithRetry(`${API_BASE_URL}/transactions/${tid}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update transaction");
    return response.json();
  },

  async delete(tid: number): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/transactions/${tid}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
  },
};
