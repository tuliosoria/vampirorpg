import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { houseProfileFor, emptyHouseRelation } from "@vampiro/content";
import { complementaridade, planOutreach, outreachTone, faltas, sobras, type OutreachInput } from "./outreach";
import { semearCanon, limparCanon } from "@vampiro/content/test-fixtures";

beforeEach(semearCanon);
afterEach(limparCanon);

const base: OutreachInput = {
  players: [
    { houseId: "ventrue-wxey", name: "Ventrue", seatKey: "cla-ventrue" },
    { houseId: "nosferatu-k0hc", name: "Nosferatu", seatKey: "cla-nosferatu" },
    { houseId: "toreador-g0gg", name: "Toreador", seatKey: "cla-toreador" },
  ],
  playerSeatKeys: new Set(["cla-ventrue", "cla-nosferatu", "cla-toreador"]),
  relations: [],
  publicEvent: "",
  lastOrders: {},
  alreadyTalking: new Set(),
  limit: 3,
};

describe("complementaridade", () => {
  // O caso que originou tudo: os Ventrue não têm quem ande sem ser visto, e os
  // Nosferatu têm silêncio de sobra. É esse encaixe que dá motivo para escrever.
  it("acha o silêncio que falta aos Ventrue na sobra dos Nosferatu", () => {
    const encaixe = complementaridade(houseProfileFor("cla-ventrue"), houseProfileFor("cla-nosferatu"));
    expect(encaixe.join(" ")).toMatch(/silêncio/);
  });

  it("acha o encaixe no sentido contrário também", () => {
    const encaixe = complementaridade(houseProfileFor("cla-nosferatu"), houseProfileFor("cla-ventrue"));
    expect(encaixe.join(" ")).toMatch(/dinheiro/);
  });

  it("não inventa encaixe quando falta a mesma coisa aos dois", () => {
    const encaixe = complementaridade(houseProfileFor("cla-ventrue"), houseProfileFor("cla-ventrue"));
    expect(encaixe).toEqual([]);
  });

  it("devolve vazio sem perfil", () => {
    expect(complementaridade(null, houseProfileFor("cla-ventrue"))).toEqual([]);
    expect(complementaridade(houseProfileFor("cla-ventrue"), null)).toEqual([]);
  });
});

describe("planOutreach", () => {
  it("entrega o número pedido de cartas", () => {
    const planos = planOutreach({ ...base, publicEvent: "A Marcha partiu." });
    expect(planos).toHaveLength(3);
  });

  it("nunca faz uma Casa de jogador escrever — quem escreve é NPC", () => {
    const planos = planOutreach({ ...base, publicEvent: "A Marcha partiu." });
    for (const p of planos) expect(base.playerSeatKeys.has(p.fromSeatKey)).toBe(false);
  });

  // Três cartas num jogador e nenhuma nos outros faria um abrir o turno com
  // correspondência e os outros com silêncio.
  it("espalha as cartas entre os jogadores", () => {
    const planos = planOutreach({ ...base, publicEvent: "A Marcha partiu." });
    expect(new Set(planos.map((p) => p.toHouseId)).size).toBe(3);
  });

  it("prefere escassez concreta a motivo genérico", () => {
    const planos = planOutreach({ ...base, publicEvent: "A Marcha partiu." });
    expect(planos[0].kind).toBe("ESCASSEZ");
    expect(planos[0].motive).toMatch(/precisa de/);
  });

  it("não escreve para quem já está em conversa viva no turno", () => {
    const planos = planOutreach({
      ...base,
      publicEvent: "A Marcha partiu.",
      alreadyTalking: new Set(base.players.map((p) => `${p.houseId}~cla-brujah`)),
    });
    expect(planos.every((p) => p.fromSeatKey !== "cla-brujah")).toBe(true);
  });

  it("sem evento e sem ordens, ainda acha motivo pela escassez", () => {
    const planos = planOutreach(base);
    expect(planos.length).toBeGreaterThan(0);
    expect(planos.every((p) => p.kind === "ESCASSEZ")).toBe(true);
  });
});

describe("outreachTone", () => {
  it("traduz a amizade em conduta, não em rótulo", () => {
    const ruim = { ...emptyHouseRelation("a", "b"), amizade: 5 };
    const bom = { ...emptyHouseRelation("a", "b"), amizade: 95 };
    expect(outreachTone(ruim)).toMatch(/frio/);
    expect(outreachTone(bom)).toMatch(/franqueza/);
    expect(outreachTone(null)).toMatch(/mal se conhecem/);
  });
});

describe("vocabulário de mercadorias", () => {
  // Casar frase com frase não funcionava: "O Vale da Coroa dá grão e o rio dá
  // transporte" virava uma string inteira que nunca batia com "falta ferro".
  it("separa o que o clã tem do que lhe falta", () => {
    const ventrue = houseProfileFor("cla-ventrue");
    expect(sobras(ventrue)).toEqual(expect.arrayContaining(["documentos", "influência"]));
    expect(faltas(ventrue)).toContain("silêncio");
  });

  it("não vende o que lhe falta, mesmo citado antes na frase", () => {
    const brujah = houseProfileFor("cla-brujah");
    expect(sobras(brujah)).toContain("território");
    expect(faltas(brujah)).toContain("informação");
    expect(sobras(brujah)).not.toContain("informação");
  });

  it("entende escassez escrita sem a palavra falta", () => {
    // "não produz" marca a mesma virada que "falta".
    expect(faltas({ wealth: "", resources: "Tem o bairro inteiro. Não produz dinheiro nem documentos.", soldiers: "", control: "" }))
      .toEqual(expect.arrayContaining(["dinheiro", "documentos"]));
  });
});

describe("variedade dos remetentes", () => {
  // Três cartas da Coroa no mesmo turno não é o mundo reagindo: é a mesma voz
  // repetida três vezes.
  it("não deixa a mesma Casa escrever duas vezes no turno", () => {
    const planos = planOutreach({ ...base, publicEvent: "A Marcha partiu." });
    expect(new Set(planos.map((p) => p.fromSeatKey)).size).toBe(planos.length);
  });
});
