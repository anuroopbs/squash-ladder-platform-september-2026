// v3: network-first for page navigations and API/data calls so ladder
// rankings, challenges, and match history are NEVER served stale from
// cache. Only static assets (JS/CSS/icons) are cache-first. Previously
// EVERY GET request (including the dynamic club page HTML and Supabase
// data calls) was cached with no invalidation, so a phone could show a
// stale ranking snapshot from before a player joined or a match was
// reported -- "numbers missing/wrong" on repeat visits.
const CACHE_NAME = "ladder-v3";
const STATIC_CACHE = "ladder-static-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  event.waitUntil(clients.claim());
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Never cache Supabase API calls or cross-origin requests -- always hit
  // the network so player/rank/challenge data is always fresh.
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    // Static build assets are content-hashed by Next.js, safe to cache-first.
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else (page navigations, HTML) -- network-first, falling
  // back to a cached copy only when fully offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((c) => c || caches.match("/")))
  );
});
