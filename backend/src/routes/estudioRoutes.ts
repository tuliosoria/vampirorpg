import {
  ESTADOS_DE_TRAMA, IMPORTANCIAS, NIVEIS_DE_PODER, TIPOS_DE_CONTO, TIPOS_DE_PERSONAGEM,
  TIPOS_DE_RELACAO, VISIBILIDADES, idDe,
  bairroParaJogador, cidadeParaJogador, contosParaJogador, localParaJogador,
  personagemParaJogador, tramasParaJogador,
  type Bairro, type Cidade, type Conto, type Local, type Personagem, type Trama,
} from "@vampiro/content";
import { HttpError, type HandlerRequest, type HandlerResponse } from "../types/domain";
import { generateJson } from "../ai/openai";
import {
  CAMPOS_REVISAVEIS, contextoDoMundo, parseRevisao, pedidoDeRevisao, sistemaDeRevisao,
} from "../ai/estudioRevisao";
import { requireAdmin } from "../auth/adminAuth";
import { gravar, gravarCidade, lerCidade, listar, remover } from "../db/estudio";
import { listClaFichas } from "../db/canonFichas";
import { invalidarCanon } from "../canon/aplicar";
import type { Deps } from "./publicRoutes";

/**
 * O Estúdio: a cosmologia que o Narrador escreve.
 *
 * Duas portas para os mesmos dados, e a diferença entre elas é o ponto inteiro
 * deste módulo. `/api/estudio` exige sessão de Narrador e devolve tudo;
 * `/api/estudio/publico` é aberta e devolve o que passou pela projeção — que é
 * outro tipo, não o mesmo objeto com menos campos.
 */

const COLECOES = ["bairros", "personagens", "locais", "tramas", "contos"] as const;
type Colecao = (typeof COLECOES)[number];

function colecaoDe(req: HandlerRequest): Colecao {
  const c = req.pathParams?.colecao ?? "";
  if (!(COLECOES as readonly string[]).includes(c)) {
    throw new HttpError(404, "NOT_FOUND", "Coleção desconhecida.");
  }
  return c as Colecao;
}

const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const listaDeIds = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];

function umDe<T extends string>(v: unknown, opcoes: readonly T[], padrao: T): T {
  return typeof v === "string" && (opcoes as readonly string[]).includes(v) ? (v as T) : padrao;
}

/**
 * O nome vira o id na criação, e o id nunca muda depois.
 *
 * Renomear não pode reescrever o id: locais, tramas e relações já gravadas
 * apontam para ele, e todas passariam a apontar para alguém que deixou de
 * existir — sem erro, só vínculos silenciosamente quebrados.
 */
function idEstavel(b: Record<string, unknown>, nome: string): string {
  const informado = texto(b.id);
  const id = informado || idDe(nome);
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new HttpError(400, "INVALID_BODY", "O id aceita só letras minúsculas, números e hífen.");
  }
  return id;
}

function exigirNome(v: unknown, campo: string): string {
  const nome = texto(v);
  if (!nome) throw new HttpError(400, "INVALID_BODY", `Campo obrigatório: ${campo}`);
  return nome;
}

function parseBairro(b: Record<string, unknown>): Bairro {
  const nome = exigirNome(b.nome, "nome");
  return {
    id: idEstavel(b, nome), nome,
    descricao: texto(b.descricao), atmosfera: texto(b.atmosfera), segredos: texto(b.segredos),
    atualizadoEm: "",
  };
}

function parsePersonagem(b: Record<string, unknown>): Personagem {
  const nome = exigirNome(b.nome, "nome");
  const tipo = umDe(b.tipo, TIPOS_DE_PERSONAGEM, "HUMANO");
  const voz = b.voz && typeof b.voz === "object" ? (b.voz as Record<string, unknown>) : null;
  return {
    id: idEstavel(b, nome), nome,
    historia: texto(b.historia),
    tipo,
    // Clã só faz sentido em quem é vampiro. Guardar a chave num lobisomem
    // colocaria um estranho no elenco de um clã na próxima aplicação do cânone.
    claKey: tipo === "VAMPIRO" ? texto(b.claKey) || null : null,
    respondePeloCla: tipo === "VAMPIRO" && b.respondePeloCla === true,
    bairroId: texto(b.bairroId) || null,
    voz: voz
      ? {
          titulo: texto(voz.titulo), temperamento: texto(voz.temperamento),
          comoFala: texto(voz.comoFala), oQueQuer: texto(voz.oQueQuer),
          oQueRecusa: texto(voz.oQueRecusa), posturaComACorte: texto(voz.posturaComACorte),
          interesses: texto(voz.interesses),
        }
      : null,
    poder: umDe(b.poder, NIVEIS_DE_PODER, "BAIXO"),
    objetivos: texto(b.objetivos),
    relacoes: Array.isArray(b.relacoes)
      ? b.relacoes
          .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
          .map((r) => ({
            paraId: texto(r.paraId),
            tipo: umDe(r.tipo, TIPOS_DE_RELACAO, "OUTRO"),
            descricao: texto(r.descricao),
          }))
          .filter((r) => r.paraId)
      : [],
    atualizadoEm: "",
  };
}

function parseLocal(b: Record<string, unknown>): Local {
  const nome = exigirNome(b.nome, "nome");
  return {
    id: idEstavel(b, nome), nome,
    bairroId: texto(b.bairroId) || null,
    descricao: texto(b.descricao), segredos: texto(b.segredos),
    personagemIds: listaDeIds(b.personagemIds), tramaIds: listaDeIds(b.tramaIds),
    atualizadoEm: "",
  };
}

function parseTrama(b: Record<string, unknown>): Trama {
  const nome = exigirNome(b.nome, "nome");
  return {
    id: idEstavel(b, nome), nome,
    importancia: umDe(b.importancia, IMPORTANCIAS, "PEQUENA"),
    estado: umDe(b.estado, ESTADOS_DE_TRAMA, "IDEIA"),
    // O padrão é invisível. Uma trama que nasce à mostra por engano estraga o
    // mistério de uma vez, e não há como desestragar.
    visivel: b.visivel === true,
    descricaoPublica: texto(b.descricaoPublica),
    verdadeDoMestre: texto(b.verdadeDoMestre),
    personagens: Array.isArray(b.personagens)
      ? b.personagens
          .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
          .map((p) => ({ personagemId: texto(p.personagemId), papel: texto(p.papel) }))
          .filter((p) => p.personagemId)
      : [],
    localIds: listaDeIds(b.localIds),
    atualizadoEm: "",
  };
}

function parseConto(b: Record<string, unknown>): Conto {
  const titulo = exigirNome(b.titulo, "titulo");
  return {
    id: idEstavel(b, titulo), titulo,
    historia: texto(b.historia),
    tipo: umDe(b.tipo, TIPOS_DE_CONTO, "HISTORIA"),
    visibilidade: umDe(b.visibilidade, VISIBILIDADES, "MESTRE"),
    periodo: texto(b.periodo),
    atualizadoEm: "",
  };
}

const PARSERS: Record<Colecao, (b: Record<string, unknown>) => { id: string; atualizadoEm: string }> = {
  bairros: parseBairro,
  personagens: parsePersonagem,
  locais: parseLocal,
  tramas: parseTrama,
  contos: parseConto,
};

const CIDADE_VAZIA: Cidade = { nome: "", descricao: "", segredos: "", atualizadoEm: "" };

async function tudo(deps: Deps) {
  const { doc, config } = deps;
  const [cidade, bairros, personagens, locais, tramas, contos, clas] = await Promise.all([
    lerCidade(doc, config.tableName, config.campaignId),
    listar<Bairro>(doc, config.tableName, config.campaignId, "bairros"),
    listar<Personagem>(doc, config.tableName, config.campaignId, "personagens"),
    listar<Local>(doc, config.tableName, config.campaignId, "locais"),
    listar<Trama>(doc, config.tableName, config.campaignId, "tramas"),
    listar<Conto>(doc, config.tableName, config.campaignId, "contos"),
    listClaFichas(doc, config.tableName, config.campaignId),
  ]);
  return { cidade: cidade ?? CIDADE_VAZIA, bairros, personagens, locais, tramas, contos, clas };
}

/** Tudo, cru. Só para quem tem sessão de Narrador. */
export async function getEstudio(deps: Deps, req: HandlerRequest): Promise<HandlerResponse> {
  requireAdmin(deps.config, req);
  return { status: 200, body: await tudo(deps) };
}

/**
 * O que o site mostra a quem não é Narrador.
 *
 * Cada lista passa pela projeção correspondente, e o tipo do que sai daqui não
 * declara os campos secretos — devolver o objeto cru não compila. Os clãs
 * perdem os segredos pelo mesmo caminho.
 */
export async function getEstudioPublico(deps: Deps, _req: HandlerRequest): Promise<HandlerResponse> {
  const t = await tudo(deps);
  return {
    status: 200,
    body: {
      cidade: cidadeParaJogador(t.cidade),
      bairros: t.bairros.map(bairroParaJogador),
      personagens: t.personagens.map(personagemParaJogador),
      locais: t.locais.map(localParaJogador),
      tramas: tramasParaJogador(t.tramas),
      contos: contosParaJogador(t.contos),
      clas: t.clas.map(({ segredos: _segredos, ...publico }) => publico),
    },
  };
}

export async function salvarItem(deps: Deps, req: HandlerRequest): Promise<HandlerResponse> {
  requireAdmin(deps.config, req);
  const colecao = colecaoDe(req);
  const item = PARSERS[colecao]((req.body ?? {}) as Record<string, unknown>);
  const gravado = await gravar(deps.doc, deps.config.tableName, deps.config.campaignId, colecao, item);
  // Personagem alimenta o elenco e a voz dos clãs; sem derrubar o cache o
  // Narrador salvaria e continuaria vendo o mundo de meio minuto atrás.
  invalidarCanon();
  return { status: 200, body: gravado };
}

export async function removerItem(deps: Deps, req: HandlerRequest): Promise<HandlerResponse> {
  requireAdmin(deps.config, req);
  const colecao = colecaoDe(req);
  const id = texto((req.body as { id?: unknown })?.id);
  if (!id) throw new HttpError(400, "INVALID_BODY", "Campo obrigatório: id");
  await remover(deps.doc, deps.config.tableName, deps.config.campaignId, colecao, id);
  invalidarCanon();
  return { status: 204, body: undefined };
}

export async function salvarCidade(deps: Deps, req: HandlerRequest): Promise<HandlerResponse> {
  requireAdmin(deps.config, req);
  const b = (req.body ?? {}) as Record<string, unknown>;
  const cidade: Cidade = {
    nome: exigirNome(b.nome, "nome"),
    descricao: texto(b.descricao),
    segredos: texto(b.segredos),
    atualizadoEm: "",
  };
  return { status: 200, body: await gravarCidade(deps.doc, deps.config.tableName, deps.config.campaignId, cidade) };
}


/**
 * "Revisar com IA": devolve uma versão melhor escrita, sem gravar nada.
 *
 * Não persiste de propósito. O Narrador compara as duas e decide; quem grava
 * continua sendo o botão de salvar, com o texto que estiver no formulário.
 *
 * Os campos públicos e os secretos vão em chamadas separadas, e a dos públicos
 * não recebe segredo nenhum — nem o da própria ficha, nem os do mundo em volta.
 * Um modelo não vaza o que nunca leu, e isso vale mais que qualquer instrução
 * pedindo que ele não vaze.
 */
export async function revisarItem(deps: Deps, req: HandlerRequest): Promise<HandlerResponse> {
  requireAdmin(deps.config, req);
  if (!deps.chat) throw new HttpError(503, "AI_DISABLED", "A IA não está configurada.");
  const chat = deps.chat;

  const alvo = req.pathParams?.colecao ?? "";
  const campos = CAMPOS_REVISAVEIS[alvo];
  if (!campos) throw new HttpError(404, "NOT_FOUND", "Coleção desconhecida.");

  const item = (req.body ?? {}) as Record<string, unknown>;
  const nome = texto(item.nome) || texto(item.titulo) || "(sem nome)";

  const mundo = await tudo(deps);
  const contexto = contextoDoMundo(mundo, item);
  // O lado que pode ver tudo vê também as tramas que ainda não vazaram.
  const contextoDoMestre = contextoDoMundo(mundo, item, true);
  const sistema = sistemaDeRevisao();

  const valorDe = (c: { nome: string; rotulo: string }) => ({ ...c, valor: texto(item[c.nome]) });
  const publicos = campos.filter((c) => !c.segredo).map(valorDe);
  const secretos = campos.filter((c) => c.segredo).map(valorDe);

  // Só o que tem texto: mandar um campo vazio gasta uma chamada para receber
  // de volta o vazio que já se tinha.
  const comTexto = (cs: { valor: string }[]) => cs.some((c) => c.valor !== "");

  const [revPublicos, revSecretos] = await Promise.all([
    comTexto(publicos)
      ? generateJson(
          chat,
          sistema,
          pedidoDeRevisao({ rotuloDaFicha: alvo, nomeDaFicha: nome, contexto, campos: publicos, secretos: false }),
          (raw) => parseRevisao(raw, publicos.map((c) => c.nome)),
        )
      : Promise.resolve({}),
    comTexto(secretos)
      ? generateJson(
          chat,
          sistema,
          pedidoDeRevisao({
            rotuloDaFicha: alvo,
            nomeDaFicha: nome,
            // A chamada dos segredos vê tudo: é o único lado que pode.
            contexto: [contextoDoMestre, blocoSecreto(item, campos)].filter(Boolean).join("\n\n"),
            campos: secretos,
            secretos: true,
          }),
          (raw) => parseRevisao(raw, secretos.map((c) => c.nome)),
        )
      : Promise.resolve({}),
  ]);

  return { status: 200, body: { campos: { ...revPublicos, ...revSecretos } } };
}

/** O que a ficha esconde, para a revisão dos segredos poder se apoiar nela. */
function blocoSecreto(item: Record<string, unknown>, campos: { nome: string; rotulo: string; segredo: boolean }[]): string {
  const linhas = campos
    .filter((c) => !c.segredo && texto(item[c.nome]))
    .map((c) => `${c.rotulo} (público): ${texto(item[c.nome])}`);
  return linhas.length > 0 ? `O LADO PÚBLICO DESTA MESMA FICHA:\n${linhas.join("\n")}` : "";
}
