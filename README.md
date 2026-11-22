# TVCable Playlists

## About TVCable

TVCable is a collection of M3U playlists designed for the Zuxre player.
These playlists provide access to various channels including federal,
educational, and premium series.

## Contents

- **all.m3u** - All channels in one playlist
- **federal.m3u** - Federal channels
- **znanie.m3u** - Knowledge and educational channels
- **premiumserials.m3u** - Premium series and movies

## Web Player

A lightweight web IPTV player lives in [player/](player/) — plain HTML/CSS/JS + [hls.js](https://github.com/video-dev/hls.js), no backend required.

Features:

- Load a playlist from URL or a local `.m3u` file
- Channel groups, search, logos, favorites (saved in `localStorage`)
- HLS playback, picture-in-picture, fullscreen
- Hotkeys: `↑`/`↓` — switch channels, `F` — fullscreen, `M` — mute, `0–9` — quick channel

Run it: open `player/index.html` in a browser, or serve the repo statically and enable GitHub Pages / any static hosting. By default it loads `all.m3u` from this repository.

It is also a **PWA** (manifest + offline service worker): once hosted over HTTPS, it can be installed from the browser — iOS/macOS via Safari «Поделиться → На экран «Домой»/Установить», Android/desktop via the install prompt.

## Desktop builds

Desktop wrappers live in [electron/](electron/) ([Electron](https://www.electronjs.org)):

```sh
cd electron
npm install
npm run sync-web
npx electron-builder --win            # Windows NSIS installer + portable
npx electron-builder --mac            # macOS tar.gz (x64 + arm64)
npx electron-builder --linux tar.gz   # Linux tar.gz
```

## Android

See [mobile/README.md](mobile/README.md) — Capacitor scaffold, one command to build an APK with Android Studio.

## How to Use

1. **Clone the Repository**
   ```sh
   git clone https://github.com/m3ufree/TVCable
