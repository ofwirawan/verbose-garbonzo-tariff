const API_BASE_URL = "/api";

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

//Login user and get JWT tokens (access and refresh)
export async function login(credentials: LoginCredentials): Promise<string> {
  console.log("Login attempt with email:", credentials.username);

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error(
      "Login failed - Status:",
      response.status,
      "Error:",
      errorText
    );

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

  const data = await response.json();
  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;

  if (!accessToken) {
    throw new Error("No access token received from server");
  }

  console.log("Login successful, tokens received");

  // Store tokens in both localStorage and cookies
  if (typeof window !== "undefined") {
    localStorage.setItem("jwt_token", accessToken);
    localStorage.setItem("username", credentials.username);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    // Store in cookies for middleware access
    document.cookie = `jwt_token=${accessToken}; path=/; max-age=${
      30 * 60
    }; SameSite=Lax`;

    if (refreshToken) {
      document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${
        7 * 24 * 60 * 60
      }; SameSite=Lax`;
    }

    console.log("🔍 Tokens stored:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });
  }

  return accessToken;
}

//Register new user
export async function register(data: RegisterData): Promise<string> {
  console.log("Registration attempt with:", {
    name: data.name,
    email: data.email,
  });

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error(
      "Registration failed - Status:",
      response.status,
      "Error:",
      errorText
    );
    throw new Error(errorText || "Registration failed");
  }

  const message = await response.text();
  console.log("Registration successful:", message);
  return message;
}

// Get stored JWT token
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("jwt_token");
  if (!token) return null;
  
  // Remove surrounding quotes if present
  return token.replace(/^"(.*)"$/, '$1');
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Logout user
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");

    // Also remove from cookies
    document.cookie = "jwt_token=; path=/; max-age=0";
    document.cookie = "refresh_token=; path=/; max-age=0";
  }
}

// Get current username
export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("username");
}

//Get current user info
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
    name: username.split("@")[0], // Use part before @ as display name
    email: username,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username
    )}&background=random`,
  };
}

// Get authentication headers
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Authenticated fetch wrapper that includes JWT token
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = getToken();

  // Debug logging
  console.log("🔍 authenticatedFetch debug:", {
    url,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : "No token",
    localStorage:
      typeof window !== "undefined" ? localStorage.getItem("jwt_token") : "SSR",
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // Debug response
  console.log("🔍 Response status:", response.status, response.statusText);

  // Remove automatic redirect - just log the error
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== "undefined") {
      logout();
      window.location.href = "/login";
    }
  }

  return response;
}
