import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Film, Heart, Eye } from "lucide-react";
import { getLists, deleteList, createList } from "@/services/db";
import type { List } from "@/types";

// 图标映射（系统清单）
const SYSTEM_ICONS: Record<string, React.ReactNode> = {
  "已看": <Eye size={18} />,
  "想看的": <Film size={18} />,
  "收藏": <Heart size={18} />,
};

export default function ListsPage() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    const ls = await getLists();
    setLists(ls);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newListName.trim()) return;
    await createList(newListName, newListDesc);
    setNewListName("");
    setNewListDesc("");
    setShowCreate(false);
    loadLists();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此清单吗？")) return;
    await deleteList(id);
    loadLists();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">我的清单</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> 新建清单
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 rounded-lg glass-panel">
          <h3 className="text-sm font-medium mb-3">新建清单</h3>
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="清单名称"
            autoFocus
            className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground mb-2"
          />
          <input
            value={newListDesc}
            onChange={(e) => setNewListDesc(e.target.value)}
            placeholder="描述（可选）"
            className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground mb-3"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">取消</button>
            <button onClick={handleCreate} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">创建</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((list) => (
          <div
            key={list.id}
            className="glass-panel rounded-xl p-4 cursor-pointer hover:scale-[1.01] transition-transform"
            onClick={() => navigate(`/lists/${list.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-primary">{list.is_system ? (SYSTEM_ICONS[list.name] || <Film size={18} />) : <Film size={18} />}</span>
                <h3 className="font-semibold text-foreground">{list.name}</h3>
              </div>
              {!list.is_system && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(list.id); }}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {list.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{list.description}</p>
            )}
            <p className="text-xs text-muted-foreground">{list.is_system ? "系统清单" : "自定义清单"}</p>
          </div>
        ))}
      </div>

      {lists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Film size={40} className="mb-3 opacity-30" />
          <p className="text-sm">还没有清单</p>
          <p className="text-xs mt-1">点击上方按钮创建一个吧</p>
        </div>
      )}
    </div>
  );
}
