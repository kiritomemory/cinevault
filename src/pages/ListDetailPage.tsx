import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, X } from "lucide-react";
import { getLists, getListItems, removeFromList, deleteList } from "@/services/db";
import { getMovieByTmdbId, getTvShowByTmdbId } from "@/services/db";
import { getImageUrl } from "@/services/tmdb";
import { useAppStore } from "@/stores/appStore";
import type { List, ListItem } from "@/types";

interface EnrichedItem extends ListItem {
  title?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
}

export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const [lists, setLists] = useState<List[]>([]);
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setSelected = useAppStore((s) => s.setSelectedMedia);

  const listData = lists.find((l) => l.id === Number(listId));

  useEffect(() => {
    Promise.all([getLists(), listId ? getListItems(Number(listId)) : Promise.resolve([])]).then(
      async ([ls, its]) => {
        setLists(ls);
        // Enrich items with movie/tv details from IndexedDB
        const enriched: EnrichedItem[] = await Promise.all(
          its.map(async (item) => {
            const detail =
              item.media_type === "movie"
                ? await getMovieByTmdbId(item.tmdb_id)
                : await getTvShowByTmdbId(item.tmdb_id);
            return {
              ...item,
              title: detail?.title || detail?.name || `TMDB ${item.tmdb_id}`,
              poster_path: detail?.poster_path ?? null,
              vote_average: detail?.vote_average ?? 0,
              release_date: detail?.release_date || detail?.first_air_date || item.release_date,
            };
          })
        );
        setItems(enriched);
        setLoading(false);
      }
    );
  }, [listId]);

  const handleRemove = async (item: EnrichedItem) => {
    await removeFromList(item.list_id, item.tmdb_id, item.media_type);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleDelete = async () => {
    if (!listId) return;
    if (!confirm("确定要删除此清单吗？")) return;
    await deleteList(Number(listId));
    navigate("/lists");
  };

  const handleView = (item: EnrichedItem) => {
    setSelected({
      id: item.tmdb_id,
      media_type: item.media_type,
      title: item.title,
      name: item.title,
      poster_path: item.poster_path ?? null,
      vote_average: item.vote_average,
      release_date: item.release_date,
    } as any);
  };

  const formatTitle = (item: EnrichedItem) => {
    const year = (item.release_date || "").split("-")[0];
    return item.title + (year ? `.${year}` : "") + `.[tmdb=${item.tmdb_id}]`;
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
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/lists")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors glass-panel px-3 py-1 rounded-lg"
        >
          <ChevronLeft size={16} /> 全部清单
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{listData?.name || "清单"}</h2>
          {listData?.description && (
            <p className="text-sm text-muted-foreground">{listData.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!listData?.is_system && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="删除清单"
            >
              <Trash2 size={16} />
            </button>
          )}
          <span className="text-xs text-muted-foreground px-2">{items.length} 条</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">清单为空</p>
          <p className="text-xs mt-1">从影视详情页的"加入清单"按钮添加条目</p>
          <button
            onClick={() => navigate("/")}
            className="mt-3 text-xs text-primary hover:underline"
          >
            去发现看看
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <div
                className="cursor-pointer"
                onClick={() => handleView(item)}
              >
                <img
                  src={getImageUrl(item.poster_path ?? null, "w342") || ""}
                  alt={formatTitle(item)}
                  className="w-full aspect-[2/3] rounded-lg object-cover bg-muted transition-transform group-hover:scale-[1.02]"
                />
                <div className="mt-1.5 px-0.5">
                  <p className="text-[11px] font-medium truncate" title={formatTitle(item)}>
                    {formatTitle(item)}
                  </p>
                  {!!item.vote_average && (
                    <p className="text-xs text-muted-foreground">⭐ {item.vote_average!.toFixed(1)}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemove(item)}
                className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                title="从清单移除"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
