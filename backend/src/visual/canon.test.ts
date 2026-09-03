import { describe, it, expect } from "vitest";
import { newVisualEntity, type WikiEntry } from "@vampiro/content";
import { buildCanonicalCanon } from "./canon";

function entry(title: string, body: string, section = "clas"): WikiEntry {
  return { entryId: title, section, title, body, order: 0, updatedAt: "" };
}

const wiki: WikiEntry[] = [
  entry(
    "Clã Malkavian — Os Vigias da Última Neve",
    `> **Lema:** "Enquanto houver luz, há aviso."
> **Símbolo:** uma torre negra sob três flocos.
> **Sede:** Antigo Sanatório.

Malkavian foi fundada para manter Antigo Sanatório.`,
  ),
  entry(
    "Clã Gangrel — Os Lobos da Fronteira",
    `> **Símbolo:** um lobo cinzento diante de uma fogueira branca.
> **Sede:** Parque do Norte.`,
  ),
  entry(
    "Antigo Sanatório — A Última Vigília",
    "Antigo Sanatório é a última grande fortaleza antes das geleiras. Possui muralhas, quartéis e o Farol de Gelo.",
    "lugares",
  ),
];

describe("buildCanonicalCanon", () => {
  it("injects canon the author never typed, from a short request", async () => {
    const canon = await buildCanonicalCanon(null, "desenhe uma muralha de Antigo Sanatório", wiki);
    expect(canon).toMatch(/Farol de Gelo/);
    expect(canon).toMatch(/geleiras/);
  });

  it("injects the correct house emblem and not a neighbouring house's", async () => {
    // Malkavian is a black tower under three snowflakes; the grey wolf is
    // Gangrel's. Confusing them would put the wrong emblem into canon.
    const canon = await buildCanonicalCanon(null, "o estandarte da Clã Malkavian", wiki);
    expect(canon).toMatch(/torre negra sob três flocos/);
    expect(canon).not.toMatch(/lobo/i);
  });

  it("finds the entity's article via its name even when the request omits it", async () => {
    const entity = newVisualEntity({
      id: "rw", campaignId: "cidade-noturna", entityType: "CITY",
      canonicalName: "Antigo Sanatório", slug: "sanatorio",
    });
    const canon = await buildCanonicalCanon(entity, "vista ao amanhecer", wiki);
    expect(canon).toMatch(/Farol de Gelo/);
  });

  it("puts the entity's own canon sheet before the wiki article", async () => {
    const entity = newVisualEntity({
      id: "rw", campaignId: "cidade-noturna", entityType: "CITY",
      canonicalName: "Antigo Sanatório", slug: "sanatorio",
      publicDescription: "A fortaleza está parcialmente em ruínas.",
    });
    const canon = await buildCanonicalCanon(entity, "Antigo Sanatório", wiki);
    expect(canon.indexOf("parcialmente em ruínas")).toBeLessThan(canon.indexOf("Farol de Gelo"));
  });

  it("returns empty rather than echoing the request back as canon", async () => {
    // The old behaviour returned requestText, which presented the author's own
    // words to the model as though they were established canon.
    const canon = await buildCanonicalCanon(null, "um pônei feliz num campo", wiki);
    expect(canon).toBe("");
  });

  it("still works with no wiki available", async () => {
    const entity = newVisualEntity({
      id: "x", campaignId: "cidade-noturna", entityType: "CITY",
      canonicalName: "X", slug: "x", publicDescription: "Uma cidade.",
    });
    expect(await buildCanonicalCanon(entity, "algo", [])).toBe("Uma cidade.");
  });
});
