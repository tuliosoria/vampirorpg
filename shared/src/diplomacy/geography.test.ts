import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  SEATS,
  bandFor,
  budgetBetween,
  distanceKm,
  seatKeyForHouseId,
  seatOf,
  travelDays,
  DISTANCE_BANDS,
} from "./geography.js";
import { semearCanon, limparCanon } from "../test/fixtures.js";

/**
 * O que sobrou de testável aqui é geometria, não geografia.
 *
 * Na Cidade esta suíte conferia as coordenadas das dezesseis sedes contra a
 * tabela do atlas — cânone verificando cânone. A Cidade não tem atlas e nasce
 * sem domínio nenhum, então o que se testa agora é o comportamento das funções
 * diante de dados quaisquer.
 */
beforeEach(semearCanon);
afterEach(limparCanon);

describe("a crônica vazia", () => {
  it("não inventa domínio quando o Narrador ainda não cadastrou nenhum", () => {
    limparCanon();
    expect(SEATS).toHaveLength(0);
    expect(seatOf("cla-ventrue")).toBeNull();
    expect(distanceKm("cla-ventrue", "cla-toreador")).toBeNull();
    expect(budgetBetween("cla-ventrue", "cla-toreador")).toBeNull();
  });
});

describe("seatOf", () => {
  it("encontra o domínio pela chave", () => {
    expect(seatOf("cla-ventrue")?.seat).toBe("Banco Providência");
  });

  it("devolve null para uma chave desconhecida", () => {
    expect(seatOf("cla-que-nao-existe")).toBeNull();
  });
});

describe("distanceKm", () => {
  it("é simétrica", () => {
    expect(distanceKm("cla-ventrue", "cla-toreador")).toBe(distanceKm("cla-toreador", "cla-ventrue"));
  });

  it("dá zero para o mesmo domínio", () => {
    expect(distanceKm("cla-ventrue", "cla-ventrue")).toBe(0);
  });

  it("devolve null para um domínio desconhecido", () => {
    expect(distanceKm("cla-ventrue", "cla-que-nao-existe")).toBeNull();
  });

  it("põe o vizinho mais perto do que o do outro lado da cidade", () => {
    const perto = distanceKm("cla-ventrue", "cla-nosferatu")!;
    const longe = distanceKm("cla-ventrue", "cla-toreador")!;
    expect(perto).toBeLessThan(longe);
  });
});

describe("travelDays", () => {
  it("cresce junto com a distância", () => {
    const perto = travelDays("cla-ventrue", "cla-nosferatu")!;
    const longe = travelDays("cla-ventrue", "cla-toreador")!;
    expect(longe).toBeGreaterThan(perto);
  });

  it("é simétrico, porque o trânsito não sabe quem partiu", () => {
    expect(travelDays("cla-ventrue", "cla-toreador")).toBe(travelDays("cla-toreador", "cla-ventrue"));
  });
});

describe("bandFor", () => {
  it("as faixas cobrem toda a escala sem buraco", () => {
    const vistas = new Set([0, 1, 2, 3, 4, 6, 7, 50].map(bandFor));
    for (const banda of vistas) expect(DISTANCE_BANDS).toContain(banda);
    expect(vistas.size).toBe(DISTANCE_BANDS.length);
  });

  it("nunca melhora de faixa conforme a viagem piora", () => {
    const ordem = DISTANCE_BANDS.map((b) => b as string);
    let anterior = 0;
    for (const dias of [0, 1, 2, 3, 4, 6, 7, 20]) {
      const atual = ordem.indexOf(bandFor(dias));
      expect(atual).toBeGreaterThanOrEqual(anterior);
      anterior = atual;
    }
  });
});

describe("orçamento por distância", () => {
  it("dá mais envios ao vizinho do que a quem está do outro lado", () => {
    const perto = budgetBetween("cla-ventrue", "cla-nosferatu")!;
    const longe = budgetBetween("cla-ventrue", "cla-toreador")!;
    expect(perto.sends).toBeGreaterThanOrEqual(longe.sends);
  });

  it("devolve null quando um dos domínios não existe", () => {
    expect(budgetBetween("cla-ventrue", "cla-que-nao-existe")).toBeNull();
  });
});

describe("seatKeyForHouseId", () => {
  it("alcança o domínio a partir do id sorteado do personagem", () => {
    expect(seatKeyForHouseId("cla-ventrue-k0hc")).toBe("cla-ventrue");
  });

  it("aceita o clã nomeado com e sem o prefixo", () => {
    expect(seatKeyForHouseId("ventrue")).toBe("cla-ventrue");
    expect(seatKeyForHouseId("cla-ventrue")).toBe("cla-ventrue");
  });

  it("aceita o nome onde se esperava o id", () => {
    expect(seatKeyForHouseId("Clã Ventrue")).toBe("cla-ventrue");
    expect(seatKeyForHouseId("Nosferatu")).toBe("cla-nosferatu");
  });

  it("devolve null quando não corresponde a nenhum domínio", () => {
    expect(seatKeyForHouseId("cla-lasombra")).toBeNull();
  });
});
