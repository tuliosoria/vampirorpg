import { describe, it, expect, afterEach } from "vitest";
import { SEATS, distanceKm, seatOf } from "../diplomacy/geography.js";
import { LEADER_PERSONAS } from "../diplomacy/leaders.js";
import { houseRoster } from "../lore/characters.js";
import { houseProfileFor } from "../lore/houseProfile.js";
import { HOUSE_CANON } from "../lore/houseCanon.js";
import { addressableNpcs } from "../npc/codex.js";
import { personagemParaJogador } from "../estudio/projecoes.js";
import type { Personagem } from "../estudio/modelos.js";
import { aplicarCanon, chaveDeCla, fichaVazia, limparCanonAplicado, type ClaFicha } from "./fichas.js";

afterEach(limparCanonAplicado);

function cla(over: Partial<ClaFicha> = {}): ClaFicha {
  return { ...fichaVazia("cla-ventrue", "Clã Ventrue"), refugio: "Banco Providência", x: 700, y: 500, ...over };
}

function personagem(over: Partial<Personagem> = {}): Personagem {
  return {
    id: "vasco-aranha", nome: "Vasco Aranha",
    historia: "Abraçado em 1908, quando o dinheiro do café ainda mandava.",
    tipo: "VAMPIRO", claKey: "cla-ventrue", respondePeloCla: true, bairroId: null,
    voz: {
      titulo: "Príncipe", temperamento: "paciente", comoFala: "Frases curtas.",
      oQueQuer: "Que lhe devam.", oQueRecusa: "Perdoar em público.",
      posturaComACorte: "É a corte.", interesses: "Comprar dívida.",
    },
    poder: "ALTO", objetivos: "Quer o porto de volta.", relacoes: [], atualizadoEm: "",
    ...over,
  };
}

describe("chaveDeCla", () => {
  it("faz slug do nome, sem acento nem caixa", () => {
    expect(chaveDeCla("Clã Ventrue")).toBe("cla-ventrue");
    expect(chaveDeCla("Corte do Sangue")).toBe("corte-do-sangue");
  });
});

describe("aplicarCanon", () => {
  it("põe o clã no mapa com endereço e coordenada", () => {
    aplicarCanon([cla()]);
    expect(seatOf("cla-ventrue")).toMatchObject({ name: "Clã Ventrue", seat: "Banco Providência" });
  });

  it("a distância entre dois clãs sai das coordenadas da ficha", () => {
    aplicarCanon([cla(), cla({ key: "cla-toreador", name: "Clã Toreador", x: 1200, y: 900 })]);
    expect(distanceKm("cla-ventrue", "cla-toreador")).toBeGreaterThan(0);
  });

  it("guarda perfil e dossiê do clã", () => {
    aplicarCanon([cla({
      perfil: { wealth: "Dinheiro velho.", resources: "Bancos; falta-lhe silêncio.", soldiers: "Alugados.", control: "Pela dívida." },
      dossie: {
        name: "Clã Ventrue", population: 150000, region: "Centro velho.", mainCity: "Banco Providência",
        society: "Gente de catraca.", military: "Segurança privada.",
        sustainableTroops: 40, emergencyTroops: 120, demographicPressure: "O centro esvazia à noite.",
      },
    })]);
    expect(houseProfileFor("cla-ventrue")?.resources).toMatch(/falta-lhe silêncio/);
    expect(HOUSE_CANON["cla-ventrue"].population).toBe(150000);
  });
});

/**
 * O elenco deixou de ser digitado dentro do clã e passou a ser derivado. Este
 * bloco é o que garante que a derivação alimenta o motor tão bem quanto o campo
 * embutido alimentava — e melhor, porque não há como as duas versões divergirem.
 */
describe("o elenco vem dos personagens, não da ficha", () => {
  it("um personagem que aponta para o clã entra no elenco dele", () => {
    aplicarCanon([cla()], [personagem({ id: "ines", nome: "Inês do Vale", respondePeloCla: false })]);
    expect(houseRoster("cla-ventrue").map((c) => c.name)).toEqual(["Inês do Vale"]);
  });

  it("quem responde pelo clã vira a voz das cartas", () => {
    aplicarCanon([cla()], [personagem()]);
    expect(LEADER_PERSONAS["cla-ventrue"]).toMatchObject({ leaderName: "Vasco Aranha", title: "Príncipe" });
    expect(addressableNpcs().map((n) => n.name)).toContain("Vasco Aranha");
  });

  // Marcar como líder sem escrever a voz deixaria a IA respondendo como ninguém.
  it("sem voz escrita, o clã continua mudo", () => {
    aplicarCanon([cla()], [personagem({ voz: null })]);
    expect(LEADER_PERSONAS["cla-ventrue"]).toBeUndefined();
    expect(houseRoster("cla-ventrue")).toHaveLength(1);
  });

  it("personagem sem clã não entra em elenco nenhum", () => {
    aplicarCanon([cla()], [personagem({ claKey: null })]);
    expect(houseRoster("cla-ventrue")).toEqual([]);
  });

  // O Narrador apaga um clã e os personagens dele ficam para trás; sem esta
  // guarda eles virariam elenco de um domínio que não existe mais.
  it("personagem que aponta para clã apagado não vira elenco fantasma", () => {
    aplicarCanon([], [personagem()]);
    expect(SEATS).toHaveLength(0);
    expect(houseRoster("cla-ventrue")).toEqual([]);
  });

  /**
   * A prova de que a fronteira do segredo atravessa até aqui: o navegador
   * alimenta o motor com a projeção pública, que não tem objetivos. O mesmo
   * código roda dos dois lados e cada um vê só o que lhe cabe.
   */
  it("o cânone montado no navegador não carrega objetivo nenhum", () => {
    aplicarCanon([cla()], [personagemParaJogador(personagem())]);
    expect(houseRoster("cla-ventrue")[0].wants).toBe("");

    aplicarCanon([cla()], [personagem()]);
    expect(houseRoster("cla-ventrue")[0].wants).toBe("Quer o porto de volta.");
  });
});

describe("substituição, não acúmulo", () => {
  it("um clã apagado some do mapa", () => {
    aplicarCanon([cla(), cla({ key: "cla-toreador", name: "Clã Toreador" })]);
    aplicarCanon([cla()]);
    expect(SEATS.map((s) => s.key)).toEqual(["cla-ventrue"]);
  });

  it("um personagem apagado some do elenco", () => {
    aplicarCanon([cla()], [personagem(), personagem({ id: "ines", nome: "Inês do Vale" })]);
    expect(houseRoster("cla-ventrue")).toHaveLength(2);
    aplicarCanon([cla()], [personagem()]);
    expect(houseRoster("cla-ventrue").map((c) => c.name)).toEqual(["Vasco Aranha"]);
  });

  it("aplicar vazio devolve a crônica ao estado de estreia", () => {
    aplicarCanon([cla()], [personagem()]);
    aplicarCanon([], []);
    expect(SEATS).toHaveLength(0);
    expect(Object.keys(LEADER_PERSONAS)).toHaveLength(0);
  });
});
