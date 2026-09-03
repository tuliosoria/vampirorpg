export interface DefaultWikiEntry {
  section: string;
  title: string;
  body: string;
  order: number;
  imageUrl?: string;
  imageUrls?: string[];
}

/**
 * Canonical player-facing public encyclopedia of a Cidade. Generated from the
 * public V2 encyclopedia and atlas documents. Mechanical power profiles,
 * attribute tables and GM-only material are intentionally excluded.
 */
export const DEFAULT_WIKI_ENTRIES: DefaultWikiEntry[] = [];
