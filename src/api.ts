// TODO: Replace with your actual backend URL
export const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// TODO: Replace with your authentication endpoint or set ENV var `AUTH_URL`.
// By default this targets `${BASE_URL}/api/auth/login` but you can pass an
// explicit `endpoint` to `sendCredentials` when calling it.
const AUTH_ENDPOINT =`${BASE_URL}/signup`;

// Enhanced fetch function with cookie-based authentication
async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });
}

// Social Media Connection Functions
// TODO: Update these endpoints to match your backend API

/**
 * Check if X (Twitter) is connected
 * @returns {Promise<{ connected: boolean }>}
 */
export async function checkXConnectionStatus(): Promise<{ connected: boolean }> {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/x/status`, {
      method: "GET",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in again.");
      }
      throw new Error(`Failed to check X connection status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking X connection status:", error);
    throw error;
  }
}

/**
 * Initiate X (Twitter) OAuth connection
 * @returns {Promise<string>} The authorization URL as a plain string
 */
export async function triggerXConnect(): Promise<string> {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/x`, {
      method: "POST",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in again.");
      }
      throw new Error(`X connection failed: ${response.statusText}`);
    }

    // Backend returns the authorization URL as a plain string
    const authUrl = await response.text();
    
    if (!authUrl || authUrl.trim().length === 0) {
      throw new Error("No authorization URL received from server");
    }

    return authUrl.trim();
  } catch (error) {
    console.error("Error triggering X connect:", error);
    throw error;
  }
}

export async function triggerFacebookConnect() {
  // TODO: Replace with your Facebook connection endpoint
  const response = await authenticatedFetch(
    `${BASE_URL}/api/facebook/connect`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Facebook connection failed: ${response.statusText}`);
  }

  return response.json();
}

export async function triggerInstagramConnect() {
  // TODO: Replace with your Instagram connection endpoint
  const response = await authenticatedFetch(
    `${BASE_URL}/api/instagram/connect`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Instagram connection failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Post text-only content to X via backend.
 * Backend: POST /api/post (protected) with body { text: string }
 * - 201: returns JSON (XPostResponse)
 * - 401/502/500: may return empty body
 */
export async function postToX(text: string): Promise<any> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Post text cannot be empty");
  }

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

  // For failures backend may return empty body; caller should map by status.
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

export async function scheduleXPost(payload: SchedulePostPayload): Promise<any> {
  const response = await authenticatedFetch(`${BASE_URL}/api/post/schedule`, {
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

// Generic social media connection function
export async function connectSocialPlatform(platform: string) {
  // TODO: Replace with your generic social platform connection endpoint
  const response = await authenticatedFetch(
    `${BASE_URL}/api/social/${platform}/connect`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`${platform} connection failed: ${response.statusText}`);
  }

  return response.json();
}

// Check connection status for all platforms
export async function checkConnectionStatus() {
  // TODO: Replace with your connection status endpoint
  const response = await authenticatedFetch(`${BASE_URL}/api/social/status`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to check connection status: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Send user credentials (email & password) to the backend auth endpoint.
 *
 * - By default it posts to `AUTH_ENDPOINT` (see top of file). You can pass
 *   a different `endpoint` to override it.
 * - Returns parsed JSON on success, throws an Error on non-OK responses.
 */
export async function sendCredentials(
  email: string,
  password: string,
  endpoint?: string,
): Promise<any> {
  const url = endpoint || AUTH_ENDPOINT;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        "email": email,
        "password": password
      }),
      mode: 'cors',  // Enable CORS for cross-origin requests
      // Note: /signup is a public endpoint, so we don't send credentials
    });

    if (!response.ok) {
      // Try to include response body for better debugging
      let bodyText = "";
      try {
        bodyText = await response.text();
      } catch (_) {
        bodyText = "<unreadable response body>";
      }

      throw new Error(
        `Login failed: ${response.status} ${response.statusText} - ${bodyText}`,
      );
    }

    // Check if there's actually content to parse
    const text = await response.text();
    if (!text) {
      // Return a default success response if the body is empty
      return { success: true };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('Response was not JSON:', text);
      // Return a default success response if parsing fails
      return { success: true };
    }
  } catch (error) {
    console.error("Error sending credentials:", error);
    throw error;
  }
}
