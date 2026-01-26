import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// Default context value for when used outside provider (e.g., storyboards)
const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => { console.warn("Auth not available"); },
  logout: async () => { console.warn("Auth not available"); },
  checkAuth: async () => false,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check authentication state by calling /api/me endpoint
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user || data);
        return true;
      }

      // Not authenticated
      setUser(null);
      return false;
    } catch (error) {
      // Silently handle network errors (backend not available)
      if (error instanceof TypeError && (error as Error).message === 'Failed to fetch') {
        // Backend not reachable - this is expected during development
      } else {
        console.error("Auth check error:", error);
      }
      setUser(null);
      return false;
    }
  }, []);

  // Login function - treats 200 OK as success, backend sets cookies.
  // We use credentials: "include" so the Set-Cookie header is accepted by the browser.
  // This does not require an existing access_token (none is present before login).
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = "Login failed. Please try again.";
      try {
        const data = await response.json();
        if (response.status === 401) {
          errorMessage = data.error || "Invalid credentials";
        } else if (response.status === 403) {
          errorMessage = data.error || "Please verify your email first";
        } else {
          errorMessage = data.error || errorMessage;
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Login successful (200 OK) - cookies are set by backend
    // Try to parse user data from response if available (before calling checkAuth)
    let userData: User | null = null;
    try {
      const responseData = await response.json();
      if (responseData.user) {
        userData = responseData.user;
      } else if (responseData.email || responseData.id) {
        userData = {
          id: responseData.id || "",
          email: responseData.email || email,
          name: responseData.name,
        };
      }
    } catch {
      // Response might not be JSON or might be empty - that's okay
    }

    // Fetch user info to update state - we need this to complete so ProtectedRoute allows access
    try {
      const authResult = await checkAuth();
      // If checkAuth succeeded, user state is now updated and isAuthenticated will be true
      return authResult;
    } catch (error) {
      console.error("Failed to fetch user after login:", error);
      // If checkAuth failed but we have user data from login response, use that
      if (userData) {
        setUser(userData);
        return true;
      }
      // Login was successful, but couldn't fetch user details
      // Return false so login page shows error, but the useEffect will retry checkAuth
      return false;
    }
  }, [checkAuth]);

  // Logout function - just calls backend, relies on backend to clear cookies
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear state regardless of API response
      setUser(null);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export { API_BASE_URL };
