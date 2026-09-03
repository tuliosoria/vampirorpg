import { describe, it, expect } from "vitest";
import { leaderIsDead } from "./succession";

// Trecho real do resultado do turno 3.
const CHRONICLE = `## Turno 3
O navio afundou. Alguns passageiros conseguiram sobreviver, mas dezenas morreram.
Entre os mortos confirmados estão Lorde Vasco Nosferatu, senhor de Galeria Subterrânea;
Solano Brujah, líder da Clã Brujah; Tico do Ravnos, comandante da delegação.

## Turno 4
Lady Elira Gangrel enviou mensageiros pedindo grãos ao sul.`;

describe("leaderIsDead", () => {
  it("reconhece um líder na lista de mortos confirmados", () => {
    // As personas nascem do wiki, anterior à crise. Sem esta checagem, Brujah
    // assinaria cartas com o nome de quem afundou com a incêndio do Banco.
    expect(leaderIsDead("Solano Brujah", CHRONICLE)).toBe(true);
    expect(leaderIsDead("Lorde Vasco Nosferatu", CHRONICLE)).toBe(true);
  });

  it("não mata quem só é mencionado", () => {
    expect(leaderIsDead("Lady Elira Gangrel", CHRONICLE)).toBe(false);
  });

  it("não confunde a Casa com a pessoa", () => {
    // "Brujah" nomeia a Casa inteira; só o nome próprio identifica alguém.
    expect(leaderIsDead("Corva Nera Quatro-Estradas", CHRONICLE)).toBe(false);
  });

  it("ignora títulos ao procurar o nome", () => {
    expect(leaderIsDead("Lorde Vasco Nosferatu", CHRONICLE)).toBe(true);
  });

  it("aguenta crônica vazia e nome vazio", () => {
    expect(leaderIsDead("Solano Brujah", "")).toBe(false);
    expect(leaderIsDead("", CHRONICLE)).toBe(false);
  });

  it("não marca morte quando a palavra está em outra frase", () => {
    // Janela de caracteres errava aqui: a lista de mortos de um parágrafo
    // contaminava o nome do parágrafo seguinte.
    const other = "Solano Brujah assinou o tratado. Muitos morreram no norte.";
    expect(leaderIsDead("Solano Brujah", other)).toBe(false);
  });

  it("reconhece a lista de mortos separada por ponto e vírgula", () => {
    // É como o cânone escreve: uma frase só, vários nomes.
    const list = "Entre os mortos confirmados estão Lorde Vasco Nosferatu; Solano Brujah; Tico do Ravnos.";
    expect(leaderIsDead("Tico do Ravnos", list)).toBe(true);
  });
});
