import { describe, expect, it } from "vitest";
import { buildDossier, formatPopulation, knownHouseKeys } from "./dossier";
import { HOUSE_CANON, LEADER_PERSONAS, type VisualAsset, type VisualEntity } from "@vampiro/content";
import type { WikiEntry } from "../../types/api";

const asset = (id: string, entityId: string | null): VisualAsset =>
  ({ id, entityId, storageUrl: `https://img/${id}.png`, assetType: "SCENE" }) as VisualAsset;

const entity = (id: string, canonicalName: string): VisualEntity =>
  ({ id, canonicalName }) as VisualEntity;

const article = (title: string): WikiEntry => ({ title, section: "clas", body: "" }) as WikiEntry;

/**
 * A crônica desta partida, que é onde a morte mora.
 *
 * O elenco é cânone do mundo e não sabe quem morreu; quem morreu sai daqui. Sem
 * essa separação, uma ficha seguia dizendo que alguém governa depois de a
 * crônica tê-lo enterrado — foi assim que uma carta saiu assinada por um morto.
 */
const A_NOITE_DO_BANCO = [
  "O incêndio no Banco Providência durou até o amanhecer.",
  "Vasco Aranha não saiu, e morreu antes que alguém chegasse.",
].join("\n");

const input = {
  assets: [
    asset("emb", "emblem-cla-ventrue"),
    asset("refugio", "banco-providencia"),
    asset("alheia", "galeria"),
    asset("sem-entidade", null),
  ],
  entities: [
    entity("emblem-cla-ventrue", "Símbolo — Clã Ventrue"),
    entity("banco-providencia", "Banco Providência"),
    entity("galeria", "Galeria Subterrânea"),
  ],
  wiki: [article("Clã Ventrue"), article("Clã Nosferatu")],
  chronicle: A_NOITE_DO_BANCO,
};

describe("buildDossier", () => {
  it("usa o símbolo do clã e não o repete entre as imagens", () => {
    const d = buildDossier("cla-ventrue", input)!;
    expect(d.emblemUrl).toBe("https://img/emb.png");
    expect(d.images.map((a) => a.id)).toEqual(["refugio"]);
  });

  it("traz o verbete do clã e descarta o dos outros", () => {
    const d = buildDossier("cla-ventrue", input)!;
    expect(d.articles.map((a) => a.title)).toEqual(["Clã Ventrue"]);
  });

  it("marca como morto quem a crônica declara morto", () => {
    const d = buildDossier("cla-ventrue", input)!;
    expect(d.figures.find((f) => f.name.includes("Vasco"))?.dead).toBe(true);
  });

  // Quem sucede é decisão do Narrador, não do código: o dossiê marca a morte e
  // para aí. Trocar o líder sozinho seria inventar cânone — e uma carta saindo
  // assinada por quem o site elegeu é pior do que uma assinada por um morto.
  it("marca o líder como morto sem escolher sucessor por conta própria", () => {
    const d = buildDossier("cla-ventrue", input)!;
    expect(d.leader?.leaderName).toBe("Vasco Aranha");
    expect(d.leader?.dead).toBe(true);
  });

  it("mantém vivo o resto do clã", () => {
    const d = buildDossier("cla-ventrue", input)!;
    const outros = d.figures.filter((f) => !f.name.includes("Vasco"));
    expect(outros.length).toBeGreaterThan(0);
    expect(outros.every((f) => !f.dead)).toBe(true);
  });

  it("não mata ninguém quando a crônica está vazia", () => {
    const d = buildDossier("cla-ventrue", { ...input, chronicle: "" })!;
    expect(d.leader?.dead).toBe(false);
    expect(d.figures.every((f) => !f.dead)).toBe(true);
  });

  it("devolve null para uma chave desconhecida", () => {
    expect(buildDossier("cla-inexistente", input)).toBeNull();
  });

  /**
   * Todo domínio no mapa rende um dossiê, mesmo antes de o Narrador ter escrito
   * a demografia ou a persona dele: a página do clã precisa abrir desde a
   * primeira noite, mostrando o que já existe e calando sobre o resto.
   */
  it("rende dossiê para todo domínio cadastrado, povoado ou não", () => {
    for (const key of knownHouseKeys()) {
      const d = buildDossier(key, input);
      expect(d, key).not.toBeNull();
      expect(d!.seat.key, key).toBe(key);
      if (HOUSE_CANON[key]) expect(d!.canon, key).not.toBeNull();
      if (LEADER_PERSONAS[key]) expect(d!.leader, key).not.toBeNull();
    }
  });

  it("não inventa elenco para o clã que ainda não tem gente escrita", () => {
    expect(buildDossier("cla-ravnos", input)!.figures).toEqual([]);
  });
});

describe("formatPopulation", () => {
  it("formata com separador de milhar", () => {
    expect(formatPopulation(155000)).toBe("155.000 habitantes");
  });

  it("diz quando o cânone não recenseou", () => {
    expect(formatPopulation(null)).toBe("não recenseada");
  });
});
