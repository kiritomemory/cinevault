import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Film, Tv, User, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { searchMulti, searchMovies, searchTv, searchPeople, getImageUrl } from "@/services/tmdb";
import { addSearchHistory, getSearchHistory, clearSearchHistory } from "@/services/db";
import { useAppStore } from "@/stores/appStore";
import MediaCard from "@/components/MediaCard";
import type { Movie, TVShow, Person } from "@/types";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const setStoreQuery = useAppStore((s) => s.setSearchQuery);
  const [query, setQuery] = useState(urlQuery);
  const [filter, setFilter] = useState<"all" | "movie" | "tv" | "person">("all");
  const [results, setResults] = useState<(Movie | TVShow | Person)[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(urlQuery);
    setStoreQuery(urlQuery);
    if (urlQuery) {
      doSearch(urlQuery, 1);
      addSearchHistory(urlQuery);
    }
    loadHistory();
  }, [urlQuery]);

  const loadHistory = async () => {
    const h = await getSearchHistory();
    setHistory(h);
  };

  const doSearch = async (q: string, p: number) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      let data;
      if (filter === "movie") data = await searchMovies(q, p);
      else if (filter === "tv") data = await searchTv(q, p);
      else if (filter === "person") data = await searchPeople(q, p);
      else data = await searchMulti(q, p);
      const mapped = (data.results || []).map((item: any) => ({ ...item, media_type: item.media_type || (filter === "movie" ? "movie" : filter === "tv" ? "tv" : "person") }));
      setResults((prev) => (p === 1 ? mapped : [...prev, ...mapped]));
      setHasMore(p < (data.total_pages || 1));
      setError(null);
    } catch (e: any) {
      setError("搜索失败，请检查网络连接或 API Key");
      if (p === 1) setResults([]);
    }
    setLoading(false);
  };

  const handleSearch = (q: string) => {
    setQuery(q);
    setStoreQuery(q);
    setPage(1);
    setSearchParams(q ? { q } : {});
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    doSearch(query, next);
  };

  const movies = results.filter((r) => r.media_type === "movie") as Movie[];
  const tvs = results.filter((r) => r.media_type === "tv") as TVShow[];
  const people = results.filter((r) => r.media_type === "person") as Person[];

  const displayResults = filter === "all" ? results : results.filter((r) => r.media_type === filter);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索影视、人物..."
              className="w-full h-10 pl-10 pr-4 rounded-lg glass-panel border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {!query && history.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">搜索历史</span>
              <button onClick={() => { clearSearchHistory(); loadHistory(); }} className="text-xs text-muted-foreground hover:text-foreground">清空</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleSearch(h.keyword)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs hover:bg-accent/80 transition-colors"
                >
                  <Clock size={12} />
                  {h.keyword}
                </button>
              ))}
            </div>
          </div>
        )}

        {query && (
          <div className="flex items-center gap-1 mb-4">
            {(["all", "movie", "tv", "person"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); doSearch(query, 1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${filter === f ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
              >
                {f === "all" ? "全部" : f === "movie" ? "电影" : f === "tv" ? "剧集" : "人物"}
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertCircle size={32} className="mb-3 text-destructive" />
          <p className="text-sm mb-3">{error}</p>
          <button onClick={() => doSearch(query, 1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs">
            <RefreshCw size={14} /> 重试
          </button>
        </div>
      ) : loading && page === 1 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
          搜索中...
        </div>
      ) : query && displayResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search size={40} className="mb-3 opacity-30" />
          <p className="text-sm">没有找到与 "{query}" 相关的内容</p>
          <button onClick={() => handleSearch(query)} className="mt-2 text-xs text-primary hover:underline">重试</button>
        </div>
      ) : (
        <>
          {filter === "all" && (
            <>
              {movies.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Film size={16} /> 电影 ({movies.length})
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {movies.map((m) => <MediaCard key={m.id} item={m} />)}
                  </div>
                </div>
              )}
              {tvs.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Tv size={16} /> 剧集 ({tvs.length})
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {tvs.map((t) => <MediaCard key={t.id} item={t} />)}
                  </div>
                </div>
              )}
              {people.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <User size={16} /> 人物 ({people.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {people.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                        <img src={getImageUrl(p.profile_path, "w185") || ""} alt={p.name} className="w-12 h-12 rounded-full object-cover bg-muted" />
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.known_for_department}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {filter !== "all" && (
            <div className="flex flex-wrap gap-3">
              {displayResults.map((r) =>
                r.media_type === "person" ? (
                  <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors cursor-pointer w-full max-w-sm">
                    <img src={getImageUrl((r as Person).profile_path, "w185") || ""} alt={(r as Person).name} className="w-12 h-12 rounded-full object-cover bg-muted" />
                    <div>
                      <p className="text-sm font-medium">{(r as Person).name}</p>
                      <p className="text-xs text-muted-foreground">{(r as Person).known_for_department}</p>
                    </div>
                  </div>
                ) : (
                  <MediaCard key={`${r.media_type}-${r.id}`} item={r as Movie | TVShow} />
                )
              )}
            </div>
          )}
          {hasMore && query && (
            <div className="flex justify-center py-6">
              <button onClick={loadMore} disabled={loading} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors disabled:opacity-50">
                {loading ? "加载中..." : "加载更多"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
