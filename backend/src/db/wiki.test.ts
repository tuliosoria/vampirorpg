import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { listWikiEntries, listCanonWikiEntries, putWikiEntry, deleteWikiEntry, generateWikiId, seedDefaultWiki } from "./wiki";
import { DEFAULT_WIKI_ENTRIES, WIKI_SECTION_IDS, type WikiEntry } from "@vampiro/content";
import { semearCanon, limparCanon } from "@vampiro/content/test-fixtures";

beforeEach(semearCanon);
afterEach(limparCanon);

const TABLE = "ravenloft-game";
const CAMPAIGN = "cidade-noturna";

function docReturning(value: unknown) {
  return { send: vi.fn().mockResolvedValue(value) };
}

const entry: WikiEntry = {
  entryId: "abc123",
  section: "clas",
  title: "Casa Vargen",
  body: "Os lobos do norte.",
  order: 0,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("wiki db", () => {
  it("lists and sorts entries by section order then entry order", async () => {
    const doc = docReturning({
      Items: [
        { entryId: "b", section: "lugares", title: "Harrow", body: "", order: 1, updatedAt: "" },
        { entryId: "a", section: "clas", title: "Segundo", body: "", order: 2, updatedAt: "" },
        { entryId: "c", section: "clas", title: "Primeiro", body: "", order: 1, updatedAt: "" },
      ],
    });
    const entries = await listWikiEntries(doc as never, TABLE, CAMPAIGN);
    expect(entries.map((e) => e.entryId)).toEqual(["c", "a", "b"]);
    const cmd = doc.send.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(QueryCommand);
    expect(cmd.input.ExpressionAttributeValues[":sk"]).toBe("WIKI#");
  });

  it("supports encyclopedia sections and preserves entry images", async () => {
    expect(WIKI_SECTION_IDS).toContain("bairros");
    expect(WIKI_SECTION_IDS).toContain("mortais");
    expect(WIKI_SECTION_IDS).toContain("guerras");
    expect(WIKI_SECTION_IDS).toContain("linhagens");
    expect(WIKI_SECTION_IDS).toContain("lendas");
    expect(WIKI_SECTION_IDS).toContain("corte");
    expect(WIKI_SECTION_IDS).toContain("dinheiro");

    const doc = docReturning({
      Items: [
        { entryId: "cla", section: "clas", title: "Clã Gangrel", body: "Fora dos muros.", order: 0, updatedAt: "", imageUrls: ["/clas/gangrel.jpg", "/clas/gangrel-2.jpg"] },
        { entryId: "atlas", section: "bairros", title: "Atlas da Cidade", body: "Mapa.", order: 1, updatedAt: "", imageUrl: "/mapa-da-cidade.png" },
      ],
    });

    const entries = await listWikiEntries(doc as never, TABLE, CAMPAIGN);
    // "clas" vem antes de "bairros" em WIKI_SECTIONS, e a ordenação segue as seções.
    expect(entries[0]).toMatchObject({
      imageUrl: "/clas/gangrel.jpg",
      imageUrls: ["/clas/gangrel.jpg", "/clas/gangrel-2.jpg"],
    });
    expect(entries[1]).toMatchObject({ imageUrl: "/mapa-da-cidade.png" });
  });

  it("puts an entry under a WIKI# sort key", async () => {
    const doc = docReturning({});
    await putWikiEntry(doc as never, TABLE, CAMPAIGN, entry);
    const cmd = doc.send.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(PutCommand);
    expect(cmd.input.Item.SK).toBe("WIKI#abc123");
    expect(cmd.input.Item.title).toBe("Casa Vargen");
  });

  it("deletes an entry by id", async () => {
    const doc = docReturning({});
    await deleteWikiEntry(doc as never, TABLE, CAMPAIGN, "abc123");
    const cmd = doc.send.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(DeleteCommand);
    expect(cmd.input.Key.SK).toBe("WIKI#abc123");
  });

  it("generates a 10-char id", () => {
    expect(generateWikiId()).toMatch(/^[a-z0-9]{10}$/);
  });

  // A enciclopédia nasce vazia: os verbetes são cânone da crônica, escritos
  // pelo Narrador na interface. Herdar verbetes de outro mundo era exatamente
  // o que este fork existe para não fazer.
  it("não traz verbete nenhum de fábrica", () => {
    // As fixtures semeiam verbetes para as outras suítes; aqui a afirmação é
    // justamente sobre o estado de fábrica, então o cânone sai da frente.
    limparCanon();
    expect(DEFAULT_WIKI_ENTRIES).toEqual([]);
  });

  it("todo verbete padrão que existir cai numa seção conhecida", () => {
    for (const entry of DEFAULT_WIKI_ENTRIES) {
      expect(WIKI_SECTION_IDS).toContain(entry.section);
      expect(entry.title.trim()).not.toBe("");
    }
  });

  it("semear o padrão vazio não inventa verbete", async () => {
    const doc = { send: vi.fn().mockResolvedValue({ Items: [] }) };
    const result = await seedDefaultWiki(doc as never, TABLE, CAMPAIGN);
    expect(result.seeded).toBe(DEFAULT_WIKI_ENTRIES.length);
    const puts = doc.send.mock.calls.map((c) => c[0]).filter((c) => c instanceof PutCommand);
    expect(puts).toHaveLength(DEFAULT_WIKI_ENTRIES.length);
    for (const put of puts) expect(put.input.Item!.SK).toMatch(/^WIKI#/);
  });

  it("does not seed when entries already exist", async () => {
    const doc = {
      send: vi.fn().mockResolvedValue({
        Items: [{ entryId: "x", section: "clas", title: "T", body: "", order: 0, updatedAt: "" }],
      }),
    };
    const result = await seedDefaultWiki(doc as never, TABLE, CAMPAIGN);
    expect(result.seeded).toBe(0);
    expect(doc.send.mock.calls.map((c) => c[0]).some((c) => c instanceof PutCommand)).toBe(false);
  });
});

describe("listCanonWikiEntries", () => {
  it("keeps every section that describes the world", async () => {
    const doc = docReturning({
      Items: [
        { entryId: "a", section: "disciplinas", title: "Magia na Cidade", body: "Rara.", order: 0, updatedAt: "" },
        { entryId: "b", section: "clas", title: "Casa Vargen", body: "Os lobos.", order: 0, updatedAt: "" },
      ],
    });

    const entries = await listCanonWikiEntries(doc as never, TABLE, CAMPAIGN);

    expect(entries).toHaveLength(2);
  });
});
