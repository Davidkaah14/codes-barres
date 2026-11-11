/* Service worker : garde l'application et la base de données sur l'appareil (utilisable hors ligne). */
const CACHE = "codes-barres-v2";
const COQUILLE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;   // prix en ligne : réseau direct
  const page = u.pathname.endsWith("/") || /\/(index\.html|sw\.js|manifest\.webmanifest)$/.test(u.pathname);
  const garder = res => { if (res.ok) { const copie = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); } return res; };
  if (page) {
    // l'application elle-même : réseau d'abord (les mises à jour arrivent seules), copie locale hors ligne
    e.respondWith(fetch(e.request).then(garder).catch(() => caches.match(e.request)));
  } else {
    // la base de données et les icônes : copie locale d'abord (rapide, hors ligne)
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(garder)));
  }
});
