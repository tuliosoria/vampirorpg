import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { SEATS } from "../diplomacy/geography.js";
import { HOUSE_PROFILE, houseProfileFor } from "./houseProfile.js";
import { semearCanon, limparCanon } from "../test/fixtures.js";

beforeEach(semearCanon);
afterEach(limparCanon);

describe("HOUSE_PROFILE", () => {
  it("nasce vazio: nenhum perfil vem de outro mundo", () => {
    limparCanon();
    expect(Object.keys(HOUSE_PROFILE)).toHaveLength(0);
    expect(houseProfileFor("cla-ventrue")).toBeNull();
  });

  it("só descreve domínios que existem no cânone", () => {
    const dominios = new Set(SEATS.map((s) => s.key));
    for (const key of Object.keys(HOUSE_PROFILE)) {
      expect(dominios.has(key), `${key} não tem domínio`).toBe(true);
    }
  });

  it("explica os quatro atributos de cada perfil que existir", () => {
    for (const [key, p] of Object.entries(HOUSE_PROFILE)) {
      for (const campo of ["wealth", "resources", "soldiers", "control"] as const) {
        expect(p[campo].trim(), `${key}.${campo}`).not.toBe("");
      }
    }
  });

  it("devolve null para um domínio desconhecido", () => {
    expect(houseProfileFor("cla-inventado")).toBeNull();
    expect(houseProfileFor("cla-ventrue")).not.toBeNull();
  });
});
