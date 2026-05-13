const DB_NAME = "CineVaultDB";
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const d = (e.target as IDBOpenDBRequest).result;
      if (!d.objectStoreNames.contains("movies")) {
        d.createObjectStore("movies", { keyPath: "tmdb_id" });
      }
      if (!d.objectStoreNames.contains("tv_shows")) {
        d.createObjectStore("tv_shows", { keyPath: "tmdb_id" });
      }
      if (!d.objectStoreNames.contains("persons")) {
        d.createObjectStore("persons", { keyPath: "tmdb_id" });
      }
      if (!d.objectStoreNames.contains("lists")) {
        const ls = d.createObjectStore("lists", { keyPath: "id", autoIncrement: true });
        ls.createIndex("is_system", "is_system", { unique: false });
      }
      if (!d.objectStoreNames.contains("list_items")) {
        const li = d.createObjectStore("list_items", { keyPath: "id", autoIncrement: true });
        li.createIndex("list_id", "list_id", { unique: false });
        li.createIndex("tmdb_media", ["tmdb_id", "media_type"], { unique: false });
      }
      if (!d.objectStoreNames.contains("user_markings")) {
        const um = d.createObjectStore("user_markings", { keyPath: "id", autoIncrement: true });
        um.createIndex("tmdb_media", ["tmdb_id", "media_type"], { unique: true });
      }
      if (!d.objectStoreNames.contains("search_history")) {
        const sh = d.createObjectStore("search_history", { keyPath: "id", autoIncrement: true });
        sh.createIndex("searched_at", "searched_at", { unique: false });
      }
    };
  });
}

async function initSystemLists() {
  const d = await openDb();
  const tx = d.transaction("lists", "readonly");
  const store = tx.objectStore("lists");
  const idx = store.index("is_system");
  const req = idx.getAll(1);
  const existing = await new Promise<any[]>((res) => { req.onsuccess = () => res(req.result); });
  if (existing.length === 0) {
    const wtx = d.transaction("lists", "readwrite");
    const wstore = wtx.objectStore("lists");
    wstore.add({ name: "收藏", description: "个人精选库，用于珍藏", sort_order: 0, created_at: new Date().toISOString(), is_system: 1 });
    wstore.add({ name: "想看的", description: "待观看计划库", sort_order: 1, created_at: new Date().toISOString(), is_system: 1 });
    wstore.add({ name: "已看", description: "已完成的观看历史", sort_order: 2, created_at: new Date().toISOString(), is_system: 1 });
    await new Promise<void>((res, rej) => { wtx.oncomplete = () => res(); wtx.onerror = () => rej(wtx.error); });
  }
}

initSystemLists();

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMovie(movie: any) {
  const d = await openDb();
  const tx = d.transaction("movies", "readwrite");
  await promisify(tx.objectStore("movies").put({ ...movie, tmdb_id: movie.id, media_type: "movie", cached_at: new Date().toISOString() }));
}

export async function getMovieByTmdbId(tmdbId: number): Promise<any | null> {
  const d = await openDb();
  const tx = d.transaction("movies", "readonly");
  return promisify(tx.objectStore("movies").get(tmdbId));
}

export async function getTvShowByTmdbId(tmdbId: number): Promise<any | null> {
  const d = await openDb();
  const tx = d.transaction("tv_shows", "readonly");
  return promisify(tx.objectStore("tv_shows").get(tmdbId));
}

export async function saveTvShow(tv: any) {
  const d = await openDb();
  const tx = d.transaction("tv_shows", "readwrite");
  await promisify(tx.objectStore("tv_shows").put({ ...tv, tmdb_id: tv.id, media_type: "tv", cached_at: new Date().toISOString() }));
}

export async function savePerson(person: any) {
  const d = await openDb();
  const tx = d.transaction("persons", "readwrite");
  await promisify(tx.objectStore("persons").put({ ...person, tmdb_id: person.id, cached_at: new Date().toISOString() }));
}

export async function getLists(): Promise<any[]> {
  const d = await openDb();
  const tx = d.transaction("lists", "readonly");
  const all = await promisify(tx.objectStore("lists").getAll());
  return all.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function createList(name: string, description?: string, coverPath?: string): Promise<number> {
  const d = await openDb();
  const tx = d.transaction("lists", "readwrite");
  const id = await promisify(tx.objectStore("lists").add({ name, description: description || null, cover_path: coverPath || null, sort_order: 10, created_at: new Date().toISOString(), is_system: 0 }));
  return id as number;
}

export async function deleteList(id: number) {
  const d = await openDb();
  const tx = d.transaction("lists", "readwrite");
  const existing = await promisify(tx.objectStore("lists").get(id));
  if (existing && !existing.is_system) {
    await promisify(tx.objectStore("lists").delete(id));
    // Also delete list items
    const itx = d.transaction("list_items", "readwrite");
    const idx = itx.objectStore("list_items").index("list_id");
    const items = await promisify(idx.getAll(id));
    for (const item of items) {
      await promisify(itx.objectStore("list_items").delete(item.id));
    }
  }
}

export async function getListItems(listId: number): Promise<any[]> {
  const d = await openDb();
  const tx = d.transaction("list_items", "readonly");
  const idx = tx.objectStore("list_items").index("list_id");
  return promisify(idx.getAll(listId));
}

export async function addToList(listId: number, tmdbId: number, mediaType: "movie" | "tv") {
  const d = await openDb();
  const tx = d.transaction("list_items", "readwrite");
  const store = tx.objectStore("list_items");
  const all = await promisify(store.getAll());
  const exists = all.some((i: any) => i.list_id === listId && i.tmdb_id === tmdbId && i.media_type === mediaType);
  if (!exists) {
    await promisify(store.add({ list_id: listId, tmdb_id: tmdbId, media_type: mediaType, added_at: new Date().toISOString(), custom_order: 0 }));
  }
}

export async function removeFromList(listId: number, tmdbId: number, mediaType: "movie" | "tv") {
  const d = await openDb();
  const tx = d.transaction("list_items", "readwrite");
  const store = tx.objectStore("list_items");
  const all = await promisify(store.getAll());
  const item = all.find((i: any) => i.list_id === listId && i.tmdb_id === tmdbId && i.media_type === mediaType);
  if (item) await promisify(store.delete(item.id));
}

export async function getMarking(tmdbId: number, mediaType: "movie" | "tv"): Promise<any | null> {
  const d = await openDb();
  const tx = d.transaction("user_markings", "readonly");
  const idx = tx.objectStore("user_markings").index("tmdb_media");
  const result = await promisify(idx.get([tmdbId, mediaType]));
  return result || null;
}

export async function getAllMarkings(): Promise<any[]> {
  const d = await openDb();
  const tx = d.transaction("user_markings", "readonly");
  return promisify(tx.objectStore("user_markings").getAll());
}

export async function setMarking(tmdbId: number, mediaType: "movie" | "tv", data: Partial<any>) {
  const d = await openDb();
  const tx = d.transaction("user_markings", "readwrite");
  const store = tx.objectStore("user_markings");
  const idx = store.index("tmdb_media");
  const existing = await promisify(idx.get([tmdbId, mediaType]));
  if (existing) {
    const updated = { ...existing };
    if (data.is_watched !== undefined) updated.is_watched = data.is_watched ? 1 : 0;
    if (data.is_watchlist !== undefined) updated.is_watchlist = data.is_watchlist ? 1 : 0;
    if (data.is_favorite !== undefined) updated.is_favorite = data.is_favorite ? 1 : 0;
    if (data.user_rating !== undefined) updated.user_rating = data.user_rating;
    if (data.review_text !== undefined) updated.review_text = data.review_text;
    if (data.watch_date !== undefined) updated.watch_date = data.watch_date;
    updated.updated_at = new Date().toISOString();
    await promisify(store.put(updated));
  } else {
    await promisify(store.add({
      tmdb_id: tmdbId,
      media_type: mediaType,
      is_watched: data.is_watched ? 1 : 0,
      is_watchlist: data.is_watchlist ? 1 : 0,
      is_favorite: data.is_favorite ? 1 : 0,
      user_rating: data.user_rating ?? null,
      review_text: data.review_text ?? null,
      watch_date: data.watch_date ?? null,
      updated_at: new Date().toISOString(),
    }));
  }
}

export async function addSearchHistory(keyword: string) {
  const d = await openDb();
  const tx = d.transaction("search_history", "readwrite");
  const store = tx.objectStore("search_history");
  const all = await promisify(store.getAll());
  const existing = all.find((h: any) => h.keyword === keyword);
  if (existing) await promisify(store.delete(existing.id));
  await promisify(store.add({ keyword, searched_at: new Date().toISOString() }));
  // Keep only last 10
  const sorted = all.filter((h: any) => h.keyword !== keyword).sort((a: any, b: any) => new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime());
  for (const h of sorted.slice(9)) {
    await promisify(store.delete(h.id));
  }
}

export async function getSearchHistory(): Promise<any[]> {
  const d = await openDb();
  const tx = d.transaction("search_history", "readonly");
  const all = await promisify(tx.objectStore("search_history").getAll());
  return all.sort((a: any, b: any) => new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime()).slice(0, 5);
}

export async function clearSearchHistory() {
  const d = await openDb();
  const tx = d.transaction("search_history", "readwrite");
  await promisify(tx.objectStore("search_history").clear());
}

export async function getStats() {
  const marks = await getAllMarkings();
  const watched = marks.filter((m) => m.is_watched).length;
  const watchlist = marks.filter((m) => m.is_watchlist).length;
  const favorite = marks.filter((m) => m.is_favorite).length;
  const ratings = marks.filter((m) => m.user_rating != null).map((m) => m.user_rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return { watched, watchlist, favorite, avgRating };
}
