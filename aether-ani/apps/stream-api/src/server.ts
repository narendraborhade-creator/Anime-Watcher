import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { parseAniCliSyntax } from '@aether-ani/shared-schemas';
import { OpenHlsStreamProvider } from './providers/open-hls.provider.js';
import { StreamOrchestrator } from './providers/orchestrator.js';
import { FederatedMetadataMesh } from './matcher/metadata-mesh.js';
import { WatchPartyCoordinator } from './sync-server/watch-party.js';

const PORT = Number(process.env.PORT ?? 4000);
const EDGE_PROXY_URL = process.env.EDGE_PROXY_URL ?? 'http://localhost:8787';
const HMAC_SECRET = process.env.HMAC_SECRET ?? 'aether-ani-super-secret-hmac-key-2026';

async function bootstrap() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  const openHlsProvider = new OpenHlsStreamProvider(EDGE_PROXY_URL, HMAC_SECRET);
  const orchestrator = new StreamOrchestrator([openHlsProvider]);
  const metadataMesh = new FederatedMetadataMesh();

  // Health & Canary Readiness Endpoint
  app.get('/api/v1/health', async () => ({
    status: 'ok',
    service: 'aether-ani-stream-api',
    upstreamParity: 'public-apis/public-apis#anime mesh (AniList + Kitsu + Ghibli + Trace.moe + AniSkip)',
    timestamp: new Date().toISOString(),
  }));

  // 1. Federated Trending Catalog (AniList v2 GraphQL)
  app.get('/api/v1/catalog/trending', async () => {
    const items = await metadataMesh.fetchTrendingCatalog();
    return { count: items.length, source: 'anilist', items };
  });

  // 2. Kitsu Anime Catalog (public-apis/public-apis#anime)
  app.get('/api/v1/catalog/kitsu', async () => {
    const items = await metadataMesh.fetchKitsuCatalog();
    return { count: items.length, source: 'kitsu', items };
  });

  // 3. Studio Ghibli Film Vault (public-apis/public-apis#anime)
  app.get('/api/v1/catalog/ghibli', async () => {
    const items = await metadataMesh.fetchGhibliCatalog();
    return { count: items.length, source: 'ghibli', items };
  });

  // 4. Federated Cross-Mesh Search (AniList + Kitsu)
  app.get<{ Querystring: { q?: string } }>('/api/v1/catalog/search', async (req) => {
    const query = req.query.q ?? '';
    if (!query.trim()) {
      const items = await metadataMesh.fetchTrendingCatalog();
      return { count: items.length, query: '', items };
    }
    const items = await metadataMesh.searchMesh(query);
    return { count: items.length, query, items };
  });

  // 5. Trace.moe Optical Scene Recognition Search
  app.post<{ Body: { imageUrl?: string; imageBase64?: string } }>('/api/v1/scene/trace', async (req) => {
    const input = req.body?.imageBase64 || req.body?.imageUrl || '';
    if (!input) {
      return { count: 0, results: [] };
    }
    const results = await metadataMesh.searchSceneWithTraceMoe(input);
    return { count: results.length, results };
  });

  // 6. AniSkip OP/ED Skip Timestamps Endpoint
  app.get<{ Params: { malId: string; episode: string } }>('/api/v1/skip/:malId/:episode', async (req) => {
    const malId = parseInt(req.params.malId, 10) || 0;
    const ep = parseInt(req.params.episode, 10) || 1;
    const skipWindows = await metadataMesh.fetchAniSkipTimestamps(malId, ep);
    return { malId, episode: ep, skipWindows };
  });

  // 7. Parse raw ani-cli syntax from Cmd+K Omni-Bar
  app.post<{ Body: { command: string } }>('/api/v1/cli/parse', async (req) => {
    const parsed = parseAniCliSyntax(req.body?.command ?? '');
    return { parsed };
  });

  // 3. Resolve Episode Streams (Replaces episodes_list + provider_init + get_links)
  app.get<{
    Params: { anilistId: string; episode: string };
    Querystring: { mode?: 'sub' | 'dub'; slug?: string };
  }>('/api/v1/stream/resolve/:anilistId/:episode', async (req) => {
    const anilistId = parseInt(req.params.anilistId, 10) || 1;
    const episode = parseInt(req.params.episode, 10) || 1;
    const mode = req.query.mode === 'dub' ? 'dub' : 'sub';
    const slug = req.query.slug ?? 'chrono-samurai-2099';

    const sources = await orchestrator.resolveEpisodeWithFailover(anilistId, slug, episode, mode);
    return { anilistId, episode, mode, sources };
  });

  // 4. Proactive Episode N+1 Pre-Warming Endpoint (Triggered at 80% progress)
  app.post<{
    Body: { anilistId: number; nextEpisode: number; mode: 'sub' | 'dub'; slug: string };
  }>('/api/v1/stream/prewarm', async (req) => {
    const { anilistId, nextEpisode, mode, slug } = req.body;
    await orchestrator.resolveEpisodeWithFailover(anilistId, slug, nextEpisode, mode);
    return { prewarmed: true, anilistId, nextEpisode, mode };
  });

  await app.listen({ port: PORT, host: '0.0.0.0' });

  const io = new SocketIOServer(app.server, {
    cors: { origin: '*' },
  });
  new WatchPartyCoordinator(io);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
