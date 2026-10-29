import { StreamSource } from '@aether-ani/shared-schemas';

export interface ProviderSearchMatch {
  providerId: string;
  title: string;
  availableEpisodes: {
    sub: number[];
    dub: number[];
  };
}

/**
 * Strategy Pattern contract for stream resolution adapters.
 * Mirrors the 5 stages defined in pystardust/ani-cli/blob/master/hacking.md:
 *   1. search_anime()       -> searchCatalog()
 *   2. episodes_list()      -> fetchEpisodePool()
 *   3. provider_init()      -> extractEmbeds()
 *   4. generate_link()      -> resolveEpisodeStreams()
 */
export interface IStreamProvider {
  readonly name: string;
  isCircuitOpen(): Promise<boolean>;
  recordFailure(error: Error): Promise<void>;
  recordSuccess(): Promise<void>;
  searchCatalog(query: string, exactMatch?: boolean): Promise<ProviderSearchMatch[]>;
  fetchEpisodePool(providerId: string): Promise<{ sub: number[]; dub: number[] }>;
  resolveEpisodeStreams(
    providerId: string,
    episodeNumber: number,
    mode: 'sub' | 'dub'
  ): Promise<StreamSource[]>;
}
