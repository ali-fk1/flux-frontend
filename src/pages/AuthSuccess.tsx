import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { FluxLogo } from "@/components/shared/FluxLogo";

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <div className="mb-6 flex justify-center">
          <FluxLogo size="lg" />
        </div>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Connected to X
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account was connected successfully. Redirecting to dashboard…
        </p>
      </div>
    </div>
  );
}
