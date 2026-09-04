import type { Bairro, Cidade, ClaFicha, Conto, Local, Personagem, Trama } from "@vampiro/content";
import { HttpError } from "../types/domain.js";

/**
 * "Revisar com IA": a ficha que o Narrador escreveu, devolvida melhor escrita.
 *
 * Duas regras mandam neste módulo, e as duas existem porque a alternativa
 * estraga trabalho alheio:
 *
 * A IA não escreve por cima. Ela devolve uma versão, o Narrador compara e
 * decide. Salvar grava o que ele escreveu, sempre — nunca o que a IA achou
 * melhor.
 *
 * E o segredo não atravessa. Campos públicos e campos secretos são revisados em
 * chamadas separadas, e a chamada dos públicos não recebe o segredo: um modelo
 * não vaza o que nunca leu. Custa um pedido a mais e resolve por construção o
 * que uma instrução no prompt só pede com jeitinho.
 */

export interface CampoRevisavel {
  nome: string;
  rotulo: string;
  segredo: boolean;
}

/**
 * O que a IA pode reescrever, e nada além.
 *
 * De fora ficam nome, id, clã, bairro, visibilidade — tudo que é escolha do
 * Narrador ou vínculo entre fichas. Uma revisão que muda o `claKey` de um
 * personagem não melhorou a prosa: mudou de quem ele é.
 */
export const CAMPOS_REVISAVEIS: Record<string, CampoRevisavel[]> = {
  cidade: [
    { nome: "descricao", rotulo: "Descrição da Cidade", segredo: false },
    { nome: "segredos", rotulo: "Segredos da Cidade", segredo: true },
  ],
  bairros: [
    { nome: "descricao", rotulo: "Descrição do bairro", segredo: false },
    { nome: "segredos", rotulo: "Segredos do bairro", segredo: true },
  ],
  personagens: [
    { nome: "historia", rotulo: "História do personagem", segredo: false },
    { nome: "objetivos", rotulo: "Objetivos verdadeiros", segredo: true },
  ],
  locais: [
    { nome: "descricao", rotulo: "Descrição do local", segredo: false },
    { nome: "segredos", rotulo: "Segredos do local", segredo: true },
  ],
  tramas: [
    { nome: "descricaoPublica", rotulo: "Descrição pública", segredo: false },
    { nome: "verdadeDoMestre", rotulo: "A verdade", segredo: true },
  ],
  contos: [{ nome: "historia", rotulo: "A história", segredo: false }],
};

/** A cosmologia já escrita, para a revisão não contradizer o que existe. */
export interface MundoParaRevisao {
  cidade: Cidade;
  bairros: Bairro[];
  personagens: Personagem[];
  locais: Local[];
  tramas: Trama[];
  contos: Conto[];
  clas: ClaFicha[];
}

const TETO_CONTEXTO = 6000;

function corta(texto: string, teto: number): string {
  const limpo = texto.trim();
  return limpo.length <= teto ? limpo : `${limpo.slice(0, teto)}…`;
}

function nomeDe(x: { nome?: string; titulo?: string; name?: string }): string {
  return x.nome ?? x.titulo ?? x.name ?? "";
}

/**
 * O que cerca a ficha em revisão.
 *
 * Sem isto a IA escreve prosa bonita e desligada: um bairro que não sabe em que
 * cidade fica, um personagem cujo clã ela inventa. Só nomes e uma linha de cada
 * um — o contexto é para ancorar, não para ser reescrito junto.
 *
 * Nunca inclui campo secreto. É o que permite usar a mesma função nas duas
 * chamadas sem que a dos públicos leia o que não deve.
 *
 * `incluirOculto` liga o que só a chamada dos segredos pode ver, e nasce
 * desligado: o padrão de uma função que decide o que atravessa a fronteira tem
 * de ser o lado seguro.
 */
export function contextoDoMundo(
  mundo: MundoParaRevisao,
  item: Record<string, unknown>,
  incluirOculto = false,
): string {
  const partes: string[] = [];

  if (mundo.cidade.nome.trim()) {
    partes.push(`CIDADE: ${mundo.cidade.nome}\n${corta(mundo.cidade.descricao, 1200)}`);
  }

  const bairroId = typeof item.bairroId === "string" ? item.bairroId : null;
  const bairro = bairroId ? mundo.bairros.find((b) => b.id === bairroId) : null;
  if (bairro) partes.push(`BAIRRO DESTA FICHA: ${bairro.nome} (${bairro.atmosfera})\n${corta(bairro.descricao, 800)}`);

  const claKey = typeof item.claKey === "string" ? item.claKey : null;
  const cla = claKey ? mundo.clas.find((c) => c.key === claKey) : null;
  if (cla) partes.push(`CLÃ DESTA FICHA: ${cla.name}\n${corta(cla.descricao ?? "", 800)}`);

  const listar = (titulo: string, nomes: string[]) =>
    nomes.length > 0 ? partes.push(`${titulo}: ${nomes.join(", ")}`) : undefined;

  listar("OUTROS BAIRROS", mundo.bairros.filter((b) => b.id !== bairroId).map(nomeDe));
  listar("CLÃS DA CIDADE", mundo.clas.filter((c) => c.key !== claKey).map(nomeDe));
  listar("PERSONAGENS JÁ ESCRITOS", mundo.personagens.map(nomeDe));
  listar("LOCAIS JÁ ESCRITOS", mundo.locais.map(nomeDe));
  /**
   * O nome de uma trama invisível é segredo, e não metadado.
   *
   * "O que dorme sob a Capela" não tem campo secreto nenhum e já entrega o
   * enredo inteiro — é por isso que a projeção do jogador remove a trama
   * oculta por completo em vez de esvaziar seus campos. Aqui vale o mesmo: a
   * chamada dos campos públicos vê só as tramas que os jogadores já veem.
   */
  listar("TRAMAS EM CURSO", mundo.tramas.filter((t) => incluirOculto || t.visivel).map(nomeDe));

  return corta(partes.join("\n\n"), TETO_CONTEXTO);
}

const VOZ = [
  "Você é o editor de uma crônica de Vampiro: A Máscara — horror pessoal, política noturna, decadência urbana.",
  "Recebe uma ficha escrita pelo Narrador e devolve a mesma ficha melhor escrita.",
  "",
  "O QUE FAZER:",
  "- corrigir gramática e fluidez;",
  "- tornar a escrita mais narrativa e evocativa, com detalhe concreto no lugar de adjetivo genérico;",
  "- desenvolver o que ficou como ideia solta, na direção que o Narrador já apontou.",
  "",
  "O QUE NÃO FAZER:",
  "- inventar ou trocar nome próprio: de pessoa, de lugar, de clã, de qualquer coisa;",
  "- contradizer ou remover fato que o Narrador afirmou;",
  "- mudar a intenção do texto, o tom que ele escolheu, ou de quem é a história;",
  "- responder com comentário, elogio ou explicação do que você mudou.",
  "",
  "Se um campo vier vazio, devolva-o vazio. Não invente ficha que ninguém escreveu.",
].join("\n");

export function sistemaDeRevisao(): string {
  return VOZ;
}

/**
 * O pedido de revisão de um conjunto de campos.
 *
 * `contexto` entra como está — quem chama decide o que ele contém, e é aí que a
 * separação entre público e secreto acontece.
 */
export function pedidoDeRevisao(input: {
  rotuloDaFicha: string;
  nomeDaFicha: string;
  contexto: string;
  campos: { nome: string; rotulo: string; valor: string }[];
  secretos: boolean;
}): string {
  const cabecalho = input.secretos
    ? [
        "Estes campos são SEGREDOS DO NARRADOR: os jogadores nunca os leem.",
        "Escreva-os com clareza operacional — o que é verdade, quem sabe, o que acontece se vazar.",
        "Não precisa poupar o leitor: aqui o leitor é o próprio Narrador.",
      ].join("\n")
    : [
        "Estes campos são PÚBLICOS: qualquer jogador pode lê-los.",
        "Escreva só o que os personagens poderiam saber ou comentar.",
        "Não afirme o que está por trás — insinuar é do ofício, revelar não.",
      ].join("\n");

  return [
    cabecalho,
    "",
    `FICHA: ${input.rotuloDaFicha} — ${input.nomeDaFicha}`,
    "",
    input.contexto ? `O MUNDO ATÉ AQUI:\n${input.contexto}` : "A crônica ainda não tem outras fichas escritas.",
    "",
    "CAMPOS A REVISAR:",
    ...input.campos.map((c) => `\n### ${c.nome} (${c.rotulo})\n${c.valor.trim() || "(vazio)"}`),
    "",
    "Responda em JSON com exatamente estas chaves, cada valor sendo o texto revisado daquele campo:",
    `{${input.campos.map((c) => `"${c.nome}": "…"`).join(", ")}}`,
  ].join("\n");
}

/**
 * Lê a resposta e joga fora o que não foi pedido.
 *
 * Uma chave a mais não é curiosidade: é a IA escrevendo num campo que não está
 * em revisão — o `nome` da ficha, o `claKey` — e quem grava confia no que sai
 * daqui. Só os campos pedidos passam, e só como texto.
 */
export function parseRevisao(raw: string, esperados: string[]): Record<string, string> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new HttpError(502, "AI_PARSE", "A IA não devolveu JSON.");
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new HttpError(502, "AI_PARSE", "A IA não devolveu um objeto.");
  }
  const bruto = json as Record<string, unknown>;
  const saida: Record<string, string> = {};
  for (const campo of esperados) {
    const v = bruto[campo];
    if (typeof v === "string") saida[campo] = v.trim();
  }
  if (Object.keys(saida).length === 0) {
    throw new HttpError(502, "AI_PARSE", "A IA não devolveu nenhum dos campos pedidos.");
  }
  return saida;
}
