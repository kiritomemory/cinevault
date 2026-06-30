import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, ViewMode, SidebarItem, Movie, TVShow } from "@/types";
import { setApiKey } from "@/services/tmdb";

interface AppState {
  settings: AppSettings;
  embyConnected: boolean;
  embyServerName: string;
  embySeriesCount: number;
  setEmbyConnected: (connected: boolean, serverName?: string, count?: number) => void;
  updateSettings: (s: Partial<AppSettings>) => void;

  sidebarActive: SidebarItem;
  setSidebarActive: (item: SidebarItem) => void;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;

  selectedMedia: Movie | TVShow | null;
  setSelectedMedia: (media: Movie | TVShow | null) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;

  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: {
        apiKey: "",
        theme: "system",
        language: "zh-CN",
        region: "CN",
        embyServer: "",
        embyApiKey: "",
        embyConnected: false,
      },
      embyConnected: false,
  embyServerName: "",
  embySeriesCount: 0,
  setEmbyConnected: (connected, serverName = "", count = 0) => set({ embyConnected: connected, embyServerName: serverName, embySeriesCount: count }),

  updateSettings: (s) => {
        const newSettings = { ...get().settings, ...s };
        if (s.apiKey) setApiKey(s.apiKey);
        set({ settings: newSettings });
      },

      sidebarActive: "discover",
      setSidebarActive: (item) => set({ sidebarActive: item }),

      viewMode: "grid",
      setViewMode: (mode) => set({ viewMode: mode }),

      rightPanelOpen: true,
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

      selectedMedia: null,
      setSelectedMedia: (media) => set({ selectedMedia: media }),

      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),

      commandOpen: false,
      setCommandOpen: (open) => set({ commandOpen: open }),

      theme: "dark",
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "cinevault-app-store",
      partialize: (state) => ({
        embyConnected: state.embyConnected,
        embyServerName: state.embyServerName,
        embySeriesCount: state.embySeriesCount,
        settings: state.settings,
        theme: state.theme,
        viewMode: state.viewMode,
      }),
      onRehydrateStorage: () => (state) => {
        // 同步标记水合完成（localStorage 是同步的，读取已完成）
        state?.setHasHydrated(true);
      },
    }
  )
);
