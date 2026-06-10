import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardView =
  | "workflow"
  | "calendar"
  | "connections"
  | "analytics"
  | "settings";

interface DashboardState {
  sidebarCollapsed: boolean;
  activeView: DashboardView;
  toggleSidebar: () => void;
  setActiveView: (view: DashboardView) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      activeView: "workflow",
      toggleSidebar: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: "flux-dashboard",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
