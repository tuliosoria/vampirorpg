import { describe, it, expect } from "vitest";
import { recommendStarterCards } from "./starterCards.js";
import type { House } from "./types.js";
import type { ProjectTemplate } from "./projects.js";

function house(over: Partial<House> = {}): House {
  return {
    houseId: "h", name: "Personagem", motto: "", emblem: { icon: "corvo", color1: "#000", color2: "#111" },
    leaderName: "", heirName: "", castleName: "", townsText: "", historyText: "",
    specialty: "", weakness: "", attributes: { riqueza: 2, recursos: 2, soldados: 2, controle: 2 },
    createdAt: "",
    ...over,
  };
}

function carta(id: string, title: string, description = "", over: Partial<ProjectTemplate> = {}): ProjectTemplate {
  return {
    id,
    title,
    description,
    category: "SOCIETY",
    durationTurns: 1,
    costs: [],
    requirements: [],
    completionEffects: { attributeChanges: [], favors: [], assets: [], qualitativeEffects: [], unlocks: [] },
    ...over,
  } as ProjectTemplate;
}

/**
 * Um catálogo inventado. O de verdade é escrito pelo Narrador na interface, e
 * a recomendação não pode conhecer nenhuma carta pelo id — só casar palavras.
 */
const CATALOGO = [
  carta("comprar-o-delegado", "Comprar o delegado", "Influência sobre a polícia do bairro.", {
    completionEffects: { attributeChanges: [{ attribute: "recursos", amount: 1, permanent: true }], favors: [], assets: [], qualitativeEffects: [], unlocks: [] },
  }),
  carta("abrir-uma-boate", "Abrir uma boate", "Um rebanho que vem sozinho, toda noite."),
  carta("selar-o-refugio", "Selar o refúgio", "Nada entra enquanto o sol estiver alto.", {
    completionEffects: { attributeChanges: [{ attribute: "soldados", amount: 1, permanent: true }], favors: [], assets: [], qualitativeEffects: [], unlocks: [] },
  }),
  carta("financiar-uma-galeria", "Financiar uma galeria", "Arte, dinheiro e gente que fala demais."),
  carta("plantar-um-carnical", "Plantar um carniçal no fórum", "Um juiz que assina o que for preciso."),
  carta("mapear-os-tuneis", "Mapear os túneis", "Saber por onde a cidade respira."),
  carta("herdar-um-cartorio", "Herdar um cartório", "Papel velho decide quem é dono de quê."),
  carta("abrir-um-necroterio", "Abrir um necrotério", "O corpo some antes da pergunta."),
  carta("comprar-a-radio", "Comprar a rádio local", "A versão dos fatos, das dez à meia-noite."),
];

describe("recommendStarterCards", () => {
  it("não recomenda nada enquanto o Narrador não escreveu carta nenhuma", () => {
    expect(recommendStarterCards(house({ specialty: "Dinheiro" }), [])).toEqual([]);
  });

  it("devolve no máximo oito cartas, sem repetir", () => {
    const cards = recommendStarterCards(house({ specialty: "refúgio" }), CATALOGO);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(8);
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("puxa a carta cujo texto casa com a especialidade", () => {
    const ids = recommendStarterCards(house({ specialty: "Túneis e o que passa por eles" }), CATALOGO).map((c) => c.id);
    expect(ids[0]).toBe("mapear-os-tuneis");
  });

  it("ignora acento e caixa ao casar", () => {
    const ids = recommendStarterCards(house({ specialty: "REFUGIO" }), CATALOGO).map((c) => c.id);
    expect(ids[0]).toBe("selar-o-refugio");
  });

  it("não casa por pedaço curto demais para significar alguma coisa", () => {
    // "de" e "o" casariam em quase toda carta e a recomendação viraria ruído.
    const semTema = recommendStarterCards(house({ specialty: "de o a" }), CATALOGO).map((c) => c.id);
    const vazio = recommendStarterCards(house({ specialty: "" }), CATALOGO).map((c) => c.id);
    expect(semTema).toEqual(vazio);
  });

  it("cai no atributo mais alto quando a especialidade não diz nada", () => {
    const ids = recommendStarterCards(
      house({ specialty: "", attributes: { riqueza: 1, recursos: 1, soldados: 5, controle: 1 } }),
      CATALOGO,
    ).map((c) => c.id);
    expect(ids[0]).toBe("selar-o-refugio");
  });

  it("é determinística: a mesma entrada dá a mesma saída", () => {
    const a = recommendStarterCards(house({ specialty: "boate" }), CATALOGO).map((c) => c.id);
    const b = recommendStarterCards(house({ specialty: "boate" }), CATALOGO).map((c) => c.id);
    expect(a).toEqual(b);
  });
});
