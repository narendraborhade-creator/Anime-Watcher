# Project AETHER-ANI: Futuristic Spatial Anime Streaming Platform

A production-grade, full-stack monorepo re-architecting the 5-stage pipeline of [pystardust/ani-cli](https://github.com/pystardust/ani-cli) (`search_anime`, `episodes_list`, `provider_init`, `generate_link`, `play_episode`) into a typed **Next.js + Fastify + Cloudflare Edge HLS Proxy + WebGL/WebGPU** web platform.

## Monorepo Folder Structure

```text
aether-ani/
├── package.json                    # Root Turborepo workspace configuration
├── turbo.json                      # Build, lint, and dev pipeline orchestration
├── docker-compose.yml              # Local PostgreSQL, Redis, Stream API, Web, & Sidecar stack
├── apps/
│   ├── web/                        # Next.js 16 App Router Frontend (Neo-Tokyo Spatial HUD)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── app/
│   │   │   ├── layout.tsx          # Global fonts, Chameleon CSS variables, Cmd+K provider
│   │   │   ├── globals.css         # Glassmorphic utilities & OLED dark tokens
│   │   │   ├── page.tsx            # 3D Hero Stage, Seasonal Bento Grid, & Live Telemetry
│   │   │   └── watch/[anilistId]/
│   │   │       └── page.tsx        # Cinema View, Episode Matrix, & Sync-Pod Watch Party
│   │   └── components/
│   │       ├── canvas/
│   │       │   └── SpatialHeroStage.tsx  # Three.js / WebGL 2.5D Depth Parallax Stage
│   │       ├── command/
│   │       │   └── NeuralOmniBar.tsx     # Cmd+K fzf-style CLI flag & fuzzy search bar
│   │       └── player/
│   │           ├── AmbilightPlayer.tsx   # HLS.js + Anime4K WebGL2 Shader + AniSkip Bar
│   │           └── SyncPodDrawer.tsx     # WebRTC / Socket.io Watch-Party Room Sync
│   ├── stream-api/                 # Fastify + TypeScript Stream Resolution Microservice
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── server.ts                 # Fastify API Gateway, CORS, Rate Limiting, Routes
│   │       ├── providers/
│   │       │   ├── provider.interface.ts # IStreamProvider & CircuitBreaker contracts
│   │       │   ├── orchestrator.ts       # Multi-provider failover, Redis L2 cache, XOR cipher
│   │       │   └── open-hls.provider.ts  # Legal Open-HLS & Configurable Provider Adapter
│   │       ├── matcher/
│   │       │   └── metadata-mesh.ts      # AniList GraphQL + Jikan REST v4 + AniSkip SWR Mesh
│   │       └── sync-server/
│   │           └── watch-party.ts        # Kalman-filtered clock-drift Watch-Party authority
│   └── edge-proxy/                 # Stateless Edge Worker HLS Manifest & Audio-Track Rewriter
│       ├── package.json
│       ├── wrangler.toml
│       └── src/
│           └── index.ts                  # Rewrites .m3u8, #EXT-X-MEDIA:TYPE=AUDIO, & segments
├── packages/
│   ├── shared-schemas/             # End-to-End Zod Contracts, CLI Parser, & HMAC Signer
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── cli-parser.ts             # Parses raw ani-cli syntax (-e, --dub, -q, --rofi)
│   │       └── hmac-token.ts             # Stateless SHA-256 HMAC URL signing for Edge Proxy
│   └── db/                         # Prisma + PostgreSQL Schema (ID Cross-Map & Watch History)
│       ├── package.json
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│           └── index.ts
└── docker/
    └── ani-cli-sidecar/            # Hardened Alpine container with curl-impersonate & ani-cli
        ├── Dockerfile
        └── healthcheck.sh
```

## Quick Start (Zero-Error Local Setup)

1. **Install Workspace Dependencies**:
   ```bash
   npm install
   ```
2. **Start Infrastructure (PostgreSQL + Redis + Stream API + Web)**:
   ```bash
   docker compose up -d postgres redis
   npm run dev
   ```
3. **Test CLI Command-Bar Syntax in the Browser (`Cmd/Ctrl + K`)**:
   - `watch cyberpunk -e 4 --dub -q 1080`
   - `watch valkyrie -e 1 -q 1080`
   - `continue` (resumes from persistent watch history)
