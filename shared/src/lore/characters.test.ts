import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { HOUSE_CHARACTERS, characterFor, characterId, houseRoster } from "./characters.js";
import { semearCanon, limparCanon } from "../test/fixtures.js";

describe("characterId", () => {
  it("faz um slug estável do nome", () => {
    expect(characterId("All Marifh")).toBe("all-marifh");
    expect(characterId("Selma Karasoy")).toBe("selma-karasoy");
  });

  it("descarta o cargo embutido depois da vírgula", () => {
    expect(characterId("Lorde Marcien Auremont, Comandante da Cavalaria e Herdeiro de Aurivale"))
      .toBe("lorde-marcien-auremont");
  });

  it("dobra acentos", () => {
    expect(characterId("Príncipe Sétimo")).toBe("principe-setimo");
  });
});

beforeEach(semearCanon);
afterEach(limparCanon);

describe("roster e resolução", () => {
  it("resolve um personagem pelo clã e pelo id", () => {
    expect(characterFor("cla-ventrue", "vasco-aranha")?.name).toBe("Vasco Aranha");
  });

  it("não resolve alguém de outro clã", () => {
    // Vasco é Ventrue; pedir por ele entre os Nosferatu é engano.
    expect(characterFor("cla-nosferatu", "vasco-aranha")).toBeNull();
  });

  it("devolve vazio para clã desconhecido", () => {
    expect(houseRoster("cla-inexistente")).toEqual([]);
  });

  it("devolve vazio enquanto o Narrador não cadastrou elenco nenhum", () => {
    limparCanon();
    expect(houseRoster("cla-ventrue")).toEqual([]);
  });

  // Dois personagens com o mesmo id num clã fazem a carta ir para o errado sem
  // erro nenhum — o pior tipo de defeito.
  it("não tem ids colidindo dentro de um clã", () => {
    for (const [houseKey, cast] of Object.entries(HOUSE_CHARACTERS)) {
      const ids = cast.map((c) => characterId(c.name));
      expect(new Set(ids).size, `colisão em ${houseKey}`).toBe(ids.length);
    }
  });
});
