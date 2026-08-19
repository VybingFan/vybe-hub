const CACHE_NAME = "vybe-v24-45e-r5";
const OFFLINE_URL = "/offline.html";
const OFFLINE_PLAY_URL = "/experience/play";
const SAFE_STATIC_PREFIXES = ["/assets/", "/branding/", "/pwa/"];
const OFFLINE_PLAY_PATHS = ["/play", "/experience/play"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll([
          OFFLINE_URL,
          "/pwa/icon-192-v24-38.png",
          "/pwa/icon-512-v24-38.png",
          "/pwa/icon-maskable-512-v24-38.png",
          "/back-office.webmanifest",
          "/pwa/back-office/icon-192.png",
          "/pwa/back-office/icon-512.png",
          "/pwa/back-office/icon-maskable-512.png",
        ]),
      ),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "BACK_OFFICE_NOTIFY" && event.data.notification) {
    const payload = event.data.notification;
    event.waitUntil(
      self.registration.showNotification(payload.title || "VYBE Back Office", payload.options || {}),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin/work-queue";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) return client.navigate(targetUrl);
          return client;
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(async () => {
        try {
          const response = await fetch(OFFLINE_PLAY_URL);
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(OFFLINE_PLAY_URL, response);
          }
        } catch {
          // The public Play page will be cached the next time it is visited online.
        }
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.pathname === OFFLINE_PLAY_URL) {
            const cacheCopy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(OFFLINE_PLAY_URL, cacheCopy)),
            );
          }
          return response;
        })
        .catch(async () => {
          if (OFFLINE_PLAY_PATHS.includes(url.pathname)) {
            const cachedPlay = await caches.match(OFFLINE_PLAY_URL);
            if (cachedPlay) return cachedPlay;
          }
          return caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  if (!SAFE_STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;

  if (url.pathname.startsWith("/pwa/") || url.pathname === "/favicon.ico" || (url.pathname === "/manifest.webmanifest" || url.pathname === "/back-office.webmanifest")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cacheCopy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy)),
            );
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const cacheCopy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy)),
            );
          }
          return response;
        }),
    ),
  );
});
