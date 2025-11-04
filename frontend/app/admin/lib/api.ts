"use client";

// Admin API Service Layer
const API_BASE_URL = `${
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
}/api/admin`;

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

// Helper function for API calls with better error handling
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: getAuthHeaders(),
  });

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
  id?: number;
  importerCode: string;
  productCode: string;
  validFrom: string;
  validTo: string;
  mfnAdvalRate: number;
  specificRatePerKg: number;
}

export interface Preference {
  id?: number;
  importerCode: string;
  exporterCode: string;
  productCode: string;
  validFrom: string;
  validTo: string;
  prefAdValRate: number;
}

export interface Suspension {
  id?: number;
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
    const response = await fetch(`${API_BASE_URL}/countries/${code}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch country");
    return response.json();
  },

  async create(data: Country): Promise<Country> {
    const response = await fetch(`${API_BASE_URL}/countries`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create country: ${errorData}`);
    }
    return response.json();
  },

  async update(code: string, data: Country): Promise<Country> {
    const response = await fetch(`${API_BASE_URL}/countries/${code}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update country");
    return response.json();
  },

  async delete(code: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/countries/${code}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete country");
  },
};

// Product API
export const productAPI = {
  async getAll(page = 0, size = 10): Promise<PaginatedResponse<Product>> {
    const response = await fetch(
      `${API_BASE_URL}/products?page=${page}&size=${size}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },

  async getByCode(code: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${code}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch product");
    return response.json();
  },

  async create(data: Product): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create product");
    return response.json();
  },

  async update(code: string, data: Product): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${code}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update product");
    return response.json();
  },

  async delete(code: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${code}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete product");
  },
};

// User API
export const userAPI = {
  async getAll(page = 0, size = 10): Promise<PaginatedResponse<User>> {
    const response = await fetch(
      `${API_BASE_URL}/users?page=${page}&size=${size}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
  },

  async getById(uid: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json();
  },

  async create(data: User): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create user");
    return response.json();
  },

  async update(uid: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update user");
    return response.json();
  },

  async delete(uid: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete user");
  },
};

// Measure API
export const measureAPI = {
  async getAll(page = 0, size = 10): Promise<PaginatedResponse<Measure>> {
    const response = await fetch(
      `${API_BASE_URL}/measures?page=${page}&size=${size}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to fetch measures");
    return response.json();
  },

  async getById(id: number): Promise<Measure> {
    const response = await fetch(`${API_BASE_URL}/measures/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch measure");
    return response.json();
  },

  async create(data: Measure): Promise<Measure> {
    const response = await fetch(`${API_BASE_URL}/measures`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create measure");
    return response.json();
  },

  async update(id: number, data: Measure): Promise<Measure> {
    const response = await fetch(`${API_BASE_URL}/measures/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update measure");
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/measures/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
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
    const response = await fetch(`${API_BASE_URL}/measures/search?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to search measures");
    return response.json();
  },
};

// Preference API
export const preferenceAPI = {
  async getAll(page = 0, size = 10): Promise<PaginatedResponse<Preference>> {
    const response = await fetch(
      `${API_BASE_URL}/preferences?page=${page}&size=${size}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to fetch preferences");
    return response.json();
  },

  async getById(id: number): Promise<Preference> {
    const response = await fetch(`${API_BASE_URL}/preferences/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch preference");
    return response.json();
  },

  async create(data: Preference): Promise<Preference> {
    const response = await fetch(`${API_BASE_URL}/preferences`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create preference");
    return response.json();
  },

  async update(id: number, data: Preference): Promise<Preference> {
    const response = await fetch(`${API_BASE_URL}/preferences/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update preference");
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/preferences/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
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
    const response = await fetch(
      `${API_BASE_URL}/preferences/search?${params}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to search preferences");
    return response.json();
  },
};

// Suspension API
export const suspensionAPI = {
  async getAll(page = 0, size = 10): Promise<PaginatedResponse<Suspension>> {
    const response = await fetch(
      `${API_BASE_URL}/suspensions?page=${page}&size=${size}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to fetch suspensions");
    return response.json();
  },

  async getById(id: number): Promise<Suspension> {
    const response = await fetch(`${API_BASE_URL}/suspensions/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch suspension");
    return response.json();
  },

  async create(data: Suspension): Promise<Suspension> {
    const response = await fetch(`${API_BASE_URL}/suspensions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create suspension");
    return response.json();
  },

  async update(id: number, data: Suspension): Promise<Suspension> {
    const response = await fetch(`${API_BASE_URL}/suspensions/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update suspension");
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/suspensions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
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
    const response = await fetch(
      `${API_BASE_URL}/suspensions/search?${params}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to search suspensions");
    return response.json();
  },
};

// Transaction API
export const transactionAPI = {
  async getAll(page = 0, size = 10): Promise<PaginatedResponse<Transaction>> {
    const response = await fetch(
      `${API_BASE_URL}/transactions?page=${page}&size=${size}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  },

  async getById(tid: number): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions/${tid}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch transaction");
    return response.json();
  },

  async create(data: Transaction): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create transaction");
    return response.json();
  },

  async update(tid: number, data: Partial<Transaction>): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/transactions/${tid}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update transaction");
    return response.json();
  },

  async delete(tid: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions/${tid}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
  },
};
