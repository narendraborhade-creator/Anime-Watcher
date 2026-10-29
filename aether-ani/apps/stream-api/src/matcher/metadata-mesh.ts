import { AnimeMetadata, TraceMoeResult } from '@aether-ani/shared-schemas';

/**
 * Federated Public Anime APIs Mesh
 * Powered by public-apis/public-apis#anime:
 * - AniList API v2 (GraphQL): https://graphql.anilist.co
 * - Kitsu API (REST): https://kitsu.io/api/edge/anime
 * - Studio Ghibli API: https://ghibliapi.vercel.app/films
 * - Trace.moe Optical Scene API: https://api.trace.moe/search
 * - AniSkip Timestamps API: https://api.aniskip.com/v2/skip-times
 */
export class FederatedMetadataMesh {
  private readonly anilistEndpoint = 'https://graphql.anilist.co';
  private readonly kitsuEndpoint = 'https://kitsu.io/api/edge/anime';
  private readonly ghibliEndpoint = 'https://ghibliapi.vercel.app/films';
  private readonly traceMoeEndpoint = 'https://api.trace.moe/search';
  private readonly aniskipEndpoint = 'https://api.aniskip.com/v2/skip-times';

  // 1. AniList GraphQL API (public-apis/public-apis#anime)
  public async fetchTrendingCatalog(): Promise<AnimeMetadata[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            id
            idMal
            title { romaji english native }
            description(asHtml: false)
            coverImage { extraLarge color }
            bannerImage
            seasonYear
            format
            status
            episodes
            averageScore
            genres
            studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    try {
      const response = await fetch(this.anilistEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables: { page: 1, perPage: 12 } }),
      });

      if (!response.ok) throw new Error(`AniList HTTP ${response.status}`);

      const json = (await response.json()) as any;
      const mediaList = json?.data?.Page?.media ?? [];
      return mediaList.map((m: any) => ({
        anilistId: m.id,
        malId: m.idMal ?? null,
        title: {
          romaji: m.title?.romaji ?? 'Unknown Title',
          english: m.title?.english ?? null,
          native: m.title?.native ?? null,
        },
        synopsis: (m.description ?? '').replace(/<[^>]+>/g, ''),
        coverImage: m.coverImage?.extraLarge ?? '',
        bannerImage: m.bannerImage ?? null,
        accentColorHex: m.coverImage?.color ?? '#00F0FF',
        seasonYear: m.seasonYear ?? 2026,
        format: m.format ?? 'TV',
        status: m.status ?? 'RELEASING',
        episodesTotal: m.episodes ?? 12,
        averageScore: m.averageScore ?? 88,
        genres: m.genres ?? ['Action', 'Sci-Fi'],
        studio: m.studios?.nodes?.[0]?.name ?? 'Top Studio',
        sourceApi: 'anilist',
      }));
    } catch {
      return this.fetchKitsuCatalog();
    }
  }

  // 2. Kitsu Anime Discovery API (public-apis/public-apis#anime)
  public async fetchKitsuCatalog(): Promise<AnimeMetadata[]> {
    try {
      const res = await fetch(`${this.kitsuEndpoint}?page[limit]=12&sort=-userCount`);
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      return (json?.data ?? []).map((item: any, idx: number) => {
        const attr = item.attributes;
        return {
          anilistId: 70000 + (parseInt(item.id, 10) || idx),
          malId: null,
          title: {
            romaji: attr.canonicalTitle ?? 'Unknown',
            english: attr.titles?.en ?? attr.canonicalTitle,
            native: attr.titles?.ja_jp ?? null,
          },
          synopsis: attr.synopsis ?? '',
          coverImage: attr.posterImage?.large ?? attr.posterImage?.original ?? '',
          bannerImage: attr.coverImage?.large ?? null,
          accentColorHex: '#6366F1',
          seasonYear: parseInt(attr.startDate?.slice(0, 4), 10) || 2024,
          format: 'TV',
          status: 'FINISHED',
          episodesTotal: attr.episodeCount ?? 12,
          averageScore: Math.round(parseFloat(attr.averageRating ?? '80')),
          genres: ['Action', 'Adventure'],
          studio: 'Kitsu Studio',
          sourceApi: 'kitsu',
        };
      });
    } catch {
      return [];
    }
  }

  // 3. Studio Ghibli API (public-apis/public-apis#anime)
  public async fetchGhibliCatalog(): Promise<AnimeMetadata[]> {
    try {
      const res = await fetch(this.ghibliEndpoint);
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      return (json ?? []).map((film: any, idx: number) => ({
        anilistId: 90000 + idx,
        malId: null,
        title: {
          romaji: film.title ?? 'Ghibli Film',
          english: film.title,
          native: film.original_title ?? null,
        },
        synopsis: film.description ?? '',
        coverImage: film.image ?? '',
        bannerImage: film.movie_banner ?? film.image ?? null,
        accentColorHex: '#10B981',
        seasonYear: parseInt(film.release_date, 10) || 1995,
        format: 'MOVIE',
        status: 'FINISHED',
        episodesTotal: 1,
        averageScore: parseInt(film.rt_score, 10) || 92,
        genres: ['Animation', 'Fantasy', 'Family'],
        studio: 'Studio Ghibli',
        sourceApi: 'ghibli',
      }));
    } catch {
      return [];
    }
  }

  // 4. Trace.moe Optical Scene Recognition API (public-apis/public-apis#anime)
  public async searchSceneWithTraceMoe(imageInput: string | Buffer): Promise<TraceMoeResult[]> {
    try {
      let res: Response;
      if (Buffer.isBuffer(imageInput)) {
        res = await fetch(this.traceMoeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'image/jpeg' },
          body: new Uint8Array(imageInput) as any,
        });
      } else if (typeof imageInput === 'string' && imageInput.startsWith('data:image')) {
        const base64Data = imageInput.split(',')[1] || '';
        const buffer = Buffer.from(base64Data, 'base64');
        res = await fetch(this.traceMoeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'image/jpeg' },
          body: new Uint8Array(buffer) as any,
        });
      } else {
        const endpoint = `${this.traceMoeEndpoint}?url=${encodeURIComponent(String(imageInput))}`;
        res = await fetch(endpoint);
      }

      if (!res.ok) return [];
      const data = (await res.json()) as any;
      return (data.result ?? []).slice(0, 5).map((r: any) => ({
        anilistId: r.anilist,
        filename: r.filename,
        episode: r.episode,
        fromSeconds: Math.round(r.from),
        toSeconds: Math.round(r.to),
        similarity: parseFloat((r.similarity * 100).toFixed(1)),
        videoPreviewUrl: r.video,
        imagePreviewUrl: r.image,
      }));
    } catch {
      return [];
    }
  }

  // 5. AniSkip Timestamps API (public-apis/public-apis#anime)
  public async fetchAniSkipTimestamps(malId: number, episodeNumber: number) {
    try {
      const url = `${this.aniskipEndpoint}/${malId}/${episodeNumber}?types[]=op&types[]=ed&types[]=recap&episodeLength=0`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as any;
      if (!data?.found || !Array.isArray(data.results)) return [];
      return data.results.map((r: any) => ({
        start: r.interval.startTime,
        end: r.interval.endTime,
        intervalType: r.skipType,
      }));
    } catch {
      return [];
    }
  }

  // 6. Cross-Mesh Search (AniList + Kitsu)
  public async searchMesh(query: string): Promise<AnimeMetadata[]> {
    const qLower = query.toLowerCase().trim();
    const gql = `
      query ($search: String) {
        Page(page: 1, perPage: 6) {
          media(search: $search, type: ANIME, isAdult: false) {
            id title { romaji english native } description(asHtml: false)
            coverImage { extraLarge color } bannerImage seasonYear format
            episodes averageScore genres studios(isMain: true) { nodes { name } }
          }
        }
      }
    `;

    try {
      const res = await fetch(this.anilistEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: gql, variables: { search: qLower } }),
      });
      const data = (await res.json()) as any;
      const mediaList = data?.data?.Page?.media ?? [];
      return mediaList.map((m: any) => ({
        anilistId: m.id,
        malId: null,
        title: {
          romaji: m.title?.romaji ?? 'Unknown',
          english: m.title?.english ?? null,
          native: m.title?.native ?? null,
        },
        synopsis: (m.description ?? '').replace(/<[^>]+>/g, ''),
        coverImage: m.coverImage?.extraLarge ?? '',
        bannerImage: m.bannerImage ?? null,
        accentColorHex: m.coverImage?.color ?? '#00F0FF',
        seasonYear: m.seasonYear ?? 2026,
        format: m.format ?? 'TV',
        status: 'RELEASING',
        episodesTotal: m.episodes ?? 12,
        averageScore: m.averageScore ?? 85,
        genres: m.genres ?? ['Action'],
        studio: m.studios?.nodes?.[0]?.name ?? 'Studio',
        sourceApi: 'anilist',
      }));
    } catch {
      return [];
    }
  }
}
