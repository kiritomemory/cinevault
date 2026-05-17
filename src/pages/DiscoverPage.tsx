import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getPopularMovies, getNowPlayingMovies, getUpcomingMovies, getTopRatedMovies, getTrending,
  getPopularTv, getTopRatedTv, getAiringTodayTv, getOnTheAirTv,
} from "@/services/tmdb";
import { saveMovie, saveTvShow } from "@/services/db";
import { useAppStore } from "@/stores/appStore";
import type { Movie, TVShow } from "@/types";

type MediaGroup = "movie" | "tv";
type MovieCat = "popular" | "nowPlaying" | "upcoming" | "topRated" | "trending";
type TvCat = "tvPopular" | "tvTopRated" | "tvAiringToday" | "tvOnTheAir" | "tvTrending";
type Category = MovieCat | TvCat;

const MOVIE_CATEGORIES: { key: MovieCat; label: string; fetch: (page?: number) => Promise<any> }[] = [
  { key: "popular",    label: "流行趋势",   fetch: getPopularMovies },
  { key: "nowPlaying", label: "正在热映",   fetch: getNowPlayingMovies },
  { key: "upcoming",   label: "即将上映",   fetch: getUpcomingMovies },
  { key: "topRated",   label: "高分推荐",   fetch: getTopRatedMovies },
  { key: "trending",   label: "本周趋势",   fetch: (p) => getTrending("week", p) },
];

const TV_CATEGORIES: { key: TvCat; label: string; fetch: (page?: number) => Promise<any> }[] = [
  { key: "tvPopular",     label: "热门剧集", fetch: getPopularTv },
  { key: "tvTopRated",    label: "高分剧集", fetch: getTopRatedTv },
  { key: "tvAiringToday", label: "今日播出", fetch: getAiringTodayTv },
  { key: "tvOnTheAir",    label: "正在连载", fetch: getOnTheAirTv },
  { key: "tvTrending",    label: "本周剧集", fetch: (p) => getTrending("week", p) },
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  const [mediaGroup, setMediaGroup] = useState<MediaGroup>("movie");
  const [activeMovieCat, setActiveMovieCat] = useState<MovieCat>("popular");
  const [activeTvCat, setActiveTvCat] = useState<TvCat>("tvPopular");
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const activeTab = mediaGroup === "movie" ? activeMovieCat : activeTvCat;
  const currentCategories = mediaGroup === "movie" ? MOVIE_CATEGORIES : TV_CATEGORIES;

  const fetchCategory = async (cat: Category, group: MediaGroup, p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const allCats = [...MOVIE_CATEGORIES, ...TV_CATEGORIES];
      const catConfig = allCats.find((c) => c.key === cat)!;
      const data = await catConfig.fetch(p);
      const isTvCat = group === "tv";
      const mapped = (data.results || [])
        .filter((m: any) => isTvCat ? m.media_type !== "movie" : m.media_type !== "tv")
        .map((m: any) => ({
          ...m,
          media_type: m.media_type || (isTvCat ? "tv" : "movie"),
        }));
      if (p === 1) {
        setItems(mapped);
      } else {
        setItems((prev) => [...prev, ...mapped]);
      }
      setHasMore(p < (data.total_pages || 1));
      setPage(p);
      // 缓存前20条到 IndexedDB
      if (p === 1) {
        const toCache = (data.results || []).slice(0, 20);
        if (isTvCat) {
          for (const tv of toCache) saveTvShow(tv).catch(() => {});
        } else {
          for (const m of toCache) saveMovie(m).catch(() => {});
        }
      }
    } catch (e: any) {
      const msg = e?.message || "未知错误";
      if (msg.includes("API Key 未配置")) {
        setError("API Key 未配置，请在设置中填写 TMDB API Key");
      } else if (msg.includes("401") || msg.includes("403")) {
        setError("API Key 无效，请检查设置中的 API Key 是否正确");
      } else {
        setError(`加载失败：${msg}`);
      }
      if (p === 1) setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory(activeTab, mediaGroup);
  }, [activeMovieCat, activeTvCat, mediaGroup]);

  const handleGroupChange = (g: MediaGroup) => {
    if (g !== mediaGroup) {
      setMediaGroup(g);
      setItems([]);
    }
  };

  const handleTabChange = (cat: Category) => {
    if (mediaGroup === "movie") {
      if (cat !== activeMovieCat) { setActiveMovieCat(cat as MovieCat); setItems([]); }
    } else {
      if (cat !== activeTvCat) { setActiveTvCat(cat as TvCat); setItems([]); }
    }
  };

  const handleLoadMore = () => {
    fetchCategory(activeTab, mediaGroup, page + 1);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* 顶部 Banner */}
      <BannerSection />

      {/* Tab 导航 + 搜索框 */}
      <div className="sticky top-0 z-10 glass-panel px-6">
        {/* 电影 / 剧集 切换 */}
        <div className="flex items-center gap-2 pt-3 pb-1">
          <button
            onClick={() => handleGroupChange("movie")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${mediaGroup === "movie" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
          >
            🎬 电影
          </button>
          <button
            onClick={() => handleGroupChange("tv")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${mediaGroup === "tv" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
          >
            📺 剧集
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1">
            {currentCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleTabChange(cat.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === cat.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* 右侧搜索框 */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${searchFocused ? "bg-accent border-ring" : "bg-background border-border"}`}>
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`); }}
              placeholder="搜索影视..."
              className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => handleSearch("")} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 px-6 py-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">数据加载失败</h2>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => fetchCategory(activeTab, mediaGroup)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={16} />
              重试
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              或前往{" "}
              <a href="#/settings" onClick={(e) => { e.preventDefault(); window.location.hash = "/settings"; }}>
                设置
              </a>{" "}
              检查 API Key
            </p>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-muted-foreground text-sm">加载中...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            暂无数据
          </div>
        ) : (
          <>
            {/* 网格展示 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
              {items.map((item) => (
                <MediaCardV2 key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
            {/* 加载更多 */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 rounded-lg bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {loading ? "加载中..." : "加载更多"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Banner 全宽轮播（5秒自动切换 + 左右箭头 + 点击跳转）
function BannerSection() {
  const [banner, setBanner] = useState<(Movie & { media_type: "movie" })[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    getPopularMovies().then((data) => {
      if (cancelled) return;
      const movies = (data.results || []).slice(0, 5).map((m: any) => ({ ...m, media_type: "movie" as const }));
      setBanner(movies);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setLoadError(true); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  // 5秒自动切换
  useEffect(() => {
    if (banner.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banner.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banner.length]);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent((prev) => (prev - 1 + banner.length) % banner.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent((prev) => (prev + 1) % banner.length); };
  const goToDetail = (e?: React.MouseEvent) => { if (e) e.stopPropagation(); window.location.hash = `/movie/${banner[current].id}`; };

  if (loading) {
    return (
      <div className="relative h-[280px] overflow-hidden flex-shrink-0 bg-muted">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-8 left-8 w-64 space-y-3">
          <div className="h-7 bg-white/20 rounded w-56" />
          <div className="h-3 bg-white/10 rounded w-40" />
          <div className="h-3 bg-white/10 rounded w-32" />
        </div>
      </div>
    );
  }

  if (loadError || banner.length === 0) return null;

  return (
    <div className="relative h-[280px] overflow-hidden flex-shrink-0 group">
      {banner.map((m, i) => (
        <div
          key={m.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
          onClick={goToDetail}
        >
          <img
            src={`https://image.tmdb.org/t/p/w1280${m.backdrop_path}`}
            alt={m.title || ""}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-md">
            <h2 className="text-white text-2xl font-bold mb-1">{m.title}</h2>
            <p className="text-white/70 text-xs line-clamp-2 leading-relaxed">{m.overview}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-yellow-400 text-xs font-medium">⭐ {m.vote_average?.toFixed(1)}</span>
              <span className="text-white/60 text-xs">{(m.release_date || "").split("-")[0]}</span>
              <button
                onClick={goToDetail}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-medium rounded-md transition-colors border border-white/20"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur text-xl font-bold" aria-label="上一张">‹</button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur text-xl font-bold" aria-label="下一张">›</button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banner.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`}
            aria-label={`跳转到第${i + 1}张`}
          />
        ))}
      </div>
    </div>
  );
}

// 媒体卡片（内联版本）
import { getImageUrl } from "@/services/tmdb";
import { Star } from "lucide-react";

function MediaCardV2({ item }: { item: Movie | TVShow }) {
  const setSelected = useAppStore((s) => s.setSelectedMedia);
  const title = ("title" in item ? item.title : item.name) || "";
  const year = ((item as Movie).release_date || (item as TVShow).first_air_date || "").split("-")[0];
  const displayTitle = title + (year ? `.${year}` : "") + `.[tmdb=${item.id}]`;

  return (
    <div
      className="glass-card cursor-pointer group"
      onClick={() => setSelected(item)}
    >
      <div className="relative rounded-lg overflow-hidden transition-all duration-200 group-hover:shadow-lg">
        <img
          src={getImageUrl(item.poster_path, "w342") || "/placeholder-poster.svg"}
          alt={title}
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-poster.svg"; }}
          className="w-full aspect-[2/3] object-cover bg-muted"
          loading="lazy"
        />
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium flex items-center gap-0.5">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          {item.vote_average?.toFixed(1) ?? "N/A"}
        </div>
      </div>
      <div className="mt-1.5">
        <p className="text-[11px] font-medium text-foreground leading-tight line-clamp-2">{displayTitle}</p>
      </div>
    </div>
  );
}
