import { describe, it, expect, afterEach } from "vitest";
import { SEATS, distanceKm, seatOf } from "../diplomacy/geography.js";
import { LEADER_PERSONAS } from "../diplomacy/leaders.js";
import { HOUSE_CHARACTERS, houseRoster } from "../lore/characters.js";
import { HOUSE_PROFILE, houseProfileFor } from "../lore/houseProfile.js";
import { HOUSE_CANON } from "../lore/houseCanon.js";
import { addressableNpcs } from "../npc/codex.js";
import { aplicarCanon, chaveDeCla, fichaVazia, limparCanonAplicado, type ClaFicha } from "./fichas.js";

afterEach(limparCanonAplicado);

function cla(over: Partial<ClaFicha> = {}): ClaFicha {
  return { ...fichaVazia("cla-ventrue", "Clã Ventrue"), refugio: "Banco Providência", x: 700, y: 500, ...over };
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

  // Uma ficha só alimenta cinco constantes; era esse espalhamento que obrigava
  // quem inventasse uma Casa no Valdren a lembrar de cinco arquivos.
  it("distribui líder, elenco, perfil e dossiê pelas constantes do motor", () => {
    aplicarCanon([
      cla({
        lider: {
          leaderName: "Vasco Aranha", title: "Príncipe", temperament: "paciente",
          speechStyle: "Frases curtas.", wants: "Que lhe devam.", refuses: "Perdoar em público.",
          crownStance: "É a corte.", interests: "Comprar dívida.",
        },
        elenco: [{ name: "Inês do Vale", role: "Carniçal", description: "Assina o que ele não pode.", wants: "O Abraço.", hides: "Que ouviu não." }],
        perfil: { wealth: "Dinheiro velho.", resources: "Bancos; falta-lhe silêncio.", soldiers: "Alugados.", control: "Pela dívida." },
        dossie: {
          name: "Clã Ventrue", population: 150000, region: "Centro velho.", mainCity: "Banco Providência",
          society: "Gente de catraca.", military: "Segurança privada.",
          sustainableTroops: 40, emergencyTroops: 120, demographicPressure: "O centro esvazia à noite.",
        },
      }),
    ]);

    expect(LEADER_PERSONAS["cla-ventrue"].leaderName).toBe("Vasco Aranha");
    expect(houseRoster("cla-ventrue")[0].name).toBe("Inês do Vale");
    expect(houseProfileFor("cla-ventrue")?.resources).toMatch(/falta-lhe silêncio/);
    expect(HOUSE_CANON["cla-ventrue"].population).toBe(150000);
  });

  // O que faz o site parecer vivo: cadastrar um clã com líder basta para ele
  // virar destinatário de carta, sem nenhum outro passo.
  it("um clã com líder já é endereçável por carta", () => {
    aplicarCanon([
      cla({
        lider: {
          leaderName: "Vasco Aranha", title: "Príncipe", temperament: "", speechStyle: "",
          wants: "", refuses: "", crownStance: "", interests: "",
        },
      }),
    ]);
    expect(addressableNpcs().map((n) => n.name)).toContain("Vasco Aranha");
  });

  it("uma ficha só com nome entra no mapa sem inventar o resto", () => {
    aplicarCanon([fichaVazia("cla-brujah", "Clã Brujah")]);
    expect(seatOf("cla-brujah")?.name).toBe("Clã Brujah");
    expect(LEADER_PERSONAS["cla-brujah"]).toBeUndefined();
    expect(houseRoster("cla-brujah")).toEqual([]);
    expect(houseProfileFor("cla-brujah")).toBeNull();
  });

  /**
   * O erro que este teste existe para impedir: aplicar de novo acumulando.
   * Um clã apagado pelo Narrador precisa sumir do mapa; com `push` incremental
   * ele continuaria recebendo carta e ocupando distância para sempre.
   */
  it("substitui o cânone inteiro, sem deixar fantasma do que foi apagado", () => {
    aplicarCanon([cla(), cla({ key: "cla-toreador", name: "Clã Toreador" })]);
    expect(SEATS).toHaveLength(2);

    aplicarCanon([cla()]);
    expect(SEATS.map((s) => s.key)).toEqual(["cla-ventrue"]);
    expect(seatOf("cla-toreador")).toBeNull();
    expect(LEADER_PERSONAS["cla-toreador"]).toBeUndefined();
  });

  it("aplicar lista vazia devolve a crônica ao estado de estreia", () => {
    aplicarCanon([cla()]);
    aplicarCanon([]);
    expect(SEATS).toHaveLength(0);
    expect(Object.keys(HOUSE_CHARACTERS)).toHaveLength(0);
    expect(Object.keys(HOUSE_PROFILE)).toHaveLength(0);
  });
});
