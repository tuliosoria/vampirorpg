export interface WikiSection {
  id: string;
  label: string;
}

/**
 * As seções da crônica da Cidade. A barra lateral as desenha nesta ordem, e
 * todo verbete pertence a exatamente uma.
 *
 * É o esqueleto que o Narrador preenche: a lista existe para que ele saiba onde
 * cada coisa vai, e para que o motor de cânone visual saiba o que é mundo e o
 * que é regra de mesa. Os verbetes em si nascem vazios.
 */
export const WIKI_SECTIONS: WikiSection[] = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "corte", label: "A Corte" },
  { id: "clas", label: "Os Clãs" },
  { id: "seitas", label: "Seitas e Facções" },
  { id: "bairros", label: "Bairros e Domínios" },
  { id: "lugares", label: "Lugares" },
  { id: "dinheiro", label: "Dinheiro e Influência" },
  { id: "mortais", label: "Os Mortais" },
  { id: "historia", label: "História da Cidade" },
  { id: "guerras", label: "Guerras de Sangue" },
  { id: "crise-atual", label: "Crise Atual" },
  { id: "tradicoes", label: "As Tradições" },
  { id: "mascara", label: "A Máscara" },
  { id: "costumes", label: "Costumes da Corte" },
  { id: "calendario", label: "Calendário" },
  { id: "linhagens", label: "Linhagens" },
  { id: "disciplinas", label: "Disciplinas" },
  { id: "ocultismo", label: "Ocultismo" },
  { id: "cosmologia", label: "Cosmologia" },
  { id: "religioes", label: "Religiões" },
  { id: "cacadores", label: "Caçadores" },
  { id: "criaturas", label: "Criaturas e Lendas" },
  { id: "lendas", label: "Boatos e Lendas Urbanas" },
  // Fala com o jogador na mesa, não de dentro do mundo — por isso no fim,
  // depois de toda a crônica, e por isso fora do cânone visual.
  { id: "mesa", label: "Na Mesa" },
];

/**
 * Seções que descrevem as regras do jogo, e não o mundo.
 *
 * O motor de cânone visual casa o texto de um pedido de imagem contra todo
 * verbete existente. Sem esta lista, pedir "uma fogueira no beco" poderia
 * arrastar o verbete de uma regra para dentro do prompt como se fosse cânone da
 * Cidade — mecânica de mesa vazando para dentro da ficção.
 */
export const NON_CANON_WIKI_SECTIONS: string[] = ["mesa"];

export function isCanonWikiSection(id: string): boolean {
  return !NON_CANON_WIKI_SECTIONS.includes(id);
}

export interface WikiGroup {
  id: string;
  label: string;
  /** Uma frase sobre o que se encontra aqui, para o índice. */
  blurb: string;
  sections: string[];
}

/**
 * As seções reunidas em grupos.
 *
 * Vinte e três seções numa fileira única não é um índice, é uma parede: quem
 * chega não sabe por onde começar e quem procura algo específico varre tudo.
 * Os grupos são a unidade de navegação; a seção continua sendo a unidade de
 * conteúdo.
 */
export const WIKI_GROUPS: WikiGroup[] = [
  {
    id: "cidade",
    label: "A Cidade",
    blurb: "Quem manda, quem divide o mapa e onde tudo isso fica.",
    sections: ["visao-geral", "corte", "clas", "seitas", "bairros", "lugares", "dinheiro", "mortais"],
  },
  {
    id: "historia",
    label: "História",
    blurb: "O que já aconteceu, e o que está acontecendo agora.",
    sections: ["historia", "guerras", "crise-atual"],
  },
  {
    id: "lei",
    label: "Lei e Costume",
    blurb: "O que se pode fazer, o que se paga por fazer, e o que nunca se admite.",
    sections: ["tradicoes", "mascara", "costumes", "calendario"],
  },
  {
    id: "sangue",
    label: "Sangue e Mistério",
    blurb: "De onde vem o poder, o que ele cobra e o que caça na direção contrária.",
    sections: ["linhagens", "disciplinas", "ocultismo", "cosmologia", "religioes", "cacadores", "criaturas", "lendas"],
  },
  {
    id: "mesa",
    label: "Na Mesa",
    blurb: "Como o Narrador conduz a crônica, e o que se rola quando se rola.",
    sections: ["mesa"],
  },
];

export const WIKI_SECTION_IDS: string[] = WIKI_SECTIONS.map((s) => s.id);

/** O grupo a que uma seção pertence, ou null se ela ainda não foi agrupada. */
export function wikiGroupOf(sectionId: string): WikiGroup | null {
  return WIKI_GROUPS.find((g) => g.sections.includes(sectionId)) ?? null;
}

export function wikiSectionLabel(id: string): string {
  return WIKI_SECTIONS.find((s) => s.id === id)?.label ?? id;
}

export interface WikiEntry {
  entryId: string;
  section: string;
  title: string;
  body: string;
  order: number;
  updatedAt: string;
  imageUrl?: string;
  imageUrls?: string[];
}
