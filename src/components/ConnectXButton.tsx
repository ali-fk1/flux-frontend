import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { checkXConnectionStatus, triggerXConnect } from "@/api";

export interface OAuthRoutes {
  success?: string;
  error?: string;
  returnTo?: string;
}

export interface ConnectXButtonProps {
  /**
   * Configurable OAuth redirect routes
   */
  oauthRoutes?: OAuthRoutes;
  /**
   * Custom className for the button
   */
  className?: string;
  /**
   * Custom button variant
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /**
   * Button size
   */
  size?: "default" | "sm" | "lg" | "icon";
  /**
   * Whether to show the button in full width
   */
  fullWidth?: boolean;
}

const ConnectXButton: React.FC<ConnectXButtonProps> = ({
  oauthRoutes = {
    success: "/auth/success",
    error: "/auth/error",
    returnTo: "/dashboard",
  },
  className = "",
  variant = "default",
  size = "default",
  fullWidth = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const oauthHandledRef = useRef<string | null>(null);

  // Check connection status
  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await checkXConnectionStatus();
      setIsConnected(response.connected);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check connection status";
      setError(errorMessage);
      console.error("Error checking X connection status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Re-check status when window regains focus or becomes visible
  useEffect(() => {
    const handleFocus = () => {
      // Only re-check if we're not currently loading or connecting
      if (!isLoading && !isConnecting) {
        checkStatus();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isLoading && !isConnecting) {
        checkStatus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkStatus, isLoading, isConnecting]);

  // Detect OAuth return and handle accordingly
  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    const oauthReturn = searchParams.get("oauth_return");

    // Create a unique key for this OAuth return attempt
    const oauthKey = `${location.pathname}?${searchParams.toString()}`;
    
    // Skip if we've already handled this OAuth return
    if (oauthHandledRef.current === oauthKey) {
      return;
    }

    // Check if we're on a success/error route or have OAuth return params
    const isOnSuccessRoute = oauthRoutes.success && location.pathname === oauthRoutes.success;
    const isOnErrorRoute = oauthRoutes.error && location.pathname === oauthRoutes.error;
    const hasOAuthParams = successParam !== null || errorParam !== null || oauthReturn !== null;

    if (isOnSuccessRoute || successParam === "true" || oauthReturn === "true") {
      // Mark as handled
      oauthHandledRef.current = oauthKey;
      
      // OAuth success - re-check connection status
      checkStatus().then(() => {
        // Navigate to returnTo route if configured
        if (oauthRoutes.returnTo && location.pathname !== oauthRoutes.returnTo) {
          // Clean up URL params before navigating
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("success");
          newSearchParams.delete("error");
          newSearchParams.delete("oauth_return");
          const newSearch = newSearchParams.toString();
          navigate(`${oauthRoutes.returnTo}${newSearch ? `?${newSearch}` : ""}`, {
            replace: true,
          });
        }
      });
    } else if (isOnErrorRoute || errorParam !== null) {
      // Mark as handled
      oauthHandledRef.current = oauthKey;
      
      // OAuth error
      const errorMessage = errorParam || "OAuth connection failed";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });
      
      // Navigate to returnTo route if configured
      if (oauthRoutes.returnTo && location.pathname !== oauthRoutes.returnTo) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("success");
        newSearchParams.delete("error");
        newSearchParams.delete("oauth_return");
        const newSearch = newSearchParams.toString();
        navigate(`${oauthRoutes.returnTo}${newSearch ? `?${newSearch}` : ""}`, {
          replace: true,
        });
      }
    }
  }, [searchParams, location.pathname, oauthRoutes, navigate, checkStatus, toast]);

  // Handle connect button click
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const authUrl = await triggerXConnect();
      
      if (authUrl) {
        // Redirect to the authorization URL
        window.location.href = authUrl;
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initiate X connection";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: errorMessage,
      });
      setIsConnecting(false);
    }
  };

  // Determine button state
  const buttonDisabled = isLoading || isConnecting || isConnected;
  const showLoading = isLoading || isConnecting;

  // Button text and icon
  let buttonText = "Connect to X";
  let buttonIcon: React.ReactNode = null;

  if (showLoading) {
    buttonText = isConnecting ? "Connecting..." : "Checking...";
    buttonIcon = <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
  } else if (isConnected) {
    buttonText = "Connected to X";
    buttonIcon = <Check className="h-4 w-4 mr-2" />;
  }

  // Button styling
  const buttonClassName = `
    ${fullWidth ? "w-full" : ""}
    ${isConnected ? "bg-green-500 hover:bg-green-600 text-white" : ""}
    transition-all duration-200
    ${className}
  `.trim();

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleConnect}
        disabled={buttonDisabled}
        variant={isConnected ? "default" : variant}
        size={size}
        className={buttonClassName}
      >
        {buttonIcon}
        {buttonText}
      </Button>
      {error && !showLoading && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

export default ConnectXButton;

