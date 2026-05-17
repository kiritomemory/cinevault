import { useState, useRef } from "react";
import { KeyRound, Moon, Sun, Monitor, Globe, Save, ExternalLink, Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { setApiKey } from "@/services/tmdb";
import { getAllMarkings, importMarkings } from "@/services/db";

interface Props {
  setupMode?: boolean;
}

export default function SettingsPage({ setupMode }: Props) {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings({ apiKey: apiKeyInput });
    setApiKey(apiKeyInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const data = await getAllMarkings();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinevault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const records = Array.isArray(json) ? json : [];
        if (records.length === 0) {
          setImportStatus({ type: "error", msg: "文件格式不正确或无有效数据" });
          return;
        }
        const { imported, skipped } = await importMarkings(records);
        setImportStatus({ type: "success", msg: `成功导入 ${imported} 条记录${skipped > 0 ? `，跳过 ${skipped} 条` : ""}` });
        setTimeout(() => setImportStatus(null), 4000);
      } catch {
        setImportStatus({ type: "error", msg: "解析文件失败，请检查格式" });
      }
    };
    reader.readAsText(file);
    // 重置 input，允许同一文件再次选择
    e.target.value = "";
  };

  if (setupMode) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-[420px] p-8 rounded-2xl glass-panel shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">欢迎使用 CineVault</h1>
            <p className="text-sm text-muted-foreground">配置您的 TMDB API Key 以开始使用</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">TMDB API Key</label>
              <input
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="输入您的 API Key"
                className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                前往{" "}
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  TMDB 设置 <ExternalLink size={10} />
                </a>{" "}
                获取 API Key
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={!apiKeyInput.trim()}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saved ? "已保存！" : "开始使用"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-xl font-bold text-foreground mb-6">设置</h2>

      <div className="max-w-xl space-y-6">
        <div className="p-4 rounded-xl glass-panel">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={18} className="text-primary" />
            <h3 className="text-sm font-semibold">API 配置</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">TMDB API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="输入 API Key"
                  className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
                <button onClick={handleSave} className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Save size={14} />
                </button>
              </div>
            </div>
            {saved && <p className="text-xs text-green-500">设置已保存</p>}
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel">
          <div className="flex items-center gap-2 mb-3">
            <Monitor size={18} className="text-primary" />
            <h3 className="text-sm font-semibold">外观</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors
                ${theme === "light" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
            >
              <Sun size={14} /> 浅色
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors
                ${theme === "dark" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
            >
              <Moon size={14} /> 深色
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl glass-panel">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} className="text-primary" />
            <h3 className="text-sm font-semibold">语言与区域</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">语言</label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="w-full h-9 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="zh-CN">简体中文</option>
                <option value="zh-TW">繁體中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">区域</label>
              <select
                value={settings.region}
                onChange={(e) => updateSettings({ region: e.target.value })}
                className="w-full h-9 px-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="CN">中国</option>
                <option value="US">美国</option>
                <option value="HK">香港</option>
                <option value="TW">台湾</option>
              </select>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="p-4 rounded-xl glass-panel">
          <div className="flex items-center gap-2 mb-3">
            <Download size={18} className="text-primary" />
            <h3 className="text-sm font-semibold">数据管理</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            导出备份你的观影记录（评分、标记、想看列表），或从备份文件恢复。
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors"
            >
              <Download size={14} /> 导出数据
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors"
            >
              <Upload size={14} /> 导入数据
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
          {importStatus && (
            <div className={`mt-3 flex items-center gap-2 text-xs p-2 rounded-lg ${importStatus.type === "success" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
              {importStatus.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {importStatus.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
