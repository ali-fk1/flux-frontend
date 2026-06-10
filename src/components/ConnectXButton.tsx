import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { checkXConnectionStatus, triggerXConnect } from "@/api";
import { cn } from "@/lib/utils";

export interface OAuthRoutes {
  success?: string;
  error?: string;
  returnTo?: string;
}

export interface ConnectXButtonProps {
  oauthRoutes?: OAuthRoutes;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
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
  const queryClient = useQueryClient();

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oauthHandledRef = useRef<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["x-connection-status"],
    queryFn: checkXConnectionStatus,
  });

  const isConnected = data?.connected ?? false;

  const checkStatus = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["x-connection-status"] });
  }, [queryClient]);

  useEffect(() => {
    const handleFocus = () => {
      if (!isConnecting) refetch();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnecting) {
        refetch();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnecting, refetch]);

  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");
    const oauthReturn = searchParams.get("oauth_return");
    const oauthKey = `${location.pathname}?${searchParams.toString()}`;

    if (oauthHandledRef.current === oauthKey) return;

    const isOnSuccessRoute =
      oauthRoutes.success && location.pathname === oauthRoutes.success;
    const isOnErrorRoute =
      oauthRoutes.error && location.pathname === oauthRoutes.error;

    if (isOnSuccessRoute || successParam === "true" || oauthReturn === "true") {
      oauthHandledRef.current = oauthKey;
      checkStatus().then(() => {
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
      });
    } else if (isOnErrorRoute || errorParam !== null) {
      oauthHandledRef.current = oauthKey;
      const errorMessage = errorParam || "Couldn't connect to X. Try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: errorMessage,
      });
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

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const authUrl = await triggerXConnect();
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Couldn't connect to X. Try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: errorMessage,
      });
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className={cn("flex flex-col gap-2", fullWidth && "w-full")}>
        <div
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary",
            fullWidth && "w-full"
          )}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Connected
        </div>
      </div>
    );
  }

  const showLoading = isLoading || isConnecting;

  return (
    <div className={cn("flex flex-col gap-2", fullWidth && "w-full")}>
      <Button
        onClick={handleConnect}
        disabled={showLoading}
        variant={variant}
        size={size}
        className={cn(fullWidth && "w-full", className)}
      >
        {showLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isConnecting ? "Connecting…" : "Checking…"}
          </>
        ) : (
          "Connect to X"
        )}
      </Button>
      {error && !showLoading && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default ConnectXButton;
