"use strict";

const CACHE = "tvcable-player-v1";
const CORE = ["index.html", "styles.css", "app.js", "manifest.json"];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (e) => {
    const url = new URL(e.request.url);
    if (e.request.method !== "GET") return;

    if (url.origin === self.location.origin) {
        e.respondWith(
            caches.match(e.request).then((hit) =>
                hit || fetch(e.request).then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put(e.request, copy));
                    return res;
                })
            )
        );
        return;
    }

    if (/\.(m3u8|ts|mp4|m3u)(\?|$)/i.test(url.pathname)) return;

    e.respondWith(
        fetch(e.request)
            .then((res) => {
                if (res.ok && res.type === "cors") {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put(e.request, copy));
                }
                return res;
            })
            .catch(() => caches.match(e.request))
    );
});
