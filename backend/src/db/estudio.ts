import { DynamoDBDocumentClient, DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { campaignPk, cidadeSk, estudioPrefix, estudioSk } from "../keys";
import type { Cidade } from "@vampiro/content";

/**
 * A cosmologia que o Narrador escreve, guardada no banco.
 *
 * Seis coleções e um registro único, todos na partição da campanha. Sobrevivem
 * ao reset da campanha pelo mesmo motivo que a wiki sobrevive: reiniciar apaga o
 * estado da partida, não a Cidade.
 *
 * O CRUD é genérico porque as seis coleções têm exatamente a mesma forma — o que
 * muda entre elas é o que a rota valida na entrada, não como o item é gravado.
 * Seis módulos idênticos seriam seis lugares para o mesmo bug.
 */
export interface ItemDoEstudio {
  id: string;
  atualizadoEm: string;
}

export async function listar<T extends ItemDoEstudio>(
  doc: DynamoDBDocumentClient, table: string, campaignId: string, colecao: string,
): Promise<T[]> {
  const res = await doc.send(new QueryCommand({
    TableName: table,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: { ":pk": campaignPk(campaignId), ":sk": estudioPrefix(colecao) },
  }));
  // PK e SK são endereço, não conteúdo: sair na rede não ajuda ninguém e conta
  // ao cliente como o banco está organizado.
  return (res.Items ?? []).map(({ PK: _pk, SK: _sk, ...item }) => item as T).filter((i) => i.id);
}

export async function gravar<T extends ItemDoEstudio>(
  doc: DynamoDBDocumentClient, table: string, campaignId: string, colecao: string, item: T,
): Promise<T> {
  const gravado = { ...item, atualizadoEm: new Date().toISOString() };
  await doc.send(new PutCommand({
    TableName: table,
    Item: { PK: campaignPk(campaignId), SK: estudioSk(colecao, item.id), ...gravado },
  }));
  return gravado;
}

export async function remover(
  doc: DynamoDBDocumentClient, table: string, campaignId: string, colecao: string, id: string,
): Promise<void> {
  await doc.send(new DeleteCommand({
    TableName: table,
    Key: { PK: campaignPk(campaignId), SK: estudioSk(colecao, id) },
  }));
}

/** A cidade é uma só, e por isso não passa pelo CRUD de coleção. */
export async function lerCidade(
  doc: DynamoDBDocumentClient, table: string, campaignId: string,
): Promise<Cidade | null> {
  const res = await doc.send(new GetCommand({
    TableName: table, Key: { PK: campaignPk(campaignId), SK: cidadeSk() },
  }));
  if (!res.Item) return null;
  const { PK: _pk, SK: _sk, ...cidade } = res.Item;
  return cidade as Cidade;
}

export async function gravarCidade(
  doc: DynamoDBDocumentClient, table: string, campaignId: string, cidade: Cidade,
): Promise<Cidade> {
  const gravada = { ...cidade, atualizadoEm: new Date().toISOString() };
  await doc.send(new PutCommand({
    TableName: table, Item: { PK: campaignPk(campaignId), SK: cidadeSk(), ...gravada },
  }));
  return gravada;
}
