const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  roles: string;
}

/**
 * Login user and get JWT token
 */
export async function login(credentials: LoginCredentials): Promise<string> {
  console.log("Login attempt with email:", credentials.username);

  const response = await fetch(`${API_BASE_URL}/auth/generateToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Login failed - Status:", response.status, "Error:", errorText);

    // Parse the error message if possible
    let errorMessage = "Invalid username or password";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const token = await response.text();
  console.log("Login successful, token received");

  // Store token in both localStorage and cookies
  if (typeof window !== "undefined") {
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("username", credentials.username);

    // Also store in cookies for middleware access
    document.cookie = `jwt_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }

  return token;
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<string> {
  console.log("Registration attempt with:", { name: data.name, email: data.email });

  const response = await fetch(`${API_BASE_URL}/auth/addNewUser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Registration failed - Status:", response.status, "Error:", errorText);
    throw new Error(errorText || "Registration failed");
  }

  const message = await response.text();
  console.log("Registration successful:", message);
  return message;
}

/**
 * Get stored JWT token
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jwt_token");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Logout user
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("username");

    // Also remove from cookies
    document.cookie = "jwt_token=; path=/; max-age=0";
  }
}

/**
 * Get current username
 */
export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("username");
}

/**
 * Get current user info
 */
export interface UserInfo {
  name: string;
  email: string;
  avatar: string;
}

export function getCurrentUser(): UserInfo | null {
  if (typeof window === "undefined") return null;

  const username = localStorage.getItem("username");
  if (!username) return null;

  return {
    name: username.split('@')[0], // Use part before @ as display name
    email: username,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
  };
}

/**
 * Get authentication headers
 */
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

/**
 * Authenticated fetch wrapper that includes JWT token
 */
export async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // If unauthorized, redirect to login
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      logout();
      window.location.href = '/login';
    }
  }

  return response;
}
