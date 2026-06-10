import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

function applyDarkMode(darkMode: boolean) {
  document.documentElement.classList.toggle("dark", darkMode);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      darkMode: true,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        applyDarkMode(next);
        set({ darkMode: next });
      },
      setDarkMode: (value) => {
        applyDarkMode(value);
        set({ darkMode: value });
      },
    }),
    {
      name: "flux-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyDarkMode(state.darkMode);
        }
      },
    }
  )
);
