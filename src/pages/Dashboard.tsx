import { useState } from "react";
import WorkflowCanvas from "@/components/WorkflowCanvas";
import CalendarView from "@/components/CalendarView";
import ConnectionsView from "@/components/ConnectionsView";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useThemeStore } from "@/stores/theme-store";

const Dashboard = () => {
  const { logout } = useAuth();
  const { activeView } = useDashboardStore();
  const darkMode = useThemeStore((s) => s.darkMode);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={`flex h-screen min-w-[320px] bg-background ${darkMode ? "dark" : ""}`}>
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          activeView={activeView}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-auto bg-background p-4 sm:p-6">
          <ErrorBoundary fallbackMessage="Couldn't load this view. Try again.">
            {activeView === "workflow" && <WorkflowCanvas />}
            {activeView === "calendar" && <CalendarView />}
            {activeView === "connections" && <ConnectionsView />}
            {(activeView === "analytics" || activeView === "settings") && (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                Coming soon
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
