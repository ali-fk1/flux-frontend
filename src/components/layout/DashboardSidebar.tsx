import {
  LayoutGrid,
  Calendar,
  Link2,
  BarChart3,
  Settings,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FluxLogo } from "@/components/shared/FluxLogo";
import { cn } from "@/lib/utils";
import {
  useDashboardStore,
  type DashboardView,
} from "@/stores/dashboard-store";

const navItems: {
  id: DashboardView;
  label: string;
  icon: typeof LayoutGrid;
  disabled?: boolean;
}[] = [
  { id: "workflow", label: "Workflow", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "analytics", label: "Analytics", icon: BarChart3, disabled: true },
  { id: "settings", label: "Settings", icon: Settings, disabled: true },
];

export function DashboardSidebar() {
  const { sidebarCollapsed, activeView, toggleSidebar, setActiveView } =
    useDashboardStore();

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200",
        sidebarCollapsed ? "w-14" : "w-56"
      )}
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border px-3",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!sidebarCollapsed && <FluxLogo size="sm" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 shrink-0"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ id, label, icon: Icon, disabled }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setActiveView(id)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40",
                sidebarCollapsed && "justify-center px-0"
              )}
              aria-current={isActive ? "page" : undefined}
              title={sidebarCollapsed ? label : undefined}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary"
                  aria-hidden="true"
                />
              )}
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
