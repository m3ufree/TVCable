"use strict";

(function () {
    const LS_PLAYLIST = "iptv.playlistUrl";
    const LS_FAVS = "iptv.favs";
    const DEFAULT_PLAYLIST = "https://raw.githubusercontent.com/m3ufree/TVCable/main/all.m3u";

    const video = document.getElementById("video");
    const channelListEl = document.getElementById("channel-list");
    const groupListEl = document.getElementById("group-list");
    const searchEl = document.getElementById("search");
    const statusEl = document.getElementById("status");
    const playlistUrlEl = document.getElementById("playlist-url");
    const playlistFileEl = document.getElementById("playlist-file");
    const nowPlayingEl = document.getElementById("now-playing");
    const npName = document.getElementById("np-name");
    const npGroup = document.getElementById("np-group");
    const logoEl = document.getElementById("logo");
    const btnFav = document.getElementById("btn-fav");
    const btnFullscreen = document.getElementById("btn-fullscreen");
    const btnPip = document.getElementById("btn-pip");
    const tabs = document.querySelectorAll(".tab");

    let channels = [];
    let currentUrl = null;
    let hls = null;
    let activeTab = "all";
    let activeGroup = null;
    let query = "";
    let favs = [];

    try { favs = JSON.parse(localStorage.getItem(LS_FAVS) || "[]"); } catch (e) { favs = []; }

    const saveFavs = () => localStorage.setItem(LS_FAVS, JSON.stringify(favs));
    const isFav = (url) => favs.includes(url);

    function setStatus(text) { statusEl.textContent = text; }

    /* ---------- M3U parsing ---------- */

    function parseM3U(text) {
        const lines = text.split(/\r?\n/);
        const out = [];
        let pending = null;

        for (let raw of lines) {
            const line = raw.trim();
            if (!line) continue;

            if (line.toUpperCase().startsWith("#EXTINF")) {
                const attrs = {};
                const re = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
                let m;
                while ((m = re.exec(line)) !== null) attrs[m[1].toLowerCase()] = m[2];
                const cleaned = line.replace(/[a-zA-Z0-9_-]+="[^"]*"/g, "");
                const name = cleaned.slice(cleaned.indexOf(",") + 1).trim();
                pending = {
                    name: attrs["tvg-name"] || name || "Без названия",
                    url: null,
                    logo: attrs["tvg-logo"] || "",
                    group: attrs["group-title"] || attrs["tvg-group"] || "Другое",
                };
            } else if (line.startsWith("#")) {
                continue;
            } else if (pending) {
                pending.url = line;
                out.push(pending);
                pending = null;
            }
        }
        return out;
    }

    function loadPlaylistText(text, sourceUrl) {
        channels = parseM3U(text);
        if (!channels.length) { setStatus("Плейлист пуст или некорректен"); return; }
        if (sourceUrl) localStorage.setItem(LS_PLAYLIST, sourceUrl);
        channels.forEach((c, i) => { c.id = i; });
        buildGroupTags();
        render();
        setStatus(`Каналов: ${channels.length}`);
    }

    function loadPlaylistUrl(url) {
        if (!url) return;
        setStatus("Загрузка плейлиста...");
        fetch(url)
            .then((r) => {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.text();
            })
            .then((text) => { playlistUrlEl.value = url; loadPlaylistText(text, url); })
            .catch(() => {
                proxiesNext(url);
            });
    }

    function proxiesNext(url) {
        const cors = [
            url,
            "https://corsproxy.io/?" + encodeURIComponent(url),
            "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
        ];
        let i = 0;

        const attempt = () => {
            if (i >= cors.length) { setStatus("Не удалось загрузить плейлист"); return; }
            fetch(cors[i++])
                .then((r) => { if (!r.ok) throw new Error(); return r.text(); })
                .then((t) => { loadPlaylistText(t, url); })
                .catch(attempt);
        };
        attempt();
    }

    /* ---------- Rendering ---------- */

    function buildGroupTags() {
        const groups = [...new Set(channels.map((c) => c.group))].sort((a, b) => a.localeCompare(b, "ru"));
        groupListEl.innerHTML = "";
        const mk = (label, key) => {
            const el = document.createElement("span");
            el.className = "group-tag";
            el.textContent = label;
            el.onclick = () => {
                activeGroup = key;
                groupListEl.querySelectorAll(".group-tag").forEach((t) => t.classList.remove("active"));
                if (key !== null) el.classList.add("active");
                render();
            };
            return el;
        };
        groupListEl.appendChild(mk(`Все группы`, null));
        groups.forEach((g) => groupListEl.appendChild(mk(g, g)));
    }

    function visibleChannels() {
        return channels.filter((c) => {
            if (activeTab === "fav" && !isFav(c.url)) return false;
            if (activeGroup && c.group !== activeGroup) return false;
            if (query && !c.name.toLowerCase().includes(query)) return false;
            return true;
        });
    }

    function render() {
        channelListEl.innerHTML = "";
        const vis = visibleChannels();
        if (!vis.length) {
            const li = document.createElement("li");
            li.textContent = activeTab === "fav" ? "Нет избранного" : "Ничего не найдено";
            li.style.color = "var(--muted)";
            li.style.cursor = "default";
            channelListEl.appendChild(li);
            return;
        }

        const frag = document.createDocumentFragment();
        vis.forEach((ch, idx) => {
            const li = document.createElement("li");
            li.dataset.id = ch.id;

            if (ch.logo) {
                const img = document.createElement("img");
                img.loading = "lazy";
                img.onerror = () => img.replaceWith(noLogo(ch));
                img.src = ch.logo;
                li.appendChild(img);
            } else {
                li.appendChild(noLogo(ch));
            }

            const name = document.createElement("span");
            name.textContent = ch.name;
            name.style.overflow = "hidden";
            name.style.textOverflow = "ellipsis";
            li.appendChild(name);

            if (isFav(ch.url)) {
                const star = document.createElement("span");
                star.className = "fav-star";
                star.textContent = "★";
                li.appendChild(star);
            }

            if (currentUrl && ch.url === currentUrl) li.classList.add("active");

            li.addEventListener("click", (e) => {
                if (e.altKey) { toggleFav(ch); render(); updateNowPlaying(); return; }
                play(ch);
            });
            li.addEventListener("contextmenu", (e) => { e.preventDefault(); toggleFav(ch); render(); updateNowPlaying(); });
            frag.appendChild(li);
        });
        channelListEl.appendChild(frag);
    }

    function noLogo(ch) {
        const d = document.createElement("div");
        d.className = "no-logo";
        d.textContent = ch.name.charAt(0).toUpperCase();
        return d;
    }

    /* ---------- Playback ---------- */

    function play(ch) {
        currentUrl = ch.url;
        destroyHls();
        setStatus("");

        if (hlsSupported(ch.url)) {
            hls = new Hls({ manifestLoadingTimeOut: 10000 });
            hls.loadSource(ch.url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {
                    video.muted = true;
                    video.play().catch(() => setStatus("Нажмите ▶ в плеере"));
                });
            });
            hls.on(Hls.Events.ERROR, (e, data) => {
                if (data.fatal) setStatus("Ошибка потока: " + data.details);
            });
        } else {
            video.src = ch.url;
            video.play().catch(() => setStatus("Нажмите ▶ в плеере"));
        }

        channelListEl.querySelectorAll("li").forEach((li) =>
            li.classList.toggle("active", Number(li.dataset.id) === ch.id)
        );
        updateNowPlaying();
    }

    function hlsSupported(url) {
        return /\.m3u8(\?|$)/i.test(url) && (video.canPlayType("application/vnd.apple.mpegurl") || window.Hls && Hls.isSupported());
    }

    function destroyHls() {
        if (hls) { hls.destroy(); hls = null; video.removeAttribute("src"); video.load(); }
        else { video.src = ""; video.load(); }
    }

    function updateNowPlaying() {
        const ch = channels.find((c) => c.url === currentUrl);
        if (!ch) { nowPlayingEl.classList.add("hidden"); return; }
        nowPlayingEl.classList.remove("hidden");
        npName.textContent = ch.name;
        npGroup.textContent = ch.group;
        if (ch.logo) { logoEl.hidden = false; logoEl.src = ch.logo; } else { logoEl.hidden = true; }
        btnFav.classList.toggle("on", isFav(ch.url));
    }

    /* ---------- Favorites ---------- */

    function toggleFav(ch) {
        favs = isFav(ch.url) ? favs.filter((u) => u !== ch.url) : favs.concat(ch.url);
        saveFavs();
    }

    /* ---------- Events ---------- */

    document.getElementById("btn-load-url").onclick = () => {
        const url = playlistUrlEl.value.trim();
        if (url) loadPlaylistUrl(url);
    };

    playlistFileEl.addEventListener("change", () => {
        const f = playlistFileEl.files[0];
        if (!f) return;
        const fr = new FileReader();
        fr.onload = () => loadPlaylistText(fr.result, null);
        fr.readAsText(f);
    });

    searchEl.addEventListener("input", () => { query = searchEl.value.trim().toLowerCase(); render(); });
    tabs.forEach((t) =>
        t.addEventListener("click", () => {
            tabs.forEach((x) => x.classList.remove("active"));
            t.classList.add("active");
            activeTab = t.dataset.tab;
            render();
        })
    );

    btnFav.onclick = () => {
        const ch = channels.find((c) => c.url === currentUrl);
        if (ch) { toggleFav(ch); render(); updateNowPlaying(); }
    };

    btnFullscreen.onclick = () => {
        const area = document.getElementById("player-area");
        if (document.fullscreenElement) document.exitFullscreen();
        else area.requestFullscreen().catch(() => {});
    };

    if (document.pictureInPictureEnabled) {
        btnPip.onclick = async () => {
            try {
                if (document.pictureInPictureElement) await document.exitPictureInPicture();
                else await video.requestPictureInPicture();
            } catch (e) {}
        };
    } else { btnPip.hidden = true; }

    document.addEventListener("keydown", (e) => {
        if (e.target.matches("input")) return;
        const vis = visibleChannels();
        const cur = vis.findIndex((c) => c.url === currentUrl);

        if (e.code === "ArrowDown") {
            e.preventDefault();
            const next = vis[Math.min((cur < 0 ? -1 : cur) + 1, vis.length - 1)];
            if (next) play(next);
        } else if (e.code === "ArrowUp") {
            e.preventDefault();
            const prev = vis[Math.max((cur < 0 ? vis.length : cur) - 1, 0)];
            if (prev) play(prev);
        } else if (e.key === "f") {
            btnFullscreen.click();
        } else if (e.key === "m") {
            video.muted = !video.muted;
        } else if (/^[0-9]$/.test(e.key)) {
            const idx = (Number(e.key) + 9) % 10;
            if (vis[idx]) play(vis[idx]);
        }
    });

    /* ---------- PWA ---------- */

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        navigator.serviceWorker.register("sw.js").catch(() => {});
    }

    /* ---------- Init ---------- */

    const saved = localStorage.getItem(LS_PLAYLIST) || DEFAULT_PLAYLIST;
    playlistUrlEl.value = saved === DEFAULT_PLAYLIST ? "" : saved;
    loadPlaylistUrl(saved);
})();
