import React, { createContext, useContext, useState, useEffect } from "react";
import keycloak from "@/lib/keycloak";

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => { keycloak.login(); },
  logout: () => { keycloak.logout({ redirectUri: window.location.origin }); },
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    keycloak
      .init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
        pkceMethod: "S256",
      })
      .then(async (authenticated) => {
        if (authenticated) {
          try {
            const profile = await keycloak.loadUserProfile();
            setUser({
              id: keycloak.subject ?? "",
              email: profile.email ?? "",
              name:
                [profile.firstName, profile.lastName]
                  .filter(Boolean)
                  .join(" ") || profile.username,
            });
          } catch {
            // Profile load failed — fall back to JWT claims
            setUser({
              id: keycloak.subject ?? "",
              email: (keycloak.tokenParsed as any)?.email ?? "",
              name: (keycloak.tokenParsed as any)?.name,
            });
          }
        }
      })
      .catch((err) => {
        console.error("Keycloak init error:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => {
        keycloak.logout({ redirectUri: window.location.origin });
      });
    };
  }, []);

  const login = () => keycloak.login();

  const logout = () =>
    keycloak.logout({ redirectUri: window.location.origin });

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
