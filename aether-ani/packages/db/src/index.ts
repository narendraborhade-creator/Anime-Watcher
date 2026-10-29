export interface AnimeProviderMapRecord {
  anilistId: number;
  malId: number | null;
  romajiTitle: string;
  englishTitle: string | null;
  primarySlug: string;
  secondaryShowId: string | null;
  accentColorHex: string;
}

/**
 * In-memory SWR fallback store when PostgreSQL is not yet provisioned in local dev
 */
export class InMemoryMetadataStore {
  private readonly mappings = new Map<number, AnimeProviderMapRecord>();

  public getMapping(anilistId: number): AnimeProviderMapRecord | undefined {
    return this.mappings.get(anilistId);
  }

  public saveMapping(record: AnimeProviderMapRecord): void {
    this.mappings.set(record.anilistId, record);
  }
}
