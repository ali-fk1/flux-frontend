import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import Dashboard from "./pages/Dashboard";
import AuthSuccess from "./pages/AuthSuccess";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import routes from "./tempo-routes";
import { Skeleton } from "./components/ui/skeleton";
import { Toaster } from "./components/ui/toaster";

function AppRoutes() {
  const tempoRoutes =
    import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/success" element={<AuthSuccess />} />
      </Routes>
      {tempoRoutes}
    </>
  );
}

function AppLoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<AppLoadingFallback />}>
        <AppRoutes />
        <Toaster />
      </Suspense>
    </AuthProvider>
  );
}

export default App;
