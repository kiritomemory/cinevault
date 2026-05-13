export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type: "movie";
  runtime?: number;
  budget?: number;
  revenue?: number;
  tagline?: string;
  status?: string;
  original_language?: string;
  production_countries?: { name: string }[];
  genres?: { id: number; name: string }[];
}

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type: "tv";
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  status?: string;
  original_language?: string;
  genres?: { id: number; name: string }[];
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  media_type: "person";
  birthday?: string;
  place_of_birth?: string;
  biography?: string;
  also_known_as?: string[];
  gender?: number;
}

export type MediaItem = Movie | TVShow | Person;

export interface List {
  id: number;
  name: string;
  description: string | null;
  cover_path: string | null;
  sort_order: number;
  created_at: string;
  is_system: number;
}

export interface ListItem {
  id: number;
  list_id: number;
  tmdb_id: number;
  media_type: "movie" | "tv";
  added_at: string;
  custom_order: number;
  title?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
}

export interface UserMarking {
  id: number;
  tmdb_id: number;
  media_type: "movie" | "tv";
  is_watched: number;
  is_watchlist: number;
  is_favorite: number;
  user_rating: number | null;
  review_text: string | null;
  watch_date: string | null;
  updated_at: string;
}

export interface SearchHistoryItem {
  id: number;
  keyword: string;
  searched_at: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface ImageItem {
  file_path: string;
  width: number;
  height: number;
}

export interface AppSettings {
  apiKey: string;
  theme: "light" | "dark" | "system";
  language: string;
  region: string;
}

export type ViewMode = "grid" | "list";
export type SidebarItem = "discover" | "search" | "lists" | "dashboard" | "settings";
