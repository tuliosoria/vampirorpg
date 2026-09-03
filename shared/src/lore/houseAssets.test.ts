import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { houseShortName, houseTerms, mentionsHouse } from "./houseAssets";
import { semearCanon, limparCanon } from "../test/fixtures.js";

beforeEach(semearCanon);
afterEach(limparCanon);

describe("houseShortName", () => {
  it("remove o prefixo que os clãs dividem entre si", () => {
    expect(houseShortName("Clã Ventrue")).toBe("ventrue");
    expect(houseShortName("Casa do Ouro")).toBe("ouro");
    expect(houseShortName("Grande Casa Ulgar")).toBe("ulgar");
  });

  // Podar o prefixo de "Ordem do Sino" deixaria "sino", que aparece em muita
  // coisa que não é a Ordem. Nomes curtos demais sobrevivem inteiros.
  it("preserva nomes que só se distinguem por inteiro", () => {
    expect(houseShortName("Ordem do Sino")).toBe("ordem do sino");
    expect(houseShortName("Irmandade dos Corvos")).toBe("irmandade dos corvos");
  });
});

describe("mentionsHouse", () => {
  it("reconhece o clã pelo nome", () => {
    expect(mentionsHouse("Símbolo — Clã Ventrue", "cla-ventrue")).toBe(true);
  });

  // A imagem mais reconhecível de um clã costuma ser o refúgio, e a entidade
  // dele leva o nome do lugar, não o do clã.
  it("reconhece o clã pelo endereço do refúgio", () => {
    expect(mentionsHouse("Banco Providência", "cla-ventrue")).toBe(true);
    expect(mentionsHouse("A escada da Galeria Subterrânea", "cla-nosferatu")).toBe(true);
  });

  // Nosferatu tem dois endereços, e a peça batizada só com o segundo sumiria da
  // página se o refúgio principal fosse o único termo aceito.
  it("reconhece o clã por um lugar que não é o refúgio principal", () => {
    expect(mentionsHouse("Névoa sobre o Cais Velho", "cla-nosferatu")).toBe(true);
  });

  it("é indiferente a acento e caixa", () => {
    expect(mentionsHouse("CLÃ VENTRUE", "cla-ventrue")).toBe(true);
  });

  it("não confunde clãs diferentes", () => {
    expect(mentionsHouse("Símbolo — Clã Ventrue", "cla-toreador")).toBe(false);
    expect(mentionsHouse("Banco Providência", "cla-nosferatu")).toBe(false);
  });

  it("aceita texto vazio e chave desconhecida", () => {
    expect(mentionsHouse("", "cla-ventrue")).toBe(false);
    expect(mentionsHouse(null, "cla-ventrue")).toBe(false);
    expect(mentionsHouse("Clã Ventrue", "cla-inexistente")).toBe(false);
    expect(houseTerms("cla-inexistente")).toEqual([]);
  });
});
