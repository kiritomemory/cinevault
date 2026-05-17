const BASE_URL = "https://api.themoviedb.org/3";
const STORE_KEY = "cinevault-app-store";

export function setApiKey(_key: string) {}

export function getApiKey(): string | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.settings?.apiKey || null;
  } catch {
    return null;
  }
}

function getLanguageParam(): string {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return "zh-CN";
    const parsed = JSON.parse(raw);
    return parsed?.state?.settings?.language || "zh-CN";
  } catch {
    return "zh-CN";
  }
}

function getRegionParam(): string {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return "CN";
    const parsed = JSON.parse(raw);
    return parsed?.state?.settings?.region || "CN";
  } catch {
    return "CN";
  }
}

export async function tmdbFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const key = getApiKey();
  if (!key) throw new Error("API Key 未配置");
  const allParams: Record<string, string> = { api_key: key, ...params };
  // 默认加上语言和区域参数（除非显式覆盖）
  if (!allParams.language) allParams.language = getLanguageParam();
  const query = new URLSearchParams(allParams).toString();
  const res = await fetch(`${BASE_URL}/${endpoint}?${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// 统一标题格式化：名字.年份.[tmdb=id]
export function formatMediaTitle(item: { title?: string; name?: string; id?: number; release_date?: string; first_air_date?: string }): string {
  const title = item.title || item.name || "";
  const year = (item.release_date || item.first_air_date || "").split("-")[0];
  const id = item.id;
  const yearPart = year ? `.${year}` : "";
  const idPart = id !== undefined ? `.[tmdb=${id}]` : "";
  return `${title}${yearPart}${idPart}`;
}

export async function searchMulti(query: string, page = 1) {
  return tmdbFetch("search/multi", { query, page: String(page), include_adult: "false" });
}

export async function searchMovies(query: string, page = 1) {
  return tmdbFetch("search/movie", { query, page: String(page), include_adult: "false" });
}

export async function searchTv(query: string, page = 1) {
  return tmdbFetch("search/tv", { query, page: String(page), include_adult: "false" });
}

export async function searchPeople(query: string, page = 1) {
  return tmdbFetch("search/person", { query, page: String(page), include_adult: "false" });
}

export async function getMovieDetails(id: number) {
  return tmdbFetch(`movie/${id}`, { append_to_response: "credits,videos,images,recommendations" });
}

export async function getTvDetails(id: number) {
  return tmdbFetch(`tv/${id}`, { append_to_response: "credits,videos,images,recommendations" });
}

export async function getTvSeasonDetails(id: number, seasonNumber: number) {
  return tmdbFetch(`tv/${id}/season/${seasonNumber}`, { append_to_response: "credits" });
}

export async function getPersonDetails(id: number) {
  return tmdbFetch(`person/${id}`, { append_to_response: "combined_credits,images" });
}

export async function getPopularMovies(page = 1) {
  return tmdbFetch("movie/popular", { page: String(page), region: getRegionParam() });
}

export async function getNowPlayingMovies(page = 1) {
  return tmdbFetch("movie/now_playing", { page: String(page), region: getRegionParam() });
}

export async function getUpcomingMovies(page = 1) {
  return tmdbFetch("movie/upcoming", { page: String(page), region: getRegionParam() });
}

export async function getTopRatedMovies(page = 1) {
  return tmdbFetch("movie/top_rated", { page: String(page), region: getRegionParam() });
}

export async function getPopularTv(page = 1) {
  return tmdbFetch("tv/popular", { page: String(page) });
}

export async function getTopRatedTv(page = 1) {
  return tmdbFetch("tv/top_rated", { page: String(page) });
}

export async function getAiringTodayTv(page = 1) {
  return tmdbFetch("tv/airing_today", { page: String(page) });
}

export async function getOnTheAirTv(page = 1) {
  return tmdbFetch("tv/on_the_air", { page: String(page) });
}

export async function getTrending(timeWindow: "day" | "week" = "week", page = 1) {
  return tmdbFetch(`trending/all/${timeWindow}`, { page: String(page) });
}

export function getImageUrl(path: string | null, size: string = "w500"): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function getGenreList() {
  return tmdbFetch("genre/movie/list", {});
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "未知";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export function formatRuntime(minutes: number | undefined): string {
  if (!minutes) return "未知";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}小时 ${m}分钟` : `${m}分钟`;
}

export function formatCurrency(amount: number | undefined): string {
  if (!amount) return "未知";
  return `$${(amount / 1_000_000).toFixed(1)}M`;
}

export function formatVote(vote: number | undefined, count: number | undefined): string {
  if (!vote) return "暂无评分";
  const c = count ?? 0;
  const suffix = c >= 1000 ? `${(c / 1000).toFixed(1)}k` : String(c);
  return `⭐ ${vote.toFixed(1)} (${suffix})`;
}
