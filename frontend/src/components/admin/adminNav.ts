/**
 * A navegação do painel do Mestre.
 *
 * Antes eram doze abas numa fileira só, que rolava horizontalmente: o Mestre
 * tinha de lembrar qual caixa guardava o quê antes de conseguir procurar. Agora
 * o primeiro nível responde "o que eu estou fazendo agora" — escrevendo o
 * mundo, rodando a noite, cuidando dos jogadores, gerando imagem, mexendo no
 * sistema — e só depois disso aparece a segunda fileira.
 *
 * São duas fileiras, nunca três. É a regra que esta estrutura existe para
 * manter: quem abre o painel para escrever um bairro chega ao campo de texto em
 * dois cliques.
 */
export interface AdminSection {
  value: string;
  label: string;
}

export interface AdminGroup {
  value: string;
  label: string;
  /** A segunda fileira. Sempre ao menos uma; a primeira é onde o grupo abre. */
  sections: AdminSection[];
}

/**
 * Cinco destinos, e uma fileira de abas dentro de cada um.
 *
 * Antes eram três níveis: grupo, seção, e a Cosmologia com abas próprias por
 * dentro. Quem chegava para escrever um bairro tinha de acertar três cliques
 * numa gaveta de dez itens onde "Canônico", "Acervo" e "Escriba" não dizem o
 * que fazem. O Mundo agora é o que a palavra promete: as sete fichas, lado a
 * lado, sem nada por baixo.
 *
 * As ferramentas antigas não sumiram — foram para Sistema, marcadas como
 * antigas, porque ainda guardam conteúdo que o Estúdio não absorveu. Quem entra
 * para escrever a Cidade não passa por elas.
 */
export const ADMIN_GROUPS: AdminGroup[] = [
  {
    value: "mundo",
    label: "Mundo",
    sections: [
      { value: "cidade", label: "Cidade" },
      { value: "bairros", label: "Bairros" },
      // O clã vem antes do personagem: é a ele que o personagem se prende.
      { value: "clas", label: "Clãs" },
      { value: "personagens", label: "Personagens" },
      { value: "locais", label: "Locais" },
      { value: "tramas", label: "Tramas" },
      { value: "contos", label: "Contos" },
    ],
  },
  {
    value: "turno",
    label: "Noite",
    sections: [
      { value: "resolver", label: "Resolver" },
      // O registro nasce no turno; consultá-lo é conferir o que a noite gerou.
      { value: "registro", label: "Registro" },
    ],
  },
  {
    value: "jogadores",
    label: "Jogadores",
    sections: [
      { value: "fichas", label: "Fichas" },
      { value: "relacoes", label: "Relações" },
      { value: "vivos", label: "Estado vivo" },
    ],
  },
  {
    value: "imagens",
    label: "Imagens",
    sections: [
      { value: "gerador", label: "Gerador" },
      { value: "entidades", label: "Entidades" },
      { value: "acervo", label: "Acervo" },
      { value: "prompts", label: "Estilo" },
    ],
  },
  {
    value: "sistema",
    label: "Sistema",
    sections: [
      { value: "campanha", label: "Campanha" },
      // Guardam conteúdo que o Estúdio ainda não absorveu. Ficam aqui para não
      // se perderem, e fora do caminho de quem chega para escrever.
      { value: "biblia", label: "Bíblia (antiga)" },
      { value: "canonico", label: "Enciclopédia (antiga)" },
      { value: "escriba", label: "Escriba (antigo)" },
    ],
  },
];

/**
 * O painel abre no Mundo.
 *
 * Abria na Noite, que é o trabalho recorrente de quem já tem crônica em
 * andamento — mas uma noite não tem o que resolver antes de a Cidade existir.
 * Quem chega a este painel pela primeira vez chega para escrever.
 */
export const DEFAULT_GROUP = "mundo";

/**
 * Onde cada aba antiga foi parar.
 *
 * O painel guarda a aba em `?tab=`, então há links salvos e abas abertas
 * apontando para os doze valores velhos. Quebrar isso seria perder o marcador
 * de página de quem já usa o app. "galeria" e "senhas" nunca fizeram nada —
 * caem no turno, como qualquer valor desconhecido.
 */
const LEGACY: Record<string, { group: string; section?: string }> = {
  turnos: { group: "turno", section: "resolver" },
  projetos: { group: "turno", section: "resolver" },
  correspondencia: { group: "turno", section: "resolver" },
  // "clas" era o grupo dos jogadores e virou o das fichas; o clã do MUNDO é
  // outra coisa, e um link antigo apontando para lá levaria a pessoa ao lugar
  // errado sem erro nenhum.
  clas: { group: "jogadores", section: "fichas" },
  casas: { group: "jogadores", section: "fichas" },
  relacoes: { group: "jogadores", section: "relacoes" },
  vivos: { group: "jogadores", section: "vivos" },
  historia: { group: "sistema", section: "biblia" },
  canonico: { group: "sistema", section: "canonico" },
  escriba: { group: "sistema", section: "escriba" },
  prompts: { group: "imagens", section: "prompts" },
  acervo: { group: "imagens", section: "acervo" },
  entidades: { group: "imagens", section: "entidades" },
  // O grupo antigo "mundo" apontava para a gaveta de dez itens. O nome ficou,
  // mas agora leva às fichas — que é o que quem clicava em "Mundo" queria.
  estudio: { group: "mundo", section: "cidade" },
  biblia: { group: "sistema", section: "biblia" },
  registro: { group: "turno", section: "registro" },
  sistema: { group: "sistema", section: "campanha" },
};

export function groupOf(value: string | null): AdminGroup {
  const direct = ADMIN_GROUPS.find((g) => g.value === value);
  if (direct) return direct;
  const legacy = value ? LEGACY[value] : undefined;
  if (legacy) return ADMIN_GROUPS.find((g) => g.value === legacy.group) ?? ADMIN_GROUPS[0];
  return ADMIN_GROUPS.find((g) => g.value === DEFAULT_GROUP) ?? ADMIN_GROUPS[0];
}

/**
 * A seção a mostrar dentro do grupo: a pedida, a herdada do link antigo, ou a
 * primeira. Grupos empilhados devolvem string vazia.
 */
export function sectionOf(groupValue: string | null, sectionValue: string | null): string {
  const group = groupOf(groupValue);
  if (group.sections.length === 0) return "";
  if (sectionValue && group.sections.some((s) => s.value === sectionValue)) return sectionValue;
  const legacy = groupValue ? LEGACY[groupValue] : undefined;
  if (legacy?.section && group.sections.some((s) => s.value === legacy.section)) return legacy.section;
  return group.sections[0].value;
}
