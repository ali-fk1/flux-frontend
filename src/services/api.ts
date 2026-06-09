import keycloak, { logout as keycloakLogout } from "@/lib/keycloak";

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

async function fetchWithAuth<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Ensure token is fresh before every request
  if (keycloak.isTokenExpired(10)) {
    try {
      await keycloak.updateToken(10);
    } catch {
      keycloakLogout();
      throw new Error("Session expired");
    }
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(keycloak.token
      ? { Authorization: `Bearer ${keycloak.token}` }
      : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    keycloak.logout({ redirectUri: window.location.origin });
    const err = new Error("Unauthorized") as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    const err = new Error(errorMessage) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

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

export interface ScheduledPost {
  id: string;
  content: string;
  scheduledAtUtc: string;
  status: string;
  mediaUrl: string | null;
}

export interface ScheduledPostsResponse {
  content: ScheduledPost[];
  nextCursor: string | null;
  hasNext: boolean;
}

export async function getScheduledPosts(params?: {
  cursor?: string | null;
  size?: number;
}): Promise<ScheduledPostsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("status", "scheduled");
  searchParams.set("size", String(params?.size ?? 20));
  if (params?.cursor != null) searchParams.set("cursor", params.cursor);
  return api.get<ScheduledPostsResponse>(
    `/api/posts?${searchParams.toString()}`
  );
}

export async function deleteScheduledPost(id: string): Promise<void> {
  await api.delete(`/api/posts/${id}`);
}
