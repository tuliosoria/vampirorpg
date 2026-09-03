import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEstudio, getEstudioPublico, salvarItem, removerItem, salvarCidade } from "./estudioRoutes";
import type { Deps } from "./publicRoutes";
import * as auth from "../auth/adminAuth";
import * as db from "../db/estudio";
import * as clasDb from "../db/canonFichas";
import * as canon from "../canon/aplicar";
import { fichaVazia, type Bairro, type Conto, type Local, type Personagem, type Trama } from "@vampiro/content";

const SEGREDO = "ISTO_NUNCA_PODE_VAZAR";

const deps = () => ({ doc: {} as never, config: { tableName: "t", campaignId: "cidade-noturna" } } as unknown as Deps);
const req = (body: unknown, pathParams: Record<string, string> = {}) =>
  ({ method: "POST", path: "/", headers: {}, body, pathParams }) as never;

const bairro: Bairro = {
  id: "centro-velho", nome: "Centro Velho", descricao: "Prédios dos anos trinta.",
  atmosfera: "decadente", segredos: `Três entradas. ${SEGREDO}`, atualizadoEm: "",
};
const personagem: Personagem = {
  id: "vasco-aranha", nome: "Vasco Aranha", historia: "Abraçado em 1908.",
  tipo: "VAMPIRO", claKey: "cla-ventrue", respondePeloCla: true, bairroId: "centro-velho",
  voz: {
    titulo: "Príncipe", temperamento: "paciente", comoFala: "Frases curtas.",
    oQueQuer: "Que lhe devam.", oQueRecusa: "Perdoar.", posturaComACorte: "É a corte.", interesses: "Dívida.",
  },
  poder: "ALTO", objetivos: `Quer o porto. ${SEGREDO}`,
  relacoes: [{ paraId: "rala", tipo: "INIMIGO", descricao: `Ela sabe. ${SEGREDO}` }],
  atualizadoEm: "",
};
const local: Local = {
  id: "banco", nome: "Banco Providência", bairroId: "centro-velho",
  descricao: "Fachada de 1911.", segredos: `Andar oculto. ${SEGREDO}`,
  personagemIds: ["vasco-aranha"], tramaIds: [], atualizadoEm: "",
};
const tramaVisivel: Trama = {
  id: "a-divida", nome: "A dívida do porto", importancia: "PRINCIPAL", estado: "ATIVA",
  visivel: true, descricaoPublica: "Alguém compra as dívidas do cais.",
  verdadeDoMestre: `É o Príncipe. ${SEGREDO}`,
  personagens: [{ personagemId: "vasco-aranha", papel: `conspirador ${SEGREDO}` }],
  localIds: ["banco"], atualizadoEm: "",
};
const tramaOculta: Trama = { ...tramaVisivel, id: "oculta", nome: `O que dorme ${SEGREDO}`, visivel: false };
const contoPublico: Conto = {
  id: "incendio", titulo: "O incêndio de 1987", historia: "Durou até o amanhecer.",
  tipo: "EVENTO", visibilidade: "PUBLICO", periodo: "1987", atualizadoEm: "",
};
const contoOculto: Conto = { ...contoPublico, id: "quem", titulo: `Quem acendeu ${SEGREDO}`, visibilidade: "MESTRE" };

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(auth, "requireAdmin").mockReturnValue(undefined as never);
  vi.spyOn(canon, "invalidarCanon").mockImplementation(() => undefined);
  vi.spyOn(db, "gravar").mockImplementation(async (_d, _t, _c, _col, item) => item as never);
  vi.spyOn(db, "remover").mockResolvedValue(undefined);
  vi.spyOn(db, "gravarCidade").mockImplementation(async (_d, _t, _c, cidade) => cidade);
  vi.spyOn(db, "lerCidade").mockResolvedValue({
    nome: "São Paulo", descricao: "Vinte milhões.", segredos: `A prefeitura sabe. ${SEGREDO}`, atualizadoEm: "",
  });
  vi.spyOn(clasDb, "listClaFichas").mockResolvedValue([
    { ...fichaVazia("cla-ventrue", "Clã Ventrue"), segredos: `O cofre. ${SEGREDO}` },
  ]);
  vi.spyOn(db, "listar").mockImplementation(async (_d, _t, _c, colecao) => {
    const porColecao: Record<string, unknown[]> = {
      bairros: [bairro], personagens: [personagem], locais: [local],
      tramas: [tramaVisivel, tramaOculta], contos: [contoPublico, contoOculto],
    };
    return (porColecao[colecao] ?? []) as never;
  });
});
afterEach(() => vi.restoreAllMocks());

/**
 * O critério de aceite 13, provado onde importa: na rota.
 *
 * As projeções já têm o próprio teste, mas ele não garante que a rota as chame.
 * Este chama a rota de verdade e varre o JSON inteiro atrás do marcador — se
 * alguém acrescentar uma entidade ao Estúdio e esquecer de projetá-la, cai aqui.
 */
describe("a rota pública não vaza segredo nenhum", () => {
  it("nenhum campo do Mestre atravessa /api/estudio/publico", async () => {
    const res = await getEstudioPublico(deps(), req(undefined));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain(SEGREDO);
  });

  it("mas o que é público continua chegando", async () => {
    const body = (await getEstudioPublico(deps(), req(undefined))).body as Record<string, never>;
    expect(JSON.stringify(body)).toContain("Vinte milhões");
    expect(JSON.stringify(body)).toContain("Vasco Aranha");
    expect(JSON.stringify(body)).toContain("Fachada de 1911");
  });

  it("a trama oculta e o conto do Mestre somem da lista", async () => {
    const body = (await getEstudioPublico(deps(), req(undefined))).body as {
      tramas: { id: string }[]; contos: { id: string }[];
    };
    expect(body.tramas.map((t) => t.id)).toEqual(["a-divida"]);
    expect(body.contos.map((c) => c.id)).toEqual(["incendio"]);
  });

  it("a porta do Narrador devolve tudo, inclusive o que a pública esconde", async () => {
    const res = await getEstudio(deps(), req(undefined));
    expect(JSON.stringify(res.body)).toContain(SEGREDO);
  });

  it("e ela exige sessão", async () => {
    vi.spyOn(auth, "requireAdmin").mockImplementation(() => { throw new Error("sem sessão"); });
    await expect(getEstudio(deps(), req(undefined))).rejects.toThrow();
  });
});

describe("gravar item", () => {
  it("deriva o id do nome na criação", async () => {
    const res = await salvarItem(deps(), req({ nome: "Centro Velho" }, { colecao: "bairros" }));
    expect((res.body as { id: string }).id).toBe("centro-velho");
  });

  // Renomear não pode reescrever o id: locais, tramas e relações apontam para
  // ele, e todas passariam a apontar para alguém que deixou de existir.
  it("respeita o id enviado quando o nome muda", async () => {
    const res = await salvarItem(deps(), req({ id: "centro-velho", nome: "Baixo Centro" }, { colecao: "bairros" }));
    expect(res.body).toMatchObject({ id: "centro-velho", nome: "Baixo Centro" });
  });

  it("recusa item sem nome", async () => {
    await expect(salvarItem(deps(), req({ nome: "  " }, { colecao: "bairros" }))).rejects.toMatchObject({ status: 400 });
  });

  it("recusa coleção que não existe", async () => {
    await expect(salvarItem(deps(), req({ nome: "x" }, { colecao: "inventada" }))).rejects.toMatchObject({ status: 404 });
  });

  it("exige sessão de Narrador para escrever", async () => {
    vi.spyOn(auth, "requireAdmin").mockImplementation(() => { throw new Error("sem sessão"); });
    await expect(salvarItem(deps(), req({ nome: "x" }, { colecao: "bairros" }))).rejects.toThrow();
  });
});

describe("as regras que o formulário não pode garantir sozinho", () => {
  // Guardar clã num lobisomem colocaria um estranho no elenco de um clã na
  // próxima aplicação do cânone.
  it("só vampiro carrega clã", async () => {
    const res = await salvarItem(deps(), req(
      { nome: "Capitã Solano", tipo: "HUMANO", claKey: "cla-ventrue", respondePeloCla: true },
      { colecao: "personagens" },
    ));
    expect(res.body).toMatchObject({ claKey: null, respondePeloCla: false });
  });

  // Uma trama que nasce à mostra por engano estraga o mistério de uma vez.
  it("a trama nasce invisível quando ninguém disse o contrário", async () => {
    const res = await salvarItem(deps(), req({ nome: "Algo" }, { colecao: "tramas" }));
    expect(res.body).toMatchObject({ visivel: false, estado: "IDEIA", importancia: "PEQUENA" });
  });

  it("o conto nasce como do Mestre", async () => {
    const res = await salvarItem(deps(), req({ titulo: "Algo" }, { colecao: "contos" }));
    expect(res.body).toMatchObject({ visibilidade: "MESTRE" });
  });

  it("valor de enum que não existe cai no padrão em vez de entrar cru", async () => {
    const res = await salvarItem(deps(), req({ nome: "x", poder: "DEUS", tipo: "DRAGAO" }, { colecao: "personagens" }));
    expect(res.body).toMatchObject({ poder: "BAIXO", tipo: "HUMANO" });
  });

  it("relação sem destino é descartada", async () => {
    const res = await salvarItem(deps(), req(
      { nome: "x", relacoes: [{ paraId: "", tipo: "ALIADO" }, { paraId: "rala", tipo: "INIMIGO" }] },
      { colecao: "personagens" },
    ));
    expect((res.body as Personagem).relacoes.map((r) => r.paraId)).toEqual(["rala"]);
  });
});

describe("remover", () => {
  it("apaga pelo id e derruba o cache do cânone", async () => {
    const res = await removerItem(deps(), req({ id: "centro-velho" }, { colecao: "bairros" }));
    expect(res.status).toBe(204);
    expect(db.remover).toHaveBeenCalledWith(expect.anything(), "t", "cidade-noturna", "bairros", "centro-velho");
    expect(canon.invalidarCanon).toHaveBeenCalled();
  });

  it("recusa apagar sem dizer qual", async () => {
    await expect(removerItem(deps(), req({}, { colecao: "bairros" }))).rejects.toMatchObject({ status: 400 });
  });
});

describe("cidade", () => {
  it("grava nome, descrição e segredos", async () => {
    const res = await salvarCidade(deps(), req({ nome: "São Paulo", descricao: "d", segredos: "s" }));
    expect(res.body).toMatchObject({ nome: "São Paulo", descricao: "d", segredos: "s" });
  });

  it("recusa cidade sem nome", async () => {
    await expect(salvarCidade(deps(), req({ descricao: "d" }))).rejects.toMatchObject({ status: 400 });
  });
});
