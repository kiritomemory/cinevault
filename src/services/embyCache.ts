const DB_NAME = 'CineVaultEmbyCache';
const DB_VERSION = 1;
const CACHE_TTL = 5 * 60 * 1000;
let db: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const d = (e.target as IDBOpenDBRequest).result;
      if (!d.objectStoreNames.contains('emby_series'))
        d.createObjectStore('emby_series', { keyPath: 'tmdbId' });
      if (!d.objectStoreNames.contains('emby_stats'))
        d.createObjectStore('emby_stats', { keyPath: 'id' });
    };
  });
}

function storeAction<T>(name: string, mode: IDBTransactionMode, cb: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const d = await openDb();
    const req = cb(d.transaction(name, mode).objectStore(name));
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function cacheSeries(series: any): Promise<void> {
  await storeAction('emby_series', 'readwrite', s => s.put({ ...series, cachedAt: new Date().toISOString() }));
}
export async function getAllCachedSeries(): Promise<any[]> {
  return storeAction<any[]>('emby_series', 'readonly', s => s.getAll());
}
export async function getCachedSeries(tmdbId: number): Promise<any | null> {
  const item = await storeAction<any>('emby_series', 'readonly', s => s.get(tmdbId));
  if (!item) return null;
  if (Date.now() - new Date(item.cachedAt).getTime() > CACHE_TTL) return null;
  return item;
}
export async function clearCache(): Promise<void> {
  await storeAction<any>('emby_series', 'readwrite', s => s.clear());
  await storeAction<any>('emby_stats', 'readwrite', s => s.clear());
}
