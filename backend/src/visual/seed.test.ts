import { describe, it, expect, vi } from "vitest";
import { seedVisualEncyclopedia, SEED_ITEMS, type SeedDeps } from "./seed";

function makeDeps(over: Partial<SeedDeps> = {}): SeedDeps {
  return {
    getActiveStyleBible: vi.fn(async () => null),
    putStyleBible: vi.fn(async () => {}),
    getEntity: vi.fn(async () => null),
    putEntity: vi.fn(async () => {}),
    putAsset: vi.fn(async () => {}),
    loadSeedImage: vi.fn(async () => Buffer.from("img")),
    uploadAsset: vi.fn(async (id: string) => ({ key: `visual/${id}/original.png`, url: `https://x/${id}.png`, thumbnailKey: null, thumbnailUrl: null })),
    newId: (() => { let n = 0; return () => `id-${n++}`; })(),
    now: () => "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("seedVisualEncyclopedia", () => {
  // O acervo nasce vazio: a arte era do jogo de origem e os arquivos nem vieram
  // no fork. O que se garante aqui é que semear o vazio cria a Bíblia de estilo
  // e nada mais — nenhuma entidade fantasma apontando para PNG inexistente.
  it("cria a Bíblia de estilo e nenhum ativo numa crônica nova", async () => {
    const deps = makeDeps();
    const summary = await seedVisualEncyclopedia(deps, "cidade-noturna");
    expect(deps.putStyleBible).toHaveBeenCalledTimes(1);
    expect(deps.putAsset).toHaveBeenCalledTimes(SEED_ITEMS.length);
    expect(summary.assetsCreated).toBe(SEED_ITEMS.length);
    expect(SEED_ITEMS).toHaveLength(0);
  });
  // Todo item de semente que existir precisa declarar seu nível canônico: um
  // mapa oficial entra travado, senão a próxima geração o reescreve.
  it("todo item de semente declara um nível canônico", async () => {
    for (const item of SEED_ITEMS) {
      expect(["LOCKED", "CANONICAL", "DRAFT"]).toContain(item.canonicalLevel);
    }
  });
  it("does not recreate the StyleBible when one is already active", async () => {
    const deps = makeDeps({ getActiveStyleBible: vi.fn(async () => ({ version: 1 } as any)) });
    await seedVisualEncyclopedia(deps, "cidade-noturna");
    expect(deps.putStyleBible).not.toHaveBeenCalled();
  });
  it("does not recreate an entity that already exists", async () => {
    const deps = makeDeps({ getEntity: vi.fn(async () => ({ id: "exists" } as any)) });
    const summary = await seedVisualEncyclopedia(deps, "cidade-noturna");
    expect(summary.entitiesCreated).toBe(0);
  });
});
