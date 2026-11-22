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

## How to Use

1. **Clone the Repository**
   ```sh
   git clone https://github.com/m3ufree/TVCable
