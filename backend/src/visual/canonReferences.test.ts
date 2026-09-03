import { describe, it, expect } from "vitest";
import { newVisualEntity, type VisualAsset, type VisualEntity, type WikiEntry } from "@vampiro/content";
import { resolveCanonReferences } from "./canonReferences";

const wiki: WikiEntry[] = [
  {
    entryId: "w-brujah", section: "clas", order: 0, updatedAt: "",
    title: "Clã Brujah — As Filhas da Estrela",
    body: "> **Símbolo:** uma estrela de oito pontas sobre um cavalo branco.\n> **Sede:** Rua Treze.",
  },
  {
    entryId: "w-gangrel", section: "clas", order: 0, updatedAt: "",
    title: "Clã Gangrel — Os Lobos da Fronteira",
    body: "> **Símbolo:** um lobo cinzento diante de uma fogueira branca.\n> **Sede:** Parque do Norte.",
  },
];

function entity(id: string, name: string, wikiEntryId: string | null): VisualEntity {
  const e = newVisualEntity({ id, campaignId: "cidade-noturna", entityType: "HOUSE", canonicalName: name, slug: id });
  e.wikiEntryId = wikiEntryId;
  return e;
}

function asset(over: Partial<VisualAsset> & { id: string; entityId: string | null }): VisualAsset {
  return {
    campaignId: "cidade-noturna", assetType: "EMBLEM", storageKey: "k", storageUrl: "u",
    thumbnailStorageKey: null, thumbnailUrl: null, mimeType: "image/png", width: 1, height: 1,
    aspectRatio: "1:1", checksum: "c", status: "READY", canonicalLevel: "CANONICAL",
    styleBibleVersion: 1, entityVersion: null, generationId: null, parentAssetIds: [],
    referenceRoles: [], cameraAngle: "", viewType: "", description: "",
    extractedVisualDescription: "", consistencyScore: null, consistencyReport: null,
    tags: [], createdAt: "", ...over,
  };
}

const entities = [entity("brujah", "Clã Brujah", "w-brujah"), entity("gangrel", "Clã Gangrel", "w-gangrel")];
const emblemBrujah = asset({ id: "em-brujah", entityId: "brujah" });
const emblemGangrel = asset({ id: "em-gangrel", entityId: "gangrel" });

describe("resolveCanonReferences", () => {
  it("attaches the emblem of the House the request names", () => {
    // Prose cannot pin heraldry: "estrela de oito pontas sobre um cavalo branco"
    // is satisfied by countless drawings, so only the image holds it steady.
    const out = resolveCanonReferences({
      requestText: "a capital de Brujah, Rua Treze",
      entity: null, wikiEntries: wiki, entities, assets: [emblemBrujah, emblemGangrel],
    });
    expect(out.map((a) => a.id)).toEqual(["em-brujah"]);
  });

  it("does not attach a House the request never mentions", () => {
    const out = resolveCanonReferences({
      requestText: "a capital de Brujah",
      entity: null, wikiEntries: wiki, entities, assets: [emblemBrujah, emblemGangrel],
    });
    expect(out.map((a) => a.id)).not.toContain("em-gangrel");
  });

  it("prefers an explicit emblem over an unrelated canonical image", () => {
    const cityShot = asset({ id: "city", entityId: "brujah", assetType: "ESTABLISHING" });
    const out = resolveCanonReferences({
      requestText: "Brujah", entity: null, wikiEntries: wiki, entities,
      assets: [cityShot, emblemBrujah],
    });
    expect(out.map((a) => a.id)).toEqual(["em-brujah"]);
  });

  it("falls back to any canonical image when no emblem exists", () => {
    const cityShot = asset({ id: "city", entityId: "brujah", assetType: "ESTABLISHING" });
    const out = resolveCanonReferences({
      requestText: "Brujah", entity: null, wikiEntries: wiki, entities, assets: [cityShot],
    });
    expect(out.map((a) => a.id)).toEqual(["city"]);
  });

  it("ignores drafts, which are not canon", () => {
    const draft = asset({ id: "d", entityId: "brujah", canonicalLevel: "DRAFT" });
    const out = resolveCanonReferences({
      requestText: "Brujah", entity: null, wikiEntries: wiki, entities, assets: [draft],
    });
    expect(out).toEqual([]);
  });

  it("skips the entity being drawn, whose identity refs are attached separately", () => {
    const out = resolveCanonReferences({
      requestText: "Brujah", entity: entities[0], wikiEntries: wiki, entities,
      assets: [emblemBrujah],
    });
    expect(out).toEqual([]);
  });

  it("returns nothing when no entity is linked to the matched entry", () => {
    const unlinked = [entity("brujah", "Clã Brujah", null)];
    const out = resolveCanonReferences({
      requestText: "Brujah", entity: null, wikiEntries: wiki, entities: unlinked, assets: [emblemBrujah],
    });
    expect(out).toEqual([]);
  });

  it("caps how many emblems it attaches", () => {
    const out = resolveCanonReferences({
      requestText: "Brujah e Gangrel", entity: null, wikiEntries: wiki, entities,
      assets: [emblemBrujah, emblemGangrel], limit: 1,
    });
    expect(out).toHaveLength(1);
  });
});
