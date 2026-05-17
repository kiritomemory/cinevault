// CineVault Service Worker
const CACHE_NAME = "cinevault-v6";
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, "");

// 安装：预缓存静态资源
self.addEventListener("install", (event) => {
  const STATIC_ASSETS = [
    BASE_PATH,
    BASE_PATH + "index.html",
  ];
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 请求拦截
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // TMDB API 请求：网络优先，失败后返回缓存
  if (url.hostname.includes("themoviedb.org") || url.hostname.includes("tmdb")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 图片请求（TMDB 图）：缓存优先
  if (url.hostname.includes("image.tmdb.org")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 静态资源（JS/CSS/HTML）：网络优先，失败后用缓存
  if (request.destination === "script" || request.destination === "style" || request.destination === "document") {
    event.respondWith(
      fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // 其他请求：网络优先
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
