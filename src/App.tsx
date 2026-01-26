import { Suspense, useEffect } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import VerificationSuccess from "./pages/VerificationSuccess";
import VerificationFailed from "./pages/VerificationFailed";
import ResendVerification from "./pages/ResendVerification";
import AuthSuccess from "./pages/AuthSuccess";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { initializeApi } from "./services/api";
import routes from "./tempo-routes";
import { Loader2 } from "lucide-react";
import { Toaster } from "./components/ui/toaster";

// Component to initialize API with auth context
function ApiInitializer({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  useEffect(() => {
    initializeApi(logout);
  }, [logout]);

  return <>{children}</>;
}

function AppRoutes() {
  const tempoRoutes = import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/verification-success" element={<VerificationSuccess />} />
        <Route path="/verification-failed" element={<VerificationFailed />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
      </Routes>
      {tempoRoutes}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ApiInitializer>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          }
        >
          <AppRoutes />
          <Toaster />
        </Suspense>
      </ApiInitializer>
    </AuthProvider>
  );
}

export default App;
