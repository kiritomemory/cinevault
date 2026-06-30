import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { setApiKey } from "@/services/tmdb";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";
import CommandPalette from "@/components/CommandPalette";
import DiscoverPage from "@/pages/DiscoverPage";
import SearchPage from "@/pages/SearchPage";
import MovieDetailPage from "@/pages/MovieDetailPage";
import TVDetailPage from "@/pages/TVDetailPage";
import PersonDetailPage from "@/pages/PersonDetailPage";
import ListsPage from "@/pages/ListsPage";
import ListDetailPage from "@/pages/ListDetailPage";
import DashboardPage from "@/pages/DashboardPage";
import SettingsPage from "@/pages/SettingsPage";
import EmbyDashboardPage from "@/pages/EmbyDashboardPage";

function App() {
  const theme = useAppStore((s) => s.theme);
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const settings = useAppStore((s) => s.settings);

  // 应用加载时同步 API Key（兼容设置页直接保存的场景）
  useEffect(() => {
    if (settings.apiKey) {
      setApiKey(settings.apiKey);
    }
  }, [settings.apiKey]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandOpen]);

  if (!settings.apiKey) {
    return <SettingsPage setupMode />;
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden text-foreground">
      {/* 流动液态背景 */}
      <div className="liquid-bg">
        <div
          className="liquid-blob"
          style={{
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(99,102,241,0.7), transparent 70%)",
            top: -120, left: -100,
            animationDelay: "0s",
          }}
        />
        <div
          className="liquid-blob"
          style={{
            width: 600, height: 550,
            background: "radial-gradient(circle, rgba(236,72,153,0.6), transparent 70%)",
            top: "30%", right: -180, left: "auto",
            animationDelay: "-6s",
          }}
        />
        <div
          className="liquid-blob"
          style={{
            width: 450, height: 480,
            background: "radial-gradient(circle, rgba(6,182,212,0.6), transparent 70%)",
            bottom: -100, left: "20%",
            animationDelay: "-12s",
          }}
        />
        <div
          className="liquid-blob"
          style={{
            width: 520, height: 500,
            background: "radial-gradient(circle, rgba(139,92,246,0.6), transparent 70%)",
            top: "10%", left: "50%",
            animationDelay: "-18s",
          }}
        />
      </div>

      <Sidebar />
      <main className="relative flex-1 flex min-w-0 z-10">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<DiscoverPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/tv/:id" element={<TVDetailPage />} />
            <Route path="/person/:id" element={<PersonDetailPage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:listId" element={<ListDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          <Route path="/emby" element={<EmbyDashboardPage />} />
          </Routes>
        </div>
        <RightPanel />
      </main>
      <CommandPalette />
    </div>
  );
}

export default App;
