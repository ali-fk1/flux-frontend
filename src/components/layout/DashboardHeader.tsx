import { Bell, LogOut, Moon, Sun, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeStore } from "@/stores/theme-store";
import type { DashboardView } from "@/stores/dashboard-store";

const viewTitles: Record<DashboardView, string> = {
  workflow: "Workflow",
  calendar: "Calendar",
  connections: "Connections",
  analytics: "Analytics",
  settings: "Settings",
};

interface DashboardHeaderProps {
  activeView: DashboardView;
  isLoggingOut?: boolean;
  onLogout: () => void;
}

export function DashboardHeader({
  activeView,
  isLoggingOut = false,
  onLogout,
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeStore();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <h1 className="text-base font-semibold text-foreground sm:text-lg">
        {viewTitles[activeView]}
      </h1>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`}
                  alt={user?.name || user?.email || "User"}
                />
                <AvatarFallback>
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center gap-2 p-2">
              <div className="flex flex-col space-y-0.5 leading-none">
                {user?.name && (
                  <p className="text-sm font-medium">{user.name}</p>
                )}
                {user?.email && (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              disabled={isLoggingOut}
              className="cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
