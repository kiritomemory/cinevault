// Emby 数据模型
export interface EmbySeries {
  id: string; name: string; year: string;
  status: "Continuing" | "Ended" | "Unknown";
  statusLabel: "更新中" | "已完结" | "未知";
  providerIds: { Tvdb?: string; Tmdb?: string; Imdb?: string };
  genres: string[]; rating: number | null; library: string;
  seasonCount: number; seasons: EmbySeason[];
  totalEpisodes: number; expectedEpisodes: number;
  hasGaps: boolean; gapCount: number;
  embyMissingCount: number; unplayedCount: number;
  lastAdded: string; tmdbId: number | null; cachedAt: string;
}
export interface EmbySeason {
  num: number; name: string; count: number;
  first: number | null; last: number | null;
  gaps: number[]; isSpecial: boolean;
}
export interface EmbyLibrary { id: string; name: string; collectionType: string; itemCount: number; }
export interface EmbyRecentItem { name: string; series: string; seriesId: string; season: number; episode: number; created: string; runtime: number; }
export interface EmbyResumeItem { name: string; series: string; season: number; episode: number; percentage: number; }
export interface EmbyActivity { date: string; name: string; type: string; user: string; severity: string; }
export interface EmbyStats { totalSeries: number; totalEpisodes: number; completed: number; continuing: number; unknown: number; withGaps: number; embyMissing: number; unplayedTotal: number; libraries: { name: string; count: number; ongoing: number }[]; time: string; }
export interface EmbyConnectResult { success: boolean; userId?: string; serverName?: string; version?: string; error?: string; seriesCount?: number; libraryCount?: number; }
