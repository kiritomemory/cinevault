import { useState, useEffect, useRef } from "react";
import { Search, Eye, Bookmark, BarChart3, Settings, Moon, Upload } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useNavigate } from "react-router-dom";

const commands = [
  { id: "search", label: "搜索电影", icon: <Search size={16} />, action: "navigate", target: "/search" },
  { id: "watchlist", label: "前往想看的清单", icon: <Bookmark size={16} />, action: "navigate", target: "/lists" },
  { id: "mark-watched", label: "标记当前项目为已看", icon: <Eye size={16} />, action: "mark" },
  { id: "dashboard", label: "打开数据看板", icon: <BarChart3 size={16} />, action: "navigate", target: "/dashboard" },
  { id: "theme", label: "切换深色/浅色模式", icon: <Moon size={16} />, action: "theme" },
  { id: "settings", label: "打开设置", icon: <Settings size={16} />, action: "navigate", target: "/settings" },
  { id: "import", label: "导入数据", icon: <Upload size={16} />, action: "navigate", target: "/settings" },
];

export default function CommandPalette() {
  const open = useAppStore((s) => s.commandOpen);
  const setOpen = useAppStore((s) => s.setCommandOpen);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[selected];
        if (cmd) execute(cmd);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filtered, selected]);

  const execute = (cmd: typeof commands[0]) => {
    if (cmd.action === "navigate" && cmd.target) navigate(cmd.target);
    if (cmd.action === "theme") toggleTheme();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-[560px] glass-panel rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="输入命令..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono">ESC</kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">未找到命令</div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => execute(cmd)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${i === selected ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"}`}
              >
                <span className="text-muted-foreground">{cmd.icon}</span>
                {cmd.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
