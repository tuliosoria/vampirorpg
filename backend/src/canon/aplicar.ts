import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { aplicarCanon } from "@vampiro/content";
import { listClaFichas } from "../db/canonFichas";

/**
 * Carrega o cânone do banco e o escreve nas constantes que o motor lê.
 *
 * Precisa rodar antes de qualquer rota: a Lambda sobe com o cânone vazio, e uma
 * carta redigida nesse instante sairia sem saber que a Cidade tem clãs.
 *
 * O cache é do contêiner, com validade curta. A alternativa — ler o banco em
 * toda requisição — custaria uma Query a mais em cada chamada, inclusive nas
 * que não tocam cânone nenhum. A alternativa oposta, carregar uma vez na
 * inicialização, deixaria o Narrador editando um clã e não vendo a mudança até
 * a Lambda reciclar, o que pode levar horas. Trinta segundos é o acordo: o
 * custo some no ruído e a edição aparece antes de o Narrador terminar de ler a
 * própria tela.
 *
 * `invalidarCanon` existe para o caminho de escrita não esperar esse prazo:
 * quem grava uma ficha derruba o cache na mesma requisição, então o Narrador
 * vê o efeito imediatamente.
 */
const VALIDADE_MS = 30_000;

let carregadoEm = 0;
let carregando: Promise<void> | null = null;

export function invalidarCanon(): void {
  carregadoEm = 0;
}

export async function garantirCanon(
  doc: DynamoDBDocumentClient,
  table: string,
  campaignId: string,
): Promise<void> {
  if (Date.now() - carregadoEm < VALIDADE_MS) return;
  // Duas requisições concorrentes no mesmo contêiner compartilham a leitura em
  // vez de disparar duas Queries e escrever no cânone uma por cima da outra.
  if (carregando) return carregando;

  carregando = (async () => {
    try {
      aplicarCanon(await listClaFichas(doc, table, campaignId));
      carregadoEm = Date.now();
    } catch (e) {
      /**
       * Ler cânone não pode derrubar a API.
       *
       * Isto roda antes de TODA rota, então uma exceção aqui viraria 500 no
       * site inteiro — inclusive no login e no turno, que não dependem de clã
       * nenhum. Degradar para a Cidade vazia é pior que o certo e muito melhor
       * que o site fora do ar; e como não marcamos `carregadoEm`, a próxima
       * requisição tenta de novo em vez de congelar o vazio por trinta segundos.
       */
      console.error("Falha ao carregar o cânone", (e as Error)?.name, (e as Error)?.message);
    } finally {
      carregando = null;
    }
  })();
  return carregando;
}
