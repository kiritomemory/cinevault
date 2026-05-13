import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight, X } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { getLists, createList } from "@/services/db";
import type { List } from "@/types";

export default function NavPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeSidebar = useAppStore((s) => s.sidebarActive);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const [lists, setLists] = useState<List[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    getLists().then(setLists);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const closeDialog = () => {
    setShowCreateDialog(false);
    setNewListName("");
  };

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) return;
    try {
      await createList(name);
      const updated = await getLists();
      setLists(updated);
      closeDialog();
    } catch (e) {
      console.error(e);
    }
  };

  const renderContent = () => {
    switch (activeSidebar) {
      case "discover":
        return (
          <div className={`px-3 pt-3 pb-2 transition-all ${searchFocused ? "bg-accent/50" : ""}`}>
            <div className="relative">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="搜索影视、人物..."
                className="w-full h-9 pl-9 pr-7 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => handleSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        );
      case "search":
        return (
          <div className="p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">搜索</h3>
            <div className="relative">
              <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="输入关键词..."
                autoFocus
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
        );
      case "lists":
        return (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3
                onClick={() => navigate("/lists")}
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
              >我的清单</h3>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="新建清单"
              >
                <Plus size={14} />
              </button>
            </div>
            {/* 新建清单弹窗 */}
            {showCreateDialog && (
              <div className="mb-2 p-2 rounded-lg bg-accent/60 border border-border">
                <input
                  type="text"
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateList();
                    if (e.key === "Escape") closeDialog();
                  }}
                  placeholder="清单名称..."
                  className="w-full h-8 px-2 rounded bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-ring mb-1.5"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCreateList}
                    className="flex-1 h-7 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    创建
                  </button>
                  <button
                    onClick={closeDialog}
                    className="flex-1 h-7 rounded bg-background border border-border text-xs hover:bg-accent transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
            <nav className="space-y-0.5">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-sm transition-colors
                    ${location.pathname === `/lists/${list.id}` ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
                >
                  <span className="truncate">{list.name}</span>
                  <ChevronRight size={14} className="flex-shrink-0 opacity-50" />
                </button>
              ))}
            </nav>
          </div>
        );
      case "dashboard":
        return (
          <div className="p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">数据看板</h3>
            <nav className="space-y-0.5">
              <button onClick={() => navigate("/dashboard")} className="w-full text-left px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                总览统计
              </button>
            </nav>
          </div>
        );
      case "settings":
        return (
          <div className="p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">设置</h3>
            <nav className="space-y-0.5">
              <button onClick={() => navigate("/settings")} className="w-full text-left px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                通用设置
              </button>
            </nav>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-border bg-card/50 flex flex-col overflow-y-auto">
      {renderContent()}
    </aside>
  );
}
