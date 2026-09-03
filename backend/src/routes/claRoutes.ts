import { chaveDeCla, fichaVazia, type ClaFicha } from "@vampiro/content";
import { HttpError, type HandlerRequest, type HandlerResponse } from "../types/domain";
import { requireAdmin } from "../auth/adminAuth";
import { listClaFichas, putClaFicha, deleteClaFicha } from "../db/canonFichas";
import { invalidarCanon } from "../canon/aplicar";
import type { Deps } from "./publicRoutes";

/**
 * As fichas de clã: como o Narrador constrói a Cidade.
 *
 * A leitura é pública porque o site inteiro depende dela — a página do clã, o
 * mapa, a lista de destinatários. A escrita é do Narrador.
 */
export async function listCla(deps: Deps, _req: HandlerRequest): Promise<HandlerResponse> {
  const fichas = await listClaFichas(deps.doc, deps.config.tableName, deps.config.campaignId);
  return { status: 200, body: { fichas } };
}

function parseFicha(body: unknown): ClaFicha {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) throw new HttpError(400, "INVALID_BODY", "O clã precisa de um nome.");

  // A chave nasce do nome quando o Narrador não dá uma. Depois de criada ela
  // não muda sozinha: renomear o clã não pode reescrever a chave, senão as
  // relações, cartas e imagens já gravadas apontariam para um clã que sumiu.
  const key = typeof b.key === "string" && b.key.trim() ? b.key.trim() : chaveDeCla(name);
  if (!/^[a-z0-9-]+$/.test(key)) {
    throw new HttpError(400, "INVALID_BODY", "A chave do clã aceita só letras minúsculas, números e hífen.");
  }

  const base = fichaVazia(key, name);
  const num = (v: unknown, padrao: number) => (typeof v === "number" && Number.isFinite(v) ? v : padrao);

  return {
    ...base,
    refugio: typeof b.refugio === "string" ? b.refugio.trim() : "",
    outrosLugares: Array.isArray(b.outrosLugares)
      ? b.outrosLugares.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim())
      : [],
    x: num(b.x, base.x),
    y: num(b.y, base.y),
    descricao: typeof b.descricao === "string" ? b.descricao : "",
    segredos: typeof b.segredos === "string" ? b.segredos : "",
    perfil: (b.perfil as ClaFicha["perfil"]) ?? null,
    dossie: (b.dossie as ClaFicha["dossie"]) ?? null,
  };
}

export async function saveCla(deps: Deps, req: HandlerRequest): Promise<HandlerResponse> {
  requireAdmin(deps.config, req);
  const ficha = await putClaFicha(deps.doc, deps.config.tableName, deps.config.campaignId, parseFicha(req.body));
  // Sem isto o Narrador salvaria e continuaria vendo o mundo de trinta segundos
  // atrás, concluindo que não salvou.
  invalidarCanon();
  return { status: 200, body: ficha };
}

export async function removeCla(deps: Deps, req: HandlerRequest): Promise<HandlerResponse> {
  requireAdmin(deps.config, req);
  const key = typeof (req.body as { key?: unknown })?.key === "string" ? (req.body as { key: string }).key : "";
  if (!key) throw new HttpError(400, "INVALID_BODY", "Campo obrigatório: key");
  await deleteClaFicha(deps.doc, deps.config.tableName, deps.config.campaignId, key);
  invalidarCanon();
  return { status: 204, body: undefined };
}
