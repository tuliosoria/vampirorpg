import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listCla, saveCla, removeCla } from "./claRoutes";
import type { Deps } from "./publicRoutes";
import * as auth from "../auth/adminAuth";
import * as db from "../db/canonFichas";
import * as canon from "../canon/aplicar";
import { fichaVazia, SEATS, limparCanonAplicado } from "@vampiro/content";

const deps = () => ({ doc: {} as never, config: { tableName: "t", campaignId: "cidade-noturna" } } as unknown as Deps);
const req = (body: unknown) => ({ method: "POST", path: "/", headers: {}, body, pathParams: {} }) as never;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(auth, "requireAdmin").mockReturnValue(undefined as never);
  vi.spyOn(db, "putClaFicha").mockImplementation(async (_d, _t, _c, f) => f);
  vi.spyOn(db, "deleteClaFicha").mockResolvedValue(undefined);
  vi.spyOn(canon, "invalidarCanon").mockImplementation(() => undefined);
});
afterEach(limparCanonAplicado);

describe("listCla", () => {
  it("devolve as fichas cadastradas, sem exigir sessão", async () => {
    vi.spyOn(db, "listClaFichas").mockResolvedValue([fichaVazia("cla-ventrue", "Clã Ventrue")]);
    const res = await listCla(deps(), req(undefined));
    expect(res.status).toBe(200);
    expect((res.body as { fichas: unknown[] }).fichas).toHaveLength(1);
  });
});

describe("saveCla", () => {
  it("deriva a chave do nome quando o Narrador não dá uma", async () => {
    const res = await saveCla(deps(), req({ name: "Clã Ventrue" }));
    expect((res.body as { key: string }).key).toBe("cla-ventrue");
  });

  /**
   * Renomear não pode reescrever a chave: relações, cartas e imagens já
   * gravadas apontam para ela, e todas passariam a apontar para um clã que
   * deixou de existir.
   */
  it("respeita a chave enviada, mesmo quando o nome mudou", async () => {
    const res = await saveCla(deps(), req({ key: "cla-ventrue", name: "Os Reis de Concreto" }));
    expect(res.body).toMatchObject({ key: "cla-ventrue", name: "Os Reis de Concreto" });
  });

  it("recusa clã sem nome", async () => {
    await expect(saveCla(deps(), req({ name: "   " }))).rejects.toMatchObject({ status: 400 });
  });

  it("recusa chave com caractere que não vive numa URL", async () => {
    await expect(saveCla(deps(), req({ key: "Clã Ventrue!", name: "x" }))).rejects.toMatchObject({ status: 400 });
  });

  it("guarda a coordenada e limpa lugares em branco", async () => {
    const res = await saveCla(deps(), req({
      name: "Clã Nosferatu", refugio: " Galeria ", outrosLugares: ["Cais Velho", "  ", ""], x: 740, y: 520,
    }));
    expect(res.body).toMatchObject({ refugio: "Galeria", outrosLugares: ["Cais Velho"], x: 740, y: 520 });
  });

  // Uma coordenada que não é número viraria NaN e contaminaria toda distância
  // que passasse por ela, sem nunca lançar erro.
  it("cai no centro do mapa quando a coordenada não é número", async () => {
    const res = await saveCla(deps(), req({ name: "Clã Brujah", x: "muito longe", y: null }));
    expect(res.body).toMatchObject({ x: 768, y: 512 });
  });

  it("derruba o cache do cânone para o Narrador ver o que salvou", async () => {
    await saveCla(deps(), req({ name: "Clã Ventrue" }));
    expect(canon.invalidarCanon).toHaveBeenCalled();
  });

  it("exige sessão de Narrador", async () => {
    vi.spyOn(auth, "requireAdmin").mockImplementation(() => { throw new Error("sem sessão"); });
    await expect(saveCla(deps(), req({ name: "Clã Ventrue" }))).rejects.toThrow();
  });
});

describe("removeCla", () => {
  it("apaga pela chave e derruba o cache", async () => {
    const res = await removeCla(deps(), req({ key: "cla-ventrue" }));
    expect(res.status).toBe(204);
    expect(db.deleteClaFicha).toHaveBeenCalledWith(expect.anything(), "t", "cidade-noturna", "cla-ventrue");
    expect(canon.invalidarCanon).toHaveBeenCalled();
  });

  it("recusa apagar sem dizer qual", async () => {
    await expect(removeCla(deps(), req({}))).rejects.toMatchObject({ status: 400 });
  });
});

describe("o mundo que o Narrador escreve chega ao motor", () => {
  it("uma ficha salva vira domínio no mapa depois de aplicada", async () => {
    const { aplicarCanon } = await import("@vampiro/content");
    const salva = await saveCla(deps(), req({ name: "Clã Ventrue", refugio: "Banco Providência", x: 700, y: 500 }));
    aplicarCanon([salva.body as never]);
    expect(SEATS.map((s) => s.key)).toEqual(["cla-ventrue"]);
  });
});
