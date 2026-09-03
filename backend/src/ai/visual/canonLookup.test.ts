import { describe, it, expect } from "vitest";
import type { WikiEntry } from "@vampiro/content";
import { extractCanonFacts, findCanonMatches, renderCanonMatches, seatName, significantTokens, titleHead } from "./canonLookup";

function entry(over: Partial<WikiEntry> & { title: string; body: string }): WikiEntry {
  return { entryId: over.title, section: "clas", order: 0, updatedAt: "", ...over };
}

// Real shapes from the live wiki.
const malkavian = entry({
  title: "Clã Malkavian — Os Vigias da Última Neve",
  body: `> **Lema:** "Enquanto houver luz, há aviso."
> **Símbolo:** uma torre negra sob três flocos.
> **Território:** extremo norte.
> **Sede:** Antigo Sanatório.
> **Status:** Grande Casa menor, de importância estratégica.

### Origem

Malkavian foi fundada para manter Antigo Sanatório.`,
});

const gangrel = entry({
  title: "Clã Gangrel — Os Lobos da Fronteira",
  body: `> **Lema:** "Ninguém fica para trás na neve."
> **Símbolo:** um lobo cinzento diante de uma fogueira branca.
> **Território:** Marcas do Norte.
> **Sede:** Parque do Norte.`,
});

const sanatorio = entry({
  title: "Antigo Sanatório — A Última Vigília",
  section: "lugares",
  body: "Antigo Sanatório é a última grande fortaleza antes das geleiras. Possui muralhas, quartéis, cisternas aquecidas, depósitos, uma capela da Corte do Sangue e o Farol de Gelo.",
});

const all = [malkavian, gangrel, sanatorio];

describe("extractCanonFacts", () => {
  it("pulls the structured header fields", () => {
    const f = extractCanonFacts(malkavian.body);
    expect(f.simbolo).toBe("uma torre negra sob três flocos");
    expect(f.sede).toBe("Antigo Sanatório");
    expect(f.territorio).toBe("extremo norte");
    expect(f.lema).toContain("Enquanto houver luz");
  });

  it("returns an empty object for an entry with no header block", () => {
    expect(extractCanonFacts(sanatorio.body)).toEqual({});
  });

  it("ignores a symbol quoted later in the prose", () => {
    // Guards against attributing another house's emblem to this entry.
    const e = `> **Símbolo:** uma torre negra sob três flocos.\n\n${"filler. ".repeat(300)}\n> **Símbolo:** um lobo cinzento.`;
    expect(extractCanonFacts(e).simbolo).toBe("uma torre negra sob três flocos");
  });
});

describe("titleHead / significantTokens", () => {
  it("takes the name before the epithet", () => {
    expect(titleHead("Clã Malkavian — Os Vigias da Última Neve")).toBe("Clã Malkavian");
  });

  it("drops words that would match every house", () => {
    expect(significantTokens("Clã Malkavian — Os Vigias")).toEqual(["malkavian"]);
  });
});

describe("findCanonMatches", () => {
  it("resolves a short request to the right city entry", () => {
    const m = findCanonMatches("desenhe uma muralha de Antigo Sanatório", all);
    expect(m.map((x) => x.entry.title)).toContain("Antigo Sanatório — A Última Vigília");
  });

  it("does NOT attribute Gangrel's wolf to a Antigo Sanatório request", () => {
    // The user believed Malkavian's emblem was a wolf. It is Gangrel's. A system
    // that guesses would inject the wrong house's emblem into canon.
    const m = findCanonMatches("uma muralha de Antigo Sanatório", all);
    const rendered = renderCanonMatches(m);
    expect(rendered).not.toMatch(/lobo/i);
  });

  it("finds the house when the house name is used", () => {
    const m = findCanonMatches("o estandarte da Clã Malkavian", all);
    expect(m[0].entry.title).toBe("Clã Malkavian — Os Vigias da Última Neve");
    expect(m[0].facts.simbolo).toBe("uma torre negra sob três flocos");
  });

  it("matches case- and accent-insensitively", () => {
    expect(findCanonMatches("A ÚLTIMA VIGÍLIA no ANTIGO SANATÓRIO", all).length).toBeGreaterThan(0);
  });

  it("returns nothing when the request names no known entity", () => {
    expect(findCanonMatches("um pônei feliz num campo", all)).toEqual([]);
  });

  // O teto vale para as entradas diretas; a Sede ainda pode trazer a que
  // completa o par, e aqui ela já está entre as escolhidas.
  it("caps how many entries it injects", () => {
    expect(findCanonMatches("Antigo Sanatório Malkavian", all, 2)).toHaveLength(2);
  });

  it("prefers the more distinctive match first", () => {
    const m = findCanonMatches("Malkavian", all);
    expect(m[0].entry.title).toContain("Malkavian");
  });
});

describe("renderCanonMatches", () => {
  it("labels the symbol as something that must appear on insignia", () => {
    const rendered = renderCanonMatches(findCanonMatches("Clã Malkavian", all));
    expect(rendered).toMatch(/Símbolo.*torre negra sob três flocos/);
  });

  it("strips the markdown blockquote markers from the prose", () => {
    expect(renderCanonMatches(findCanonMatches("Clã Malkavian", all))).not.toMatch(/^>/m);
  });
});

describe("seat linkage", () => {
  it("pulls the owning house's emblem when the request only names its seat", () => {
    // "Antigo Sanatório" contains no token matching "Clã Malkavian", but Malkavian
    // declares `Sede: Antigo Sanatório`, which is how the heraldry gets found.
    const m = findCanonMatches("desenhe uma muralha de Antigo Sanatório", all);
    const titles = m.map((x) => x.entry.title);
    expect(titles).toContain("Antigo Sanatório — A Última Vigília");
    expect(titles).toContain("Clã Malkavian — Os Vigias da Última Neve");
    expect(renderCanonMatches(m)).toMatch(/torre negra sob três flocos/);
  });

  it("still does not drag in the neighbouring house's wolf", () => {
    const rendered = renderCanonMatches(findCanonMatches("desenhe uma muralha de Antigo Sanatório", all));
    expect(rendered).not.toMatch(/lobo/i);
  });

  it("does not add a house whose seat is unrelated", () => {
    const m = findCanonMatches("Parque do Norte", all);
    expect(m.map((x) => x.entry.title)).toContain("Clã Gangrel — Os Lobos da Fronteira");
  });
});

describe("seat linkage, House -> City", () => {
  // The failure that motivated this: "a capital de Brujah" pulled only the
  // House article. The city article is the sole place the fortified wagons and
  // wheels are described, so with it missing the model had nothing concrete and
  // rendered a city defined by movement as tents standing on the ground.
  const brujah = entry({
    title: "Clã Brujah — As Filhas da Estrela",
    body: "> **Símbolo:** uma estrela de oito pontas sobre um cavalo branco.\n> **Sede:** Rua Treze, cidade móvel.",
  });
  const orduYildiz = entry({
    title: "Rua Treze — A Cidade que Cavalga",
    section: "lugares",
    body: "Rua Treze é formada por carroças fortificadas, tendas, estábulos, santuários e oficinas móveis.",
  });
  const set = [brujah, orduYildiz, gangrel];

  it("reaches the seat's own article from the House name", () => {
    const titles = findCanonMatches("criar a capital de Brujah", set).map((m) => m.entry.title);
    expect(titles).toContain("Clã Brujah — As Filhas da Estrela");
    expect(titles).toContain("Rua Treze — A Cidade que Cavalga");
  });

  it("carries the concrete structure into the rendered canon", () => {
    const rendered = renderCanonMatches(findCanonMatches("a capital de Brujah", set));
    expect(rendered).toMatch(/carroças fortificadas/);
  });

  it("parses a seat written as prose with an aside", () => {
    // "Rua Treze, cidade móvel" names the place plus a description.
    expect(seatName("Rua Treze, cidade móvel")).toBe("rua treze");
    expect(seatName(undefined)).toBeNull();
  });

  it("still resolves City -> House in the other direction", () => {
    const titles = findCanonMatches("as ruas de Rua Treze", set).map((m) => m.entry.title);
    expect(titles).toContain("Clã Brujah — As Filhas da Estrela");
  });

  it("does not drag in an unrelated House", () => {
    const rendered = renderCanonMatches(findCanonMatches("a capital de Brujah", set));
    expect(rendered).not.toMatch(/lobo/i);
  });
});
