import { describe, expect, it } from "vitest";
import { isDeadInChronicle } from "./mortality";

/**
 * Trechos reais da crônica, copiados dos turnos gravados no banco.
 *
 * Não são paráfrases de propósito: a primeira versão deste teste usava um
 * resumo escrito à mão, e a distância entre "Inês" e a palavra de morte
 * saiu maior do que no texto verdadeiro. O teste passava até com uma
 * implementação ingênua de janela de caracteres — a mesma que produziu o bug.
 */
const TURN_1 = [
  "existem relatos de mortos deixando suas sepulturas.",
  "",
  "Um mensageiro de Stonebridge confirmou a chegada de refugiados. Entre eles estava",
  "um soldado reconhecido por seus antigos companheiros como um homem morto e enterrado meses antes.",
  "",
  "Antes de encerrar a assembleia, Inês apresentou uma segunda questão: a coroação",
  "de seu filho Vasco, de apenas 12 anos.",
].join("\n");

const TURN_2 = [
  "Os sinos do centro velho tocaram antes do nascer do sol.",
  "",
  "Não anunciaram morte, ataque ou celebração.",
  "",
  "Convocaram as Casas.",
  "",
  "Quando as grandes portas do Salão Real foram abertas, cada estandarte já ocupava",
  "seu lugar. Representantes de todas as Casas reconhecidas haviam respondido ao chamado de Lady Inês.",
].join("\n");

const TURN_3 = [
  "Alguns passageiros conseguiram sobreviver, mas dezenas morreram era o fim do incêndio do Banco.",
  "",
  "Entre os mortos confirmados estão Lorde Vasco Nosferatu, senhor de Galeria Subterrânea;",
  "Solano Brujah, líder da Clã Brujah; Tico do Ravnos, comandante da delegação de fora da cidade;",
  "Conde Lucien de Montclair, representante de Ouro; e Prior Severin, uma das",
  "principais vozes da Corte do Sangue.",
].join("\n");

const CHRONICLE = [TURN_1, TURN_2, TURN_3].join("\n\n");

describe("isDeadInChronicle", () => {
  it("reconhece todos os mortos da incêndio do Banco", () => {
    for (const name of [
      "Lorde Vasco Nosferatu",
      "Solano Brujah",
      "Tico do Ravnos",
      "Conde Lucien de Montclair",
      "Prior Severin",
    ]) {
      expect(isDeadInChronicle(name, CHRONICLE), name).toBe(true);
    }
  });

  /**
   * O caso que a geração por IA errou. Inês é a regente: aparece em todos os
   * turnos, e os turnos 1 e 2 mencionam morte a menos de 200 caracteres do nome
   * dela sem que nada disso seja sobre ela.
   */
  it("mantém Lady Inês viva apesar da morte mencionada por perto", () => {
    expect(isDeadInChronicle("Inês do Vale", TURN_1)).toBe(false);
    expect(isDeadInChronicle("Inês do Vale", TURN_2)).toBe(false);
    expect(isDeadInChronicle("Inês do Vale", CHRONICLE)).toBe(false);
  });

  // Procurar pelo sobrenome mataria a Casa inteira junto com o líder.
  it("não mata parentes homônimos do morto", () => {
    expect(isDeadInChronicle("Selim Brujah", CHRONICLE)).toBe(false);
    expect(isDeadInChronicle("Borin Nosferatu", CHRONICLE)).toBe(false);
  });

  it("ignora títulos ao identificar a pessoa", () => {
    expect(isDeadInChronicle("Vasco", CHRONICLE)).toBe(true);
    expect(isDeadInChronicle("Lady", CHRONICLE)).toBe(false);
  });

  it("é indiferente a acento e caixa", () => {
    expect(isDeadInChronicle("VÁSCO ARANHA", CHRONICLE)).toBe(true);
  });

  it("não morre ninguém sem crônica", () => {
    expect(isDeadInChronicle("Solano Brujah", "")).toBe(false);
    expect(isDeadInChronicle("", CHRONICLE)).toBe(false);
  });
});
