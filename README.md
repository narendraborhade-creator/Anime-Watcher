# 🌌 Aether-Ani // Anime-Watcher (v1.0.0)

> **Next-Generation Neo-Tokyo Spatial Anime Streaming Platform & Federated Public APIs Mesh**  
> Powered by `ani-cli` Linux engine, AniList GraphQL, Kitsu, Studio Ghibli, Trace.moe, and AniSkip.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![UI](https://img.shields.io/badge/Interface-Spatial%20HUD-00F0FF)](http://localhost:3000)
[![Ad--Shield](https://img.shields.io/badge/Ad--Shield-Active-emerald)](#-ad-shield--clean-cinema-player)

---

## ✨ Key Features

### 🎬 Ad-Free Cinema Player & Multi-Server Relay
- **Parent Transport Deck**: Custom control bar with `[ ▶ PLAY / PAUSE ]`, `[ ↺ REPLAY (0:00) ]`, `[ ⏹ STOP ]`, and `[ ⏭ Skip Intro (85s) ]`. Control playback without touching ad overlays.
- **Anti-Redirect Defense Shield**: Intercepts frame-busting top-level redirects so your browser tab is never hijacked by third-party ad networks.
- **Multi-Server Streaming**:
  - **Server 1**: `ani-cli` Native Full Episode Stream (subbed/dubbed audio + synced subtitles).
  - **Server 2**: AniList Official HD Stream (official YouTube PVs & trailers).
  - **Server 3**: Animax Asia 1080p Live Broadcast Channel.
  - **Server 4**: Direct Cloud HLS Native Video Player (`.m3u8` with custom proxy).

### 🌐 Federated Public Anime APIs Mesh
- **AniList GraphQL API**: Dynamic search for any anime title, live resolution of MyAnimeList (MAL) IDs, official cover art, banner art, trailers, scores, and episode counts. Zero dummy pictures.
- **Kitsu REST API & Studio Ghibli API**: Rich multi-source seasonal catalog.
- **Trace.moe Neural Scene Recognition**: Upload any screenshot or paste an image URL to find the exact anime, episode, and timestamp.
- **AniSkip Open Database**: Automated opening (OP) and ending (ED) detection with skip buttons.

### 🐧 POSIX Linux Shell & `ani-cli` Integration
- Native in-browser terminal emulator connected to a local Node.js bridge.
- Run commands like `ani-cli "Haikyuu!!" -e 1`, `ani-cli "Solo Leveling" -e 1 --dub`, `sources`, `play <ep>`, and `ls`.

### ⚡ Command-K Neural Omni-Bar & Instant Search
- Press `Ctrl+K` to search across all public anime databases instantly.
- Live real-time catalog search bar on the dashboard for instant filtering.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- Optional: Git Bash or Linux shell for native `ani-cli` command scraping.

### Installation & Launch

```bash
# 1. Clone the repository
git clone https://github.com/narendraborhade-creator/Anime-Watcher.git
cd Anime-Watcher

# 2. Start the local server
npm start
# or: node serve.js
```

Open your browser at:
👉 **`http://localhost:3000/`**

---

## 📁 Project Architecture

```
Anime-Watcher/
├── index.html                 # Complete spatial web app, HUD & Cinema Player
├── aether_ani_neo_tokyo_...   # Spatial Monorepo Explorer file
├── serve.js                   # Node.js backend: ani-cli execution bridge & HLS proxy
├── package.json               # NPM scripts and project configuration
├── README.md                  # Project documentation & usage guide
├── LICENSE                    # MIT License
├── ani-cli/                   # Bundled ani-cli POSIX shell scraper
└── aether-ani/                # Fullstack workspace monorepo & packages
```

---

## 🛠️ API Endpoints

- **`GET /api/health`**: Server health and POSIX environment status.
- **`GET /api/anicli/run?q={title}&ep={episode}&mode={sub|dub}`**: Resolves real streams, MAL ID, HLS master URL, and subtitles.
- **`GET /api/proxy/hls?url={m3u8_url}&referer={url}`**: High-speed reverse proxy that rewrites HLS segments to bypass CORS restrictions.

---

## 📜 License

Licensed under the [MIT License](LICENSE).  
Copyright (c) 2026 **NARENDRA BORHADE**.
