import {
  ESTADOS_DE_TRAMA, IMPORTANCIAS, NIVEIS_DE_PODER, TIPOS_DE_CONTO,
  TIPOS_DE_PERSONAGEM, VISIBILIDADES,
} from "@vampiro/content";
import type { ColecaoDoEstudio, EstudioCompleto } from "../../../api/client";

/**
 * O que cada entidade do Estúdio pede ao Narrador.
 *
 * Cinco abas com formulário próprio seriam cinco lugares para o mesmo bug — o
 * campo secreto sem cadeado, o enum que aceita texto livre, o salvar que
 * esquece de recarregar. A definição vive aqui e um componente só a desenha.
 *
 * `segredo: true` não é enfeite visual: é o que põe o cadeado e o aviso, e o que
 * torna óbvio, ao escrever, o que nunca chega ao jogador.
 */
export type TipoDeCampo = "texto" | "longo" | "escolha" | "booleano" | "numero" | "referencia";

export interface Campo {
  nome: string;
  rotulo: string;
  tipo: TipoDeCampo;
  segredo?: boolean;
  ajuda?: string;
  opcoes?: readonly string[];
  /** Para `referencia`: de qual coleção vêm as opções. */
  de?: keyof EstudioCompleto;
  /** Mostrar só quando outro campo tiver certo valor. */
  quando?: { campo: string; valor: unknown };
  linhas?: number;
}

export interface DefinicaoDeEntidade {
  colecao: ColecaoDoEstudio;
  rotulo: string;
  singular: string;
  /**
   * O gênero do substantivo, para os botões.
   *
   * "Novo trama" e "Nenhum trama ainda" numa ferramenta cujo produto é texto
   * bem escrito envergonham a ferramenta.
   */
  genero: "m" | "f";
  /** O campo que dá título ao item na lista. */
  titulo: string;
  /** Uma linha de resumo na lista, montada dos campos que existirem. */
  resumo: string[];
  campos: Campo[];
}

const ROTULOS_DE_ESCOLHA: Record<string, string> = {
  HUMANO: "Humano", VAMPIRO: "Vampiro", LOBISOMEM: "Lobisomem", MAGO: "Mago",
  BAIXO: "Baixo", MEDIO: "Médio", ALTO: "Alto",
  PRINCIPAL: "Principal", MEDIA: "Média", PEQUENA: "Pequena",
  IDEIA: "Ideia", ATIVA: "Ativa", PAUSADA: "Pausada", RESOLVIDA: "Resolvida", ABANDONADA: "Abandonada",
  HISTORIA: "História", LENDA: "Lenda", RUMOR: "Rumor", EVENTO: "Evento histórico",
  HORROR: "Horror", FOLCLORE: "Folclore", OUTRO: "Outro",
  PUBLICO: "Público", MESTRE: "Somente Mestre",
};

export function rotuloDeEscolha(valor: string): string {
  return ROTULOS_DE_ESCOLHA[valor] ?? valor;
}

export const ENTIDADES: DefinicaoDeEntidade[] = [
  {
    colecao: "bairros",
    genero: "m",
    rotulo: "Bairros",
    singular: "bairro",
    titulo: "nome",
    resumo: ["atmosfera"],
    campos: [
      { nome: "nome", rotulo: "Nome do bairro", tipo: "texto" },
      { nome: "atmosfera", rotulo: "Atmosfera", tipo: "texto", ajuda: "Decadente, aristocrático, industrial, boêmio. Uma palavra ou duas." },
      { nome: "descricao", rotulo: "Descrição", tipo: "longo", linhas: 6 },
      { nome: "segredos", rotulo: "Segredos", tipo: "longo", segredo: true, linhas: 5, ajuda: "Esconderijos, conspirações, o que caça aqui." },
    ],
  },
  {
    colecao: "personagens",
    genero: "m",
    rotulo: "Personagens",
    singular: "personagem",
    titulo: "nome",
    resumo: ["tipo", "claKey"],
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "texto" },
      { nome: "tipo", rotulo: "Tipo", tipo: "escolha", opcoes: TIPOS_DE_PERSONAGEM },
      { nome: "claKey", rotulo: "Clã", tipo: "referencia", de: "clas", quando: { campo: "tipo", valor: "VAMPIRO" } },
      {
        nome: "respondePeloCla", rotulo: "Responde pelo clã", tipo: "booleano",
        quando: { campo: "tipo", valor: "VAMPIRO" },
        ajuda: "Marque um por clã. É desta pessoa que sai a voz de toda carta que o clã escreve — e ela precisa ter a Voz preenchida abaixo.",
      },
      { nome: "bairroId", rotulo: "Bairro onde vive", tipo: "referencia", de: "bairros" },
      { nome: "historia", rotulo: "História", tipo: "longo", linhas: 8, ajuda: "Origem, aparência, reputação, o que já fez." },
      { nome: "poder", rotulo: "Poder", tipo: "escolha", opcoes: NIVEIS_DE_PODER, segredo: true },
      { nome: "objetivos", rotulo: "Objetivos", tipo: "longo", segredo: true, linhas: 4, ajuda: "As motivações de verdade, que a ficha pública não conta." },
      { nome: "voz.titulo", rotulo: "Cargo na corte", tipo: "texto" },
      { nome: "voz.temperamento", rotulo: "Temperamento", tipo: "longo", linhas: 2 },
      { nome: "voz.comoFala", rotulo: "Como fala", tipo: "longo", linhas: 2, ajuda: "O que as frases dela fazem, não só o quanto ela é formal." },
      { nome: "voz.oQueQuer", rotulo: "O que quer", tipo: "longo", linhas: 2 },
      { nome: "voz.oQueRecusa", rotulo: "O que recusa", tipo: "longo", linhas: 2 },
      { nome: "voz.posturaComACorte", rotulo: "Postura diante da corte", tipo: "longo", linhas: 2 },
      { nome: "voz.interesses", rotulo: "Interesses do momento", tipo: "longo", linhas: 2 },
    ],
  },
  {
    colecao: "locais",
    genero: "m",
    rotulo: "Locais",
    singular: "local",
    titulo: "nome",
    resumo: ["bairroId"],
    campos: [
      { nome: "nome", rotulo: "Nome do local", tipo: "texto" },
      { nome: "bairroId", rotulo: "Bairro", tipo: "referencia", de: "bairros" },
      { nome: "descricao", rotulo: "Descrição", tipo: "longo", linhas: 6, ajuda: "Aparência, quem frequenta, o que se comenta." },
      { nome: "segredos", rotulo: "Segredos", tipo: "longo", segredo: true, linhas: 5, ajuda: "Passagens, donos verdadeiros, o que dorme no porão." },
    ],
  },
  {
    colecao: "tramas",
    genero: "f",
    rotulo: "Tramas",
    singular: "trama",
    titulo: "nome",
    resumo: ["importancia", "estado"],
    campos: [
      { nome: "nome", rotulo: "Nome da trama", tipo: "texto" },
      { nome: "importancia", rotulo: "Importância", tipo: "escolha", opcoes: IMPORTANCIAS },
      { nome: "estado", rotulo: "Estado", tipo: "escolha", opcoes: ESTADOS_DE_TRAMA },
      {
        nome: "visivel", rotulo: "Os jogadores sabem que existe", tipo: "booleano",
        ajuda: "Desmarcado, a trama some inteira das telas de jogador — nem o nome aparece.",
      },
      { nome: "descricaoPublica", rotulo: "Descrição pública", tipo: "longo", linhas: 5, ajuda: "O que os personagens poderiam saber." },
      { nome: "verdadeDoMestre", rotulo: "A verdade", tipo: "longo", segredo: true, linhas: 6, ajuda: "O que está acontecendo de fato." },
    ],
  },
  {
    colecao: "contos",
    genero: "m",
    rotulo: "Contos",
    singular: "conto",
    titulo: "titulo",
    resumo: ["tipo", "periodo"],
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto" },
      { nome: "tipo", rotulo: "Tipo", tipo: "escolha", opcoes: TIPOS_DE_CONTO },
      { nome: "periodo", rotulo: "Quando", tipo: "texto", ajuda: '"Durante o incêndio de 1987", "há uns cinquenta anos". Não precisa ser data.' },
      { nome: "visibilidade", rotulo: "Quem pode ler", tipo: "escolha", opcoes: VISIBILIDADES, ajuda: "Marcado como do Mestre, o conto não sai por rota de jogador — nem o título." },
      { nome: "historia", rotulo: "A história", tipo: "longo", linhas: 12 },
    ],
  },
];
