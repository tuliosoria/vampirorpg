import { DynamoDBDocumentClient, DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { campaignPk, claFichaPrefix, claFichaSk } from "../keys";
import { fichaVazia, type ClaFicha } from "@vampiro/content";

/**
 * As fichas de clã: o mundo que o Narrador escreve, guardado no banco.
 *
 * Ficam na partição da campanha, sob `CANONCLA#`. Sobrevivem ao reset da
 * campanha pelo mesmo motivo que a wiki sobrevive: reiniciar apaga o estado da
 * partida, não a Cidade.
 */
function strip(item: Record<string, unknown>): ClaFicha {
  const base = fichaVazia(
    typeof item.key === "string" ? item.key : "",
    typeof item.name === "string" ? item.name : "",
  );
  return {
    ...base,
    refugio: typeof item.refugio === "string" ? item.refugio : "",
    outrosLugares: Array.isArray(item.outrosLugares) ? (item.outrosLugares as string[]) : [],
    // Number() num atributo ausente daria NaN, e um NaN numa coordenada
    // contamina toda distância que passar por ela sem nunca lançar erro.
    x: typeof item.x === "number" ? item.x : base.x,
    y: typeof item.y === "number" ? item.y : base.y,
    lider: (item.lider as ClaFicha["lider"]) ?? null,
    elenco: Array.isArray(item.elenco) ? (item.elenco as ClaFicha["elenco"]) : [],
    perfil: (item.perfil as ClaFicha["perfil"]) ?? null,
    dossie: (item.dossie as ClaFicha["dossie"]) ?? null,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : "",
  };
}

export async function listClaFichas(
  doc: DynamoDBDocumentClient, table: string, campaignId: string,
): Promise<ClaFicha[]> {
  const res = await doc.send(new QueryCommand({
    TableName: table,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: { ":pk": campaignPk(campaignId), ":sk": claFichaPrefix() },
  }));
  return (res.Items ?? []).map(strip).filter((f) => f.key && f.name);
}

export async function putClaFicha(
  doc: DynamoDBDocumentClient, table: string, campaignId: string, ficha: ClaFicha,
): Promise<ClaFicha> {
  const gravada = { ...ficha, updatedAt: new Date().toISOString() };
  await doc.send(new PutCommand({
    TableName: table,
    Item: { PK: campaignPk(campaignId), SK: claFichaSk(ficha.key), ...gravada },
  }));
  return gravada;
}

export async function deleteClaFicha(
  doc: DynamoDBDocumentClient, table: string, campaignId: string, key: string,
): Promise<void> {
  await doc.send(new DeleteCommand({
    TableName: table,
    Key: { PK: campaignPk(campaignId), SK: claFichaSk(key) },
  }));
}
