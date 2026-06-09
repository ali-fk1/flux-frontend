import keycloak from "@/lib/keycloak";

export const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (keycloak.isTokenExpired(10)) {
    try {
      await keycloak.updateToken(10);
    } catch {
      keycloak.logout({ redirectUri: window.location.origin });
      throw new Error("Session expired");
    }
  }

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(keycloak.token
        ? { Authorization: `Bearer ${keycloak.token}` }
        : {}),
      ...options.headers,
    },
  });
}

export async function checkXConnectionStatus(): Promise<{
  connected: boolean;
}> {
  const response = await authenticatedFetch(`${BASE_URL}/api/x/status`, {
    method: "GET",
  });
  if (!response.ok)
    throw new Error(
      `Failed to check X connection status: ${response.statusText}`
    );
  return response.json();
}

export async function triggerXConnect(): Promise<string> {
  const response = await authenticatedFetch(`${BASE_URL}/api/x`, {
    method: "POST",
  });
  if (!response.ok)
    throw new Error(`X connection failed: ${response.statusText}`);
  const authUrl = await response.text();
  if (!authUrl?.trim())
    throw new Error("No authorization URL received from server");
  return authUrl.trim();
}

export async function triggerFacebookConnect() {
  const response = await authenticatedFetch(
    `${BASE_URL}/api/facebook/connect`,
    { method: "POST" }
  );
  if (!response.ok)
    throw new Error(`Facebook connection failed: ${response.statusText}`);
  return response.json();
}

export async function triggerInstagramConnect() {
  const response = await authenticatedFetch(
    `${BASE_URL}/api/instagram/connect`,
    { method: "POST" }
  );
  if (!response.ok)
    throw new Error(`Instagram connection failed: ${response.statusText}`);
  return response.json();
}

export async function postToX(text: string): Promise<any> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Post text cannot be empty");
  const response = await authenticatedFetch(`${BASE_URL}/api/post`, {
    method: "POST",
    body: JSON.stringify({ text: trimmed }),
  });
  if (response.status === 201) {
    const bodyText = await response.text();
    if (!bodyText) return {};
    try {
      return JSON.parse(bodyText);
    } catch {
      return { message: bodyText };
    }
  }
  const error: any = new Error("Request failed");
  error.status = response.status;
  throw error;
}

type SchedulePostPayload = {
  platform: "X";
  text: string;
  scheduled_at_utc: string;
  user_time_zone: string;
};

export async function scheduleXPost(
  payload: SchedulePostPayload
): Promise<any> {
  const response = await authenticatedFetch(`${BASE_URL}/api/schedule`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error: any = new Error("Request failed");
    error.status = response.status;
    throw error;
  }
  const bodyText = await response.text();
  if (!bodyText) return {};
  try {
    return JSON.parse(bodyText);
  } catch {
    return { message: bodyText };
  }
}

export async function connectSocialPlatform(platform: string) {
  const response = await authenticatedFetch(
    `${BASE_URL}/api/social/${platform}/connect`,
    { method: "POST" }
  );
  if (!response.ok)
    throw new Error(`${platform} connection failed: ${response.statusText}`);
  return response.json();
}

export async function checkConnectionStatus() {
  const response = await authenticatedFetch(`${BASE_URL}/api/social/status`, {
    method: "GET",
  });
  if (!response.ok)
    throw new Error(
      `Failed to check connection status: ${response.statusText}`
    );
  return response.json();
}
