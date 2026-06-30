import { useEffect, useState } from "react";
import { Star, Clock, Calendar, Globe, Heart, BookmarkCheck, Eye, Plus, ChevronLeft, Play, Image as ImageIcon, ChevronDown, ChevronUp, Tv2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getTvDetails, getTvSeasonDetails, getImageUrl, formatDate, formatVote } from "@/services/tmdb";
import { saveTvShow, getMarking, setMarking, getLists, addToList } from "@/services/db";
import { useAppStore } from "@/stores/appStore";
import { showToast } from "@/components/Toast";
import EmbyStatusPanel from "@/components/EmbyStatusPanel";
import type { TVShow, CastMember, CrewMember, Video, ImageItem } from "@/types";

type Tab = "overview" | "seasons" | "cast" | "media" | "recommendations";

interface SeasonEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  season_number: number;
  runtime: number | null;
  vote_average: number;
  credits: { cast: CastMember[]; crew: CrewMember[] };
}

export default function TVDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id ? parseInt(id, 10) : 0;

  const [data, setData] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarkingState] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [showListMenu, setShowListMenu] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // 展开的季号
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Record<number, SeasonEpisode[]>>({});
  const [loadingEpisodes, setLoadingEpisodes] = useState<number | null>(null);

  const setSelected = useAppStore((s) => s.setSelectedMedia);

  const openRatingForm = () => {
    setRatingValue(marking?.user_rating || 0);
    setReviewText(marking?.review_text || "");
    setShowRatingForm(true);
  };

  const saveRating = async () => {
    if (!data) return;
    await setMarking(numericId, "tv", {
      user_rating: ratingValue || null,
      review_text: reviewText.trim() || null,
    });
    const updated = await getMarking(numericId, "tv");
    setMarkingState(updated);
    setShowRatingForm(false);
  };

  useEffect(() => {
    if (!numericId || isNaN(numericId)) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getTvDetails(numericId);
        setData(detail);
        setSelected({ ...detail, media_type: "tv" });
        await saveTvShow(detail);
        const m = await getMarking(numericId, "tv");
        setMarkingState(m);
        const ls = await getLists();
        setLists(ls);
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("API Key 未配置")) {
          setError("API Key 未配置，请在设置中填写 TMDB API Key");
        } else if (msg.includes("401") || msg.includes("403")) {
          setError("API Key 无效，请检查设置中的 API Key 是否正确");
        } else if (msg.includes("404")) {
          setError("未找到该剧集");
        } else {
          setError(`加载失败：${msg}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [numericId]);

  const toggleMark = async (field: "is_watched" | "is_watchlist" | "is_favorite") => {
    if (!data) return;
    const current = marking?.[field] ? true : false;
    await setMarking(numericId, "tv", { [field]: !current });
    const updated = await getMarking(numericId, "tv");
    setMarkingState(updated);
  };

  const handleAddToList = async (listId: number) => {
    if (!data) return;
    try {
      await addToList(listId, numericId, "tv");
      const listName = lists.find((l) => l.id === listId)?.name || "清单";
      showToast(`已添加到「${listName}」`, "success");
      // 刷新清单列表（可能新增了清单）
      const ls = await getLists();
      setLists(ls);
    } catch (e) {
      showToast("添加失败，请重试", "error");
    }
    setShowListMenu(false);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleViewPerson = (personId: number) => {
    navigate(`/person/${personId}`);
  };

  const handleViewRecommendation = (r: any) => {
    navigate(`/${r.media_type || "tv"}/${r.id}`);
  };

  const toggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
      return;
    }
    if (seasonEpisodes[seasonNumber]) {
      setExpandedSeason(seasonNumber);
      return;
    }
    setLoadingEpisodes(seasonNumber);
    try {
      const detail = await getTvSeasonDetails(numericId, seasonNumber);
      setSeasonEpisodes((prev) => ({ ...prev, [seasonNumber]: detail.episodes || [] }));
      setExpandedSeason(seasonNumber);
    } catch {
      // Silently fail - season data is supplementary
    } finally {
      setLoadingEpisodes(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-sm mb-2">{error}</p>
        <button onClick={handleGoBack} className="text-primary text-sm hover:underline">返回上一页</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <p>未找到相关内容</p>
        <button onClick={handleGoBack} className="mt-2 text-primary text-sm hover:underline">返回上一页</button>
      </div>
    );
  }

  const title = data.name;
  const originalTitle = data.original_name;
  const year = (data.first_air_date || "").split("-")[0];
  const displayTitle = title + (year ? `.${year}` : "") + `.[tmdb=${data.id}]`;
  const avgRuntime = data.episode_run_time?.[0];
  const tagline = (data as any).tagline as string | undefined;
  const genres = (data as any).genres as { id: number; name: string }[] | undefined;
  const credits = (data as any).credits || {};
  const cast: CastMember[] = credits.cast || [];
  const crew: CrewMember[] = credits.crew || [];
  const videos: Video[] = ((data as any).videos?.results || []).filter((v: Video) => v.site === "YouTube");
  const backdrops: ImageItem[] = (data as any).images?.backdrops || [];
  const recommendations = ((data as any).recommendations?.results || []).map((r: any) => ({ ...r, media_type: r.media_type || "tv" }));
  const seasons: any[] = (data as any).seasons || [];
  const networks: any[] = (data as any).networks || [];
  const createdBy: any[] = (data as any).created_by || [];
  const status = (data as any).status as string | undefined;
  const type = (data as any).type as string | undefined;
  const originCountry = (data as any).origin_country || [];

  // 过滤掉纪录片季（Season 0 通常是纪录片特辑）
  const mainSeasons = seasons.filter((s) => s.season_number > 0);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0 h-[360px] overflow-hidden">
          <img
            src={getImageUrl(data.backdrop_path, "w1280") || ""}
            alt={title}
            className="w-full h-full object-cover blur-sm scale-105 opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        <div className="relative px-6 pt-6 pb-4">
          <button onClick={handleGoBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors glass-panel px-3 py-1 rounded-lg">
            <ChevronLeft size={16} /> 返回
          </button>
          <div className="flex gap-6">
            <img
              src={getImageUrl(data.poster_path, "w500") || ""}
              alt={title}
              className="w-[200px] h-[300px] rounded-xl shadow-2xl object-cover bg-muted flex-shrink-0"
            />
            <div className="glass-panel flex-1 pt-4 pb-4 px-5 rounded-xl">
              <h1 className="text-2xl font-bold text-foreground mb-1">{displayTitle}</h1>
              <p className="text-sm text-muted-foreground mb-1">{originalTitle}</p>
              {tagline && <p className="text-sm italic text-muted-foreground mb-3">"{tagline}"</p>}
              <EmbyStatusPanel tmdbId={numericId} />
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {genres?.map((g) => (
                  <span key={g.id} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">{g.name}</span>
                ))}
              </div>
              {/* 剧集基本信息 */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <Tv2 size={14} />
                <span>
                  {data.number_of_seasons} 季 {data.number_of_episodes} 集
                </span>
                {avgRuntime && <span>· 每集约 {avgRuntime} 分钟</span>}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => toggleMark("is_watchlist")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${marking?.is_watchlist ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
                >
                  <BookmarkCheck size={16} />
                  {marking?.is_watchlist ? "已想看" : "想看"}
                </button>
                <button
                  onClick={() => toggleMark("is_watched")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${marking?.is_watched ? "bg-green-600 text-white" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
                >
                  <Eye size={16} />
                  {marking?.is_watched ? "已看" : "标记已看"}
                </button>
                <button
                  onClick={() => toggleMark("is_favorite")}
                  className={`p-2 rounded-lg transition-colors ${marking?.is_favorite ? "bg-red-500/10 text-red-500" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
                >
                  <Heart size={16} fill={marking?.is_favorite ? "currentColor" : "none"} />
                </button>
                <div className="relative">
                  <button onClick={async () => {
                    // 打开时刷新清单列表
                    const ls = await getLists();
                    setLists(ls);
                    setShowListMenu(!showListMenu);
                  }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors">
                    <Plus size={16} /> 加入清单
                  </button>
                  {showListMenu && (
                    <div className="glass-popover absolute left-0 top-full mt-1 w-48 rounded-lg shadow-lg py-1 z-30">
                      {lists.filter((l) => !l.is_system).length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          暂无自定义清单
                        </div>
                      ) : (
                        lists.filter((l) => !l.is_system).map((list) => (
                          <button key={list.id} onClick={() => handleAddToList(list.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">
                            {list.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 glass-panel px-6">
        <div className="flex gap-6">
          {(["overview", "seasons", "cast", "media", "recommendations"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors
                ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "overview" ? "概览" : t === "seasons" ? `季 (${data.number_of_seasons})` : t === "cast" ? "演职人员" : t === "media" ? "媒体" : "相关推荐"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="text-sm font-semibold mb-2">剧情简介</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{data.overview || "暂无简介"}</p>
              {/* 评分展示 */}
              {marking?.user_rating && !showRatingForm && (
                <div className="mt-4 p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < Math.round(marking.user_rating) ? "currentColor" : "none"} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{marking.user_rating}/5</span>
                  </div>
                  {marking.review_text && <p className="text-xs text-muted-foreground mb-2">{marking.review_text}</p>}
                  <button onClick={openRatingForm} className="text-xs text-primary hover:underline">编辑评分</button>
                </div>
              )}
              {/* 评分输入表单 */}
              {showRatingForm && (
                <div className="mt-4 p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setRatingValue(i + 1)} className="transition-transform hover:scale-110">
                        <Star size={20} className={i < ratingValue ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} />
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{ratingValue}/5</span>
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="写一段简短的观后感..."
                    rows={2}
                    className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveRating} className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">保存</button>
                    <button onClick={() => setShowRatingForm(false)} className="px-3 py-1 rounded border border-border text-xs hover:bg-accent transition-colors">取消</button>
                  </div>
                </div>
              )}
              {!marking?.user_rating && !showRatingForm && (
                <button onClick={openRatingForm} className="mt-3 text-xs text-primary hover:underline">✦ 写评分</button>
              )}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} /> <span className="text-foreground font-medium">首播日期:</span> {formatDate(data.first_air_date)}
              </div>
              {avgRuntime && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={14} /> <span className="text-foreground font-medium">单集时长:</span> {avgRuntime} 分钟
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star size={14} /> <span className="text-foreground font-medium">评分:</span> {formatVote(data.vote_average, data.vote_count)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe size={14} /> <span className="text-foreground font-medium">语言:</span> {(data as any).original_language?.toUpperCase()}
              </div>
              {status && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium">状态:</span> {status}
                </div>
              )}
              {type && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium">类型:</span> {type}
                </div>
              )}
              {networks.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium">播出平台:</span> {networks.map((n: any) => n.name).join(", ")}
                </div>
              )}
              {createdBy.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium">主创:</span> {createdBy.map((c: any) => c.name).join(", ")}
                </div>
              )}
              {originCountry.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium">产地:</span> {originCountry.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "seasons" && (
          <div className="space-y-3">
            {mainSeasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无季信息</p>
            ) : (
              mainSeasons.map((season) => {
                const isExpanded = expandedSeason === season.season_number;
                const episodes = seasonEpisodes[season.season_number];
                const isLoading = loadingEpisodes === season.season_number;

                return (
                  <div key={season.id} className="glass-panel rounded-xl overflow-hidden">
                    {/* 季标题行 */}
                    <button
                      onClick={() => toggleSeason(season.season_number)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/30 transition-colors"
                    >
                      <img
                        src={getImageUrl(season.poster_path, "w92") || ""}
                        alt={season.name}
                        className="w-12 h-18 rounded object-cover bg-muted flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{season.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {season.episode_count} 集 · {season.air_date ? season.air_date.split("-")[0] : "待定"}
                        </p>
                        {season.overview && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{season.overview}</p>
                        )}
                      </div>
                      <div className="text-muted-foreground flex-shrink-0">
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    </button>

                    {/* 集列表 */}
                    {isExpanded && episodes && (
                      <div className="border-t border-border px-4 py-3 space-y-2">
                        {episodes.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">暂无集数据</p>
                        ) : (
                          episodes.map((ep) => (
                            <div key={ep.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
                              <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0 mt-0.5">
                                {ep.episode_number}
                              </span>
                              {ep.still_path ? (
                                <img
                                  src={getImageUrl(ep.still_path, "w185") || ""}
                                  alt={ep.name}
                                  className="w-24 h-14 rounded object-cover bg-muted flex-shrink-0"
                                />
                              ) : (
                                <div className="w-24 h-14 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                                  <Tv2 size={16} className="text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground">{ep.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {ep.air_date ? ep.air_date : "待定"}
                                  {ep.runtime ? ` · ${ep.runtime}分钟` : ""}
                                  {ep.vote_average > 0 ? ` · ⭐ ${ep.vote_average.toFixed(1)}` : ""}
                                </p>
                                {ep.overview && (
                                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{ep.overview}</p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "cast" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">演员 ({cast.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {cast.slice(0, 20).map((c) => (
                  <div key={c.id} className="glass-card flex items-center gap-2 p-2 rounded-lg cursor-pointer"
                    onClick={() => handleViewPerson(c.id)}>
                    <img src={getImageUrl(c.profile_path, "w185") || ""} alt={c.name} className="w-10 h-10 rounded-full object-cover bg-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">剧组</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {crew.slice(0, 15).map((c) => (
                  <div key={`${c.id}-${c.job}`} className="glass-card flex items-center gap-2 p-2 rounded-lg">
                    <img src={getImageUrl(c.profile_path, "w185") || ""} alt={c.name} className="w-10 h-10 rounded-full object-cover bg-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.job}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "media" && (
          <div className="space-y-6">
            {videos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Play size={14} /> 预告片</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.slice(0, 4).map((v) => (
                    <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noreferrer" className="block aspect-video rounded-lg bg-muted overflow-hidden relative group">
                      <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center"><Play size={18} className="text-black ml-0.5" /></div>
                      </div>
                      <p className="absolute bottom-1.5 left-2 text-white text-xs font-medium drop-shadow">{v.name}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {backdrops.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><ImageIcon size={14} /> 剧照</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {backdrops.slice(0, 9).map((img, i) => (
                    <img key={i} src={getImageUrl(img.file_path, "w780") || ""} alt="" className="w-full aspect-video rounded-lg object-cover bg-muted" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "recommendations" && (
          <div>
            <h3 className="text-sm font-semibold mb-3">相关推荐</h3>
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无推荐</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {recommendations.slice(0, 12).map((r: any) => {
                  const rTitle = r.title || r.name || "";
                  const rYear = (r.release_date || r.first_air_date || "").split("-")[0];
                  const rDisplay = rTitle + (rYear ? `.${rYear}` : "") + `.[tmdb=${r.id}]`;
                  return (
                    <div key={r.id} className="glass-card cursor-pointer group" onClick={() => handleViewRecommendation(r)}>
                      <div className="rounded-lg overflow-hidden">
                        <img src={getImageUrl(r.poster_path, "w342") || ""} alt={rDisplay} className="w-full aspect-[2/3] object-cover bg-muted group-hover:opacity-80 transition-opacity" />
                      </div>
                      <p className="text-[11px] font-medium mt-1 leading-tight line-clamp-2">{rDisplay}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
