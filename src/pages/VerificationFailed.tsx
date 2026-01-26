import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle, Sparkles, AlertTriangle } from "lucide-react";

const errorMessages: Record<string, { title: string; description: string }> = {
  expired: {
    title: "Verification Link Expired",
    description:
      "This verification link has expired. Please request a new one to verify your email address.",
  },
  "already-used": {
    title: "Link Already Used",
    description:
      "This link has already been used. Your email may already be verified. Try logging in.",
  },
  invalid: {
    title: "Invalid Verification Link",
    description:
      "This verification link is invalid. Please check your email for the correct link.",
  },
  unknown: {
    title: "Verification Failed",
    description:
      "Something went wrong during verification. Please try again or contact support.",
  },
};

function VerificationFailed() {
  const [searchParams] = useSearchParams();
  const errorType = searchParams.get("error") || "unknown";
  const errorInfo = errorMessages[errorType] || errorMessages.unknown;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Flux
          </span>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            {errorType === "expired" ? (
              <AlertTriangle className="h-10 w-10 text-white" />
            ) : (
              <XCircle className="h-10 w-10 text-white" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {errorInfo.title}
          </h1>

          <p className="text-gray-600 mb-8">{errorInfo.description}</p>

          <div className="space-y-3">
            <Link to="/resend-verification" className="block">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Resend Verification Email
              </Button>
            </Link>

            <Link to="/" className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationFailed;
