import { newVisualEntity, type VisualStyleBible, type VisualEntity, type VisualAsset, type VisualEntityType, type CanonicalLevel } from "@vampiro/content";

export interface SeedItem {
  file: string;
  entityId: string;
  entityType: VisualEntityType;
  name: string;
  slug: string;
  assetType: VisualAsset["assetType"];
  canonicalLevel: CanonicalLevel;
  description: string;
}

/**
 * As imagens que a crônica traz de fábrica.
 *
 * Nasce vazia. Era o acervo do jogo de origem — retratos, cidades e povos de um
 * mundo que não é este —, e os arquivos nem vieram no fork: a semente apontava
 * para PNGs que não existem. Quem povoa o acervo é o Narrador, pelo Estúdio.
 */
export const SEED_ITEMS: SeedItem[] = [];


export interface SeedDeps {
  getActiveStyleBible: (campaignId: string) => Promise<VisualStyleBible | null>;
  putStyleBible: (campaignId: string, b: VisualStyleBible) => Promise<void>;
  getEntity: (campaignId: string, id: string) => Promise<VisualEntity | null>;
  putEntity: (campaignId: string, e: VisualEntity) => Promise<void>;
  putAsset: (campaignId: string, a: VisualAsset) => Promise<void>;
  loadSeedImage: (file: string) => Promise<Buffer>;
  uploadAsset: (assetId: string, original: Buffer) => Promise<{ key: string; url: string; thumbnailKey: string | null; thumbnailUrl: string | null }>;
  newId: () => string;
  now: () => string;
}

export interface SeedSummary { styleBibleCreated: boolean; entitiesCreated: number; assetsCreated: number }

export function buildStyleBibleV1(campaignId: string, now: string): VisualStyleBible {
  return {
    campaignId, version: 1, status: "ACTIVE",
    artMedium: "pintura digital cinematográfica",
    renderingStyle: "dark fantasy gótico medieval, muito detalhado",
    lightingRules: "tons frios, atmosfera pesada, neve, névoa e iluminação dramática",
    colorPalette: "tons frios e sombrios",
    architectureRenderingRules: "arquitetura gótica medieval consistente entre imagens",
    characterRenderingRules: "identidade facial sempre preservada entre imagens",
    prohibitedStyles: ["anime", "cartoon", "fotografia moderna"],
    globalNegativeInstructions: ["sem texto", "sem marca dágua", "sem molduras"],
    referenceAssetIds: [],
    createdAt: now,
  };
}

export async function seedVisualEncyclopedia(deps: SeedDeps, campaignId: string): Promise<SeedSummary> {
  let styleBibleCreated = false;
  const existingBible = await deps.getActiveStyleBible(campaignId);
  if (!existingBible) {
    await deps.putStyleBible(campaignId, buildStyleBibleV1(campaignId, deps.now()));
    styleBibleCreated = true;
  }

  let entitiesCreated = 0;
  let assetsCreated = 0;

  for (const item of SEED_ITEMS) {
    const existing = await deps.getEntity(campaignId, item.entityId);
    if (!existing) {
      const entity = newVisualEntity({ id: item.entityId, campaignId, entityType: item.entityType, canonicalName: item.name, slug: item.slug, publicDescription: item.description });
      entity.status = item.canonicalLevel === "LOCKED" ? "LOCKED" : "CANONICAL";
      await deps.putEntity(campaignId, entity);
      entitiesCreated++;
    }

    const buffer = await deps.loadSeedImage(item.file);
    const assetId = deps.newId();
    const up = await deps.uploadAsset(assetId, buffer);
    const asset: VisualAsset = {
      id: assetId, campaignId, entityId: item.entityId, assetType: item.assetType,
      storageKey: up.key, storageUrl: up.url, thumbnailStorageKey: up.thumbnailKey, thumbnailUrl: up.thumbnailUrl,
      mimeType: "image/png", width: 1536, height: 1024, aspectRatio: "3:2", checksum: "",
      status: "READY", canonicalLevel: item.canonicalLevel, styleBibleVersion: 1, entityVersion: 1,
      generationId: null, parentAssetIds: [], referenceRoles: item.entityType === "MAP" ? ["GEOGRAPHY"] : ["IDENTITY"],
      cameraAngle: "", viewType: "", description: item.description, extractedVisualDescription: "",
      consistencyScore: null, consistencyReport: null, tags: ["seed"], createdAt: deps.now(),
    };
    await deps.putAsset(campaignId, asset);
    assetsCreated++;
  }

  return { styleBibleCreated, entitiesCreated, assetsCreated };
}
