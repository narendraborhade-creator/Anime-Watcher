import { StreamSource, StreamSourceSchema } from '@aether-ani/shared-schemas';
import { z } from 'zod';
import { IStreamProvider } from './provider.interface.js';

/**
 * Multi-Provider Stream Orchestrator with L2 Caching and XOR Cipher Utilities.
 * Port of pystardust/ani-cli's asynchronous provider aggregation & decrypt_allanime().
 */
export class StreamOrchestrator {
  private readonly memoryCache = new Map<string, { expiresAt: number; data: StreamSource[] }>();

  constructor(private readonly providers: IStreamProvider[]) {}

  /**
   * Pure TypeScript port of ani-cli's byte-wise hex XOR decoder (`decrypt_allanime`).
   * Supports runtime key overrides so key rotations (Issue #1899) require zero code redeploys.
   */
  public static decryptHexXor(encodedHex: string, xorKey = 0x38): string {
    const clean = encodedHex.startsWith('--') ? encodedHex.slice(2) : encodedHex;
    const bytes = Buffer.alloc(Math.floor(clean.length / 2));
    for (let i = 0; i < clean.length; i += 2) {
      const parsed = parseInt(clean.substring(i, i + 2), 16);
      bytes[i / 2] = Number.isNaN(parsed) ? 0 : parsed ^ xorKey;
    }
    return bytes.toString('utf-8');
  }

  public async resolveEpisodeWithFailover(
    anilistId: number,
    providerSlug: string,
    episodeNumber: number,
    mode: 'sub' | 'dub'
  ): Promise<StreamSource[]> {
    const cacheKey = `aether:stream:v5:${anilistId}:${episodeNumber}:${mode}`;
    const cached = this.memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const errors: Error[] = [];
    for (const provider of this.providers) {
      if (await provider.isCircuitOpen()) {
        continue;
      }
      try {
        const rawStreams = await provider.resolveEpisodeStreams(providerSlug, episodeNumber, mode);
        const validated = z.array(StreamSourceSchema).parse(rawStreams);
        if (validated.length > 0) {
          await provider.recordSuccess();
          this.memoryCache.set(cacheKey, {
            expiresAt: Date.now() + 45 * 60 * 1000, // 45-minute L2 cache TTL
            data: validated,
          });
          return validated;
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        await provider.recordFailure(errorObj);
        errors.push(errorObj);
      }
    }

    throw new AggregateError(
      errors,
      `All stream providers exhausted for AniList ID ${anilistId}, Episode ${episodeNumber} (${mode})`
    );
  }
}
