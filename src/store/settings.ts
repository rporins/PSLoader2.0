import { create } from "zustand";
import { ThemeMode } from "../theme/settings";

type SettingsState = {
  themeMode: ThemeMode;
  loading: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  loadSettingsFromDb: () => Promise<void>;
  saveSettingsToDb: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: "light",
  loading: false,

  toggleTheme: () => {
    const current = get().themeMode;
    const next = current === "light" ? "dark" : "light";
    set({ themeMode: next });
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
  },

  // Load theme preference from storage
  loadSettingsFromDb: async () => {
    try {
      set({ loading: true });
      const anyWindow: any = window as any;
      const response = await anyWindow?.ipcApi?.sendIpcRequest?.("settings-get");
      if (response && (response.mode === "light" || response.mode === "dark")) {
        set({ themeMode: response.mode as ThemeMode });
      } else {
        // Try localStorage as fallback
        const saved = localStorage.getItem("theme-mode");
        if (saved === "light" || saved === "dark") {
          set({ themeMode: saved as ThemeMode });
        }
      }
    } catch (e) {
      // Try localStorage as fallback
      try {
        const saved = localStorage.getItem("theme-mode");
        if (saved === "light" || saved === "dark") {
          set({ themeMode: saved as ThemeMode });
        }
      } catch (_) {
        // Keep default
      }
    } finally {
      set({ loading: false });
    }
  },

  // Save theme preference
  saveSettingsToDb: async () => {
    try {
      const mode = get().themeMode;
      const anyWindow: any = window as any;
      await anyWindow?.ipcApi?.sendIpcRequest?.("settings-set", { mode });
      // Also save to localStorage as backup
      localStorage.setItem("theme-mode", mode);
    } catch (_) {
      // Save to localStorage only
      try {
        const mode = get().themeMode;
        localStorage.setItem("theme-mode", mode);
      } catch (_) {
        // Silently ignore if storage not available
      }
    }
  },
}));

