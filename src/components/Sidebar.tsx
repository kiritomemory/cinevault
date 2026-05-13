import { Compass, Search, Bookmark, BarChart3, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import type { SidebarItem } from "@/types";

const items: { id: SidebarItem; icon: React.ReactNode; label: string; path: string }[] = [
  { id: "discover", icon: <Compass size={22} />, label: "发现", path: "/" },
  { id: "search", icon: <Search size={22} />, label: "搜索", path: "/search" },
  { id: "lists", icon: <Bookmark size={22} />, label: "清单", path: "/lists" },
  { id: "dashboard", icon: <BarChart3 size={22} />, label: "看板", path: "/dashboard" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const active = useAppStore((s) => s.sidebarActive);
  const setActive = useAppStore((s) => s.setSidebarActive);

  const handleNav = (item: typeof items[0]) => {
    setActive(item.id);
    navigate(item.path);
  };

  return (
    <aside className="glass-panel w-[50px] flex-shrink-0 border-r border-white/10 flex flex-col items-center py-3 z-20">
      <div className="mb-4">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <User size={16} />
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1 w-full">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item)}
            title={item.label}
            className={`w-full h-10 flex items-center justify-center rounded-lg mx-auto transition-colors relative group
              ${active === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >
            {item.icon}
            {active === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
            )}
            <span className="absolute left-full ml-2 px-2 py-1 rounded bg-popover text-popover-foreground text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg border border-border">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      <button
        onClick={() => handleNav({ id: "settings", icon: <Settings size={20} />, label: "设置", path: "/settings" })}
        title="设置"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Settings size={20} />
      </button>
    </aside>
  );
}
