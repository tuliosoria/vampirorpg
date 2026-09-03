/**
 * As entidades do Estúdio: a cosmologia que o Narrador escreve.
 *
 * Cada uma guarda o público e o secreto no mesmo objeto, e é projetada antes de
 * sair na rede. `projecoes.ts` é o único lugar autorizado a fazer a travessia.
 */

declare const marcaPublica: unique symbol;

/**
 * A marca que distingue "já foi projetado" de "objeto cru do banco".
 *
 * Existe porque `Omit` sozinho não protege nada: ele produz um tipo mais LARGO,
 * e o TypeScript aceita de bom grado um objeto com campos a mais quando a
 * atribuição vem de uma variável — a checagem de excesso só vale para literais.
 * Um `Personagem` inteiro passava direto por onde se esperava um
 * `PersonagemPublico`, sem um aviso sequer. Foi testado, e passou.
 *
 * Com a marca, o tipo público deixa de ser um subconjunto e passa a ser outra
 * coisa: só as funções de `projecoes.ts` a aplicam. Devolver o objeto cru numa
 * rota de jogador vira erro de compilação.
 *
 * A marca é só de tipo — o símbolo nunca existe em tempo de execução, então
 * nada disto aparece no JSON.
 */
export type Publico<T> = T & { readonly [marcaPublica]: true };

export const TIPOS_DE_PERSONAGEM = ["HUMANO", "VAMPIRO", "LOBISOMEM", "MAGO"] as const;
export type TipoDePersonagem = (typeof TIPOS_DE_PERSONAGEM)[number];

export const NIVEIS_DE_PODER = ["BAIXO", "MEDIO", "ALTO"] as const;
export type NivelDePoder = (typeof NIVEIS_DE_PODER)[number];

export const TIPOS_DE_RELACAO = [
  "ALIADO", "INIMIGO", "FAMILIA", "MENTOR", "SERVO", "RIVAL", "AMOR", "CONTATO", "OUTRO",
] as const;
export type TipoDeRelacao = (typeof TIPOS_DE_RELACAO)[number];

export const IMPORTANCIAS = ["PRINCIPAL", "MEDIA", "PEQUENA"] as const;
export type Importancia = (typeof IMPORTANCIAS)[number];

export const ESTADOS_DE_TRAMA = ["IDEIA", "ATIVA", "PAUSADA", "RESOLVIDA", "ABANDONADA"] as const;
export type EstadoDeTrama = (typeof ESTADOS_DE_TRAMA)[number];

export const TIPOS_DE_CONTO = ["HISTORIA", "LENDA", "RUMOR", "EVENTO", "HORROR", "FOLCLORE", "OUTRO"] as const;
export type TipoDeConto = (typeof TIPOS_DE_CONTO)[number];

export const VISIBILIDADES = ["PUBLICO", "MESTRE"] as const;
export type Visibilidade = (typeof VISIBILIDADES)[number];

/** A cidade onde a crônica acontece. Registro único. */
export interface Cidade {
  nome: string;
  descricao: string;
  /** 🔒 O que a cidade esconde de quem mora nela. */
  segredos: string;
  atualizadoEm: string;
}
export type CidadePublica = Publico<Omit<Cidade, "segredos">>;

export interface Bairro {
  id: string;
  nome: string;
  descricao: string;
  /** Decadente, aristocrático, industrial, boêmio. Uma palavra ou duas. */
  atmosfera: string;
  /** 🔒 Esconderijos, conspirações, o que caça aqui. */
  segredos: string;
  atualizadoEm: string;
}
export type BairroPublico = Publico<Omit<Bairro, "segredos">>;

/**
 * A voz de quem responde por um clã.
 *
 * Fica no personagem, e não no clã, porque quem fala é gente. O clã marca qual
 * dos seus personagens responde por ele, e é dessa voz que sai toda carta.
 */
export interface VozDePersonagem {
  titulo: string;
  temperamento: string;
  comoFala: string;
  oQueQuer: string;
  oQueRecusa: string;
  posturaComACorte: string;
  interesses: string;
}

export interface RelacaoDePersonagem {
  paraId: string;
  tipo: TipoDeRelacao;
  descricao: string;
}

export interface Personagem {
  id: string;
  nome: string;
  historia: string;
  tipo: TipoDePersonagem;
  /** Só faz sentido quando `tipo` é VAMPIRO. Aponta para a chave de um clã. */
  claKey: string | null;
  /** Quem responde pelo clã. No máximo um por clã; o segundo substitui o primeiro. */
  respondePeloCla: boolean;
  bairroId: string | null;
  voz: VozDePersonagem | null;
  /** 🔒 */
  poder: NivelDePoder;
  /** 🔒 As motivações de verdade, que a ficha pública não conta. */
  objetivos: string;
  /** 🔒 Quem ele odeia, quem o protege, e por quê. */
  relacoes: RelacaoDePersonagem[];
  atualizadoEm: string;
}
export type PersonagemPublico = Publico<Omit<Personagem, "poder" | "objetivos" | "relacoes">>;

export interface Local {
  id: string;
  nome: string;
  bairroId: string | null;
  descricao: string;
  /** 🔒 Passagens, donos verdadeiros, o que dorme no porão. */
  segredos: string;
  personagemIds: string[];
  tramaIds: string[];
  atualizadoEm: string;
}
export type LocalPublico = Publico<Omit<Local, "segredos">>;

export interface PapelNaTrama {
  personagemId: string;
  papel: string;
}

export interface Trama {
  id: string;
  nome: string;
  importancia: Importancia;
  estado: EstadoDeTrama;
  /**
   * Se os jogadores sabem que esta trama existe.
   *
   * Falso esconde a trama INTEIRA, e não só a verdade: uma conspiração que
   * ninguém deveria suspeitar não pode aparecer numa lista com o nome à mostra.
   */
  visivel: boolean;
  descricaoPublica: string;
  /** 🔒 O que está acontecendo de verdade. */
  verdadeDoMestre: string;
  /** 🔒 Quem está dentro, e fazendo o quê. */
  personagens: PapelNaTrama[];
  /** 🔒 */
  localIds: string[];
  atualizadoEm: string;
}
export type TramaPublica = Publico<Omit<Trama, "verdadeDoMestre" | "personagens" | "localIds">>;

export interface Conto {
  id: string;
  titulo: string;
  historia: string;
  tipo: TipoDeConto;
  visibilidade: Visibilidade;
  /** "Durante o incêndio de 1987", "há uns cinquenta anos". Não é data. */
  periodo: string;
  atualizadoEm: string;
}
/** O conto não tem campo secreto: ou ele é público inteiro, ou não sai. */
export type ContoPublico = Publico<Conto>;

/** Um id estável e legível, derivado do nome. */
export function idDe(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
