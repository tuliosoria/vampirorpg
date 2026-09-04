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
  /**
   * O que se escreve aqui, em uma frase.
   *
   * Não é ajuda opcional: sem ela a segunda fileira é uma lista de substantivos
   * — "Contos", "Acervo", "Escriba" — e quem chega precisa clicar em cada uma
   * para descobrir o que é. A frase diz o que você está adicionando e o que
   * aquilo passa a fazer no jogo depois de salvo.
   */
  descricao: string;
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
 * O que não é ficha do Mundo, noite, jogador nem imagem fica em Sistema: o
 * contexto solto que a IA lê, a enciclopédia pública e os ajustes da campanha.
 * Nada ali é obsoleto — cada um faz uma coisa que as fichas não fazem, e a
 * frase de cada seção diz qual, porque a pergunta real de quem chega não é
 * "isto ainda vale?" e sim "escrevi a Cidade no Mundo; então o que é isto?".
 */
export const ADMIN_GROUPS: AdminGroup[] = [
  {
    value: "mundo",
    label: "Mundo",
    sections: [
      { value: "cidade", label: "Cidade",
        descricao:
          "A cidade onde a crônica acontece: como ela é, o que se conta dela, quem manda de dia e o que caça à noite. Tudo o mais que você escrever vive dentro dela.",
      },
      { value: "bairros", label: "Bairros",
        descricao:
          "Os pedaços da Cidade. Cada bairro é um endereço: locais ficam num, personagens moram num, e a atmosfera que você der a ele contamina tudo que acontecer ali.",
      },
      // O clã vem antes do personagem: é a ele que o personagem se prende.
      { value: "clas", label: "Clãs",
        descricao:
          "As famílias de vampiros que disputam a Cidade. Cada clã vira um ponto no mapa, uma página pública e um lugar na mesa — é a partir deles que a distância e o número de cartas por noite são calculados. Quem fala pelo clã é um personagem: cadastre-o em Personagens e marque-o como quem responde.",
      },
      { value: "personagens", label: "Personagens",
        descricao:
          "Quem habita a Cidade: vampiros, humanos, e o que mais houver. Preso a um clã, o personagem entra no elenco dele; marcado como quem responde, vira a voz de toda carta que aquele clã escrever.",
      },
      { value: "locais", label: "Locais",
        descricao:
          "Os lugares onde a crônica acontece — bares, capelas, hotéis, porões. É onde as cenas vão se passar e onde os personagens vão se encontrar.",
      },
      { value: "tramas", label: "Tramas",
        descricao:
          "Os conflitos em curso: quem quer o quê e a quem isso custa. A trama nasce invisível — os jogadores só veem a que você marcar.",
      },
      { value: "contos", label: "Contos",
        descricao:
          "O que a Cidade conta sobre si: lendas, crimes antigos, o incêndio que ninguém explica. Não precisam virar problema de ninguém para valerem a pena.",
      },
    ],
  },
  {
    value: "turno",
    label: "Noite",
    sections: [
      { value: "resolver", label: "Resolver",
        descricao:
          "A noite em andamento: as ordens que chegaram, as cartas a despachar e o resultado que os jogadores vão ler amanhã.",
      },
      // O registro nasce no turno; consultá-lo é conferir o que a noite gerou.
      { value: "registro", label: "Registro",
        descricao:
          "O que já aconteceu, noite a noite, em fatos com a citação de onde saíram. É o que impede a IA de contradizer a própria crônica.",
      },
    ],
  },
  {
    value: "jogadores",
    label: "Jogadores",
    sections: [
      { value: "fichas", label: "Fichas",
        descricao:
          "Os clãs que têm dono na mesa: atributos, código de acesso e o estado de cada jogador.",
      },
      { value: "relacoes", label: "Relações",
        descricao:
          "Quem é aliado de quem, e a que distância. A força de cada laço muda o que a IA escreve entre eles.",
      },
      { value: "vivos", label: "Estado vivo",
        descricao:
          "O estado vivo que o motor mantém para cada personagem — humor, objetivo, lealdade — e o que ele gravou depois da última noite. É aqui que você corrige o que saiu fora de tom.",
      },
    ],
  },
  {
    value: "imagens",
    label: "Imagens",
    sections: [
      { value: "gerador", label: "Gerador",
        descricao:
          "Gera a arte de uma entidade ou de uma cena a partir do que você já escreveu sobre ela.",
      },
      { value: "entidades", label: "Entidades",
        descricao:
          "As coisas do mundo que podem ser ilustradas, e as imagens que cada uma já tem.",
      },
      { value: "acervo", label: "Acervo",
        descricao:
          "Tudo que já foi gerado. É daqui que você escolhe qual imagem cada coisa usa no site.",
      },
      { value: "prompts", label: "Estilo",
        descricao:
          "As diretrizes visuais que toda imagem gerada obedece: paleta, luz, época, o que nunca aparece. Escreva uma vez e vale para o acervo inteiro.",
      },
    ],
  },
  {
    value: "sistema",
    label: "Sistema",
    sections: [
      { value: "campanha", label: "Campanha",
        descricao:
          "Abrir e reiniciar a campanha, e conferir se a chave da IA está respondendo.",
      },
      // Não são fichas: são texto solto para a IA e texto publicado para o
      // leitor. A frase de cada uma diz em que difere do Mundo.
      { value: "biblia", label: "Bíblia",
        descricao:
          "Texto solto que a IA lê antes de escrever, junto com tudo que você escreveu no Mundo. É para o que não cabe numa ficha: o tom da crônica, as regras da mesa, o que nunca deve acontecer. Nada aqui aparece para os jogadores.",
      },
      { value: "canonico", label: "Enciclopédia",
        descricao:
          "Os verbetes que o site publica na página pública da Cidade, e as propostas que a IA tirou dos turnos esperando sua aprovação. Difere do Mundo: lá é a ficha que o jogo usa, aqui é o artigo que o leitor lê.",
      },
      { value: "escriba", label: "Escriba",
        descricao:
          "Pergunta sobre o mundo a quem já leu tudo que você escreveu, e transforma a resposta num verbete da Enciclopédia. É o atalho para não redigir cada verbete à mão.",
      },
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
