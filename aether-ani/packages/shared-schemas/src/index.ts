import { z } from 'zod';

export * from './cli-parser';
export * from './hmac-token';

/**
 * Validated schema for audio tracks inside multi-rendition HLS manifests
 * Reference: pystardust/ani-cli PR #1967 (play separate HLS audio tracks)
 */
export const HlsAudioTrackSchema = z.object({
  id: z.string(),
  lang: z.string(),
  label: z.string(),
  uri: z.string().url(),
  isDefault: z.boolean().default(false),
});

export const SubtitleTrackSchema = z.object({
  lang: z.string(),
  label: z.string(),
  url: z.string().url(),
  format: z.enum(['vtt', 'ass']),
});

export const SkipWindowSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().positive(),
  intervalType: z.enum(['op', 'ed', 'mixed-op', 'mixed-ed', 'recap']),
});

/**
 * Validated schema for resolved episode playback sources
 */
export const StreamSourceSchema = z.object({
  provider: z.string(),
  quality: z.enum(['1080p', '720p', '480p', '360p', 'auto']),
  proxiedManifestUrl: z.string().url(),
  directStreamType: z.enum(['hls', 'mp4']),
  mode: z.enum(['sub', 'dub']),
  bitrateKbps: z.number().int().positive().default(8400),
  audioTracks: z.array(HlsAudioTrackSchema).default([]),
  subtitles: z.array(SubtitleTrackSchema).default([]),
  skipWindows: z.array(SkipWindowSchema).default([]),
  headersRequired: z.object({
    Referer: z.string(),
    Origin: z.string(),
    'User-Agent': z.string(),
  }),
});

export type StreamSource = z.infer<typeof StreamSourceSchema>;

export const AnimeMetadataSchema = z.object({
  anilistId: z.number().int().positive(),
  malId: z.number().int().positive().nullable().optional(),
  title: z.object({
    romaji: z.string(),
    english: z.string().nullable().optional(),
    native: z.string().nullable().optional(),
  }),
  synopsis: z.string(),
  coverImage: z.string(),
  bannerImage: z.string().nullable().optional(),
  accentColorHex: z.string().default('#00F0FF'),
  seasonYear: z.number().int().optional(),
  format: z.string().default('TV'),
  status: z.string().default('RELEASING'),
  episodesTotal: z.number().int().positive().default(12),
  averageScore: z.number().min(0).max(100).default(85),
  genres: z.array(z.string()).default([]),
  studio: z.string().default('Anime Studio'),
  sourceApi: z.enum(['anilist', 'kitsu', 'ghibli', 'jikan']).default('anilist'),
});

export type AnimeMetadata = z.infer<typeof AnimeMetadataSchema>;

/**
 * Public APIs (public-apis/public-apis#anime) - Kitsu Integration Schema
 */
export const KitsuAnimeSchema = z.object({
  id: z.string(),
  canonicalTitle: z.string(),
  synopsis: z.string(),
  averageRating: z.string().nullable().optional(),
  episodeCount: z.number().nullable().optional(),
  posterImage: z.string(),
  coverImage: z.string().nullable().optional(),
});

export type KitsuAnime = z.infer<typeof KitsuAnimeSchema>;

/**
 * Public APIs (public-apis/public-apis#anime) - Studio Ghibli Films Schema
 */
export const GhibliFilmSchema = z.object({
  id: z.string(),
  title: z.string(),
  originalTitle: z.string(),
  director: z.string(),
  releaseDate: z.string(),
  rtScore: z.string(),
  image: z.string(),
  bannerImage: z.string().nullable().optional(),
  description: z.string(),
});

export type GhibliFilm = z.infer<typeof GhibliFilmSchema>;

/**
 * Public APIs (public-apis/public-apis#anime) - Trace.moe Optical Scene Search
 */
export const TraceMoeResultSchema = z.object({
  anilistId: z.number(),
  filename: z.string(),
  episode: z.number().nullable().optional(),
  fromSeconds: z.number(),
  toSeconds: z.number(),
  similarity: z.number(),
  videoPreviewUrl: z.string().url(),
  imagePreviewUrl: z.string().url(),
});

export type TraceMoeResult = z.infer<typeof TraceMoeResultSchema>;
