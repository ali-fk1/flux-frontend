// API Service with cookie-based authentication
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

type LogoutHandler = () => Promise<void>;

let handleLogout: LogoutHandler = async () => {};

// Initialize the API service with logout handler
export function initializeApi(logoutHandler: LogoutHandler) {
  handleLogout = logoutHandler;
}

// Fetch wrapper with cookie-based authentication
export async function fetchWithAuth<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const makeRequest = async (): Promise<Response> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let response = await makeRequest();

  // If unauthorized, logout user (backend handles token refresh via cookies)
  if (response.status === 401) {
    await handleLogout();
    throw new Error("Session expired. Please log in again.");
  }

  // Handle non-OK responses
  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Parse response
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, { ...options, method: "DELETE" }),
};

export { API_BASE_URL };
