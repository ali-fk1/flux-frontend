import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import keycloak, {
  initKeycloak,
  login as keycloakLogin,
  logout as keycloakLogout,
} from "@/lib/keycloak";

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
  login: () => {
    keycloakLogin();
  },
  logout: () => {
    keycloakLogout();
  },
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    initKeycloak()
      .then(async (authenticated) => {
        if (cancelled) return;

        setIsAuthenticated(authenticated);

        if (authenticated) {
          try {
            const profile = await keycloak.loadUserProfile();
            if (cancelled) return;
            setUser({
              id: keycloak.subject ?? "",
              email: profile.email ?? "",
              name:
                [profile.firstName, profile.lastName]
                  .filter(Boolean)
                  .join(" ") || profile.username,
            });
          } catch {
            if (cancelled) return;
            setUser({
              id: keycloak.subject ?? "",
              email: (keycloak.tokenParsed as Record<string, string>)?.email ?? "",
              name: (keycloak.tokenParsed as Record<string, string>)?.name,
            });
          }
        }
      })
      .catch((err) => {
        console.error("Keycloak init error:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => {
        keycloakLogout();
      });
    };

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    keycloakLogin();
  }, []);

  const logout = useCallback(() => {
    keycloakLogout();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
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
