/* Service worker — caches the app shell; network first so data stays fresh. */
const CACHE = "mr-techlab-shell-v7";
const SHELL = [
  "./", "./index.html", "./apk.html", "./host.html", "./prompts.html", "./files.html",
  "./developer.html", "./downloads.html", "./profile.html", "./subscription.html",
  "./privacy.html", "./terms.html", "./about.html", "./contact.html",
  "./img/logo.png", "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin GET: network first, cache as offline fallback. Firebase and ads always use the network.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((hit) => hit || caches.match("./index.html"))
    )
  );
});
