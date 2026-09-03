/**
 * Um cânone sintético mínimo, só para os testes do motor.
 *
 * A crônica de verdade nasce vazia e é o Narrador quem a povoa, então nenhum
 * teste pode mais afirmar sobre "a Casa Valerius" nem sobre dezesseis sedes: o
 * que restou para testar é o comportamento das funções, e comportamento precisa
 * de dados de entrada. Estes são esses dados — três clãs inventados que não
 * pertencem a nenhuma crônica e que ninguém vai confundir com conteúdo.
 *
 * As funções do motor ainda leem de constantes de módulo em vez de receber o
 * cânone por parâmetro, então semear aqui significa escrever dentro dessas
 * constantes. Essa mutação é deliberada e é o ponto de costura que o
 * sub-projeto do cânone editável remove, quando o cânone passar a ser um objeto
 * explícito injetado pelas `Deps`. Até lá, todo teste que semeia precisa
 * limpar depois — `limparCanon()` no `afterEach`.
 */
import { SEATS, reindexSeats, type Seat } from "../diplomacy/geography.js";
import { LEADER_PERSONAS, type LeaderPersona } from "../diplomacy/leaders.js";
import { HOUSE_CHARACTERS, type HouseCharacter } from "../lore/characters.js";
import { HOUSE_PROFILE, type HouseProfile } from "../lore/houseProfile.js";
import { HOUSE_CANON, type HouseCanon } from "../lore/houseCanon.js";
import { ROSTER_CODEX } from "../npc/rosterCodex.js";
import { NPC_BIOGRAPHIES } from "../lore/biographies.js";
import { DEFAULT_WIKI_ENTRIES, type DefaultWikiEntry } from "../defaultWiki.js";
import type { NpcIdentity } from "../npc/codex.js";
import { DEFAULT_PROJECT_TEMPLATES } from "../projectTemplates.js";
import type { ProjectTemplate } from "../projects.js";
import { TEMPLATE_RUMOR_FALSO } from "../porto.js";

export const SEDES_DE_TESTE: Seat[] = [
  { key: "cla-ventrue", name: "Clã Ventrue", seat: "Banco Providência", x: 700, y: 500 },
  {
    key: "cla-nosferatu",
    name: "Clã Nosferatu",
    seat: "Galeria Subterrânea",
    otherCities: ["Cais Velho"],
    x: 740, y: 520,
  },
  { key: "cla-toreador", name: "Clã Toreador", seat: "Teatro Municipal", x: 1200, y: 900 },
  /**
   * Existe para um teste específico: o nome curto deste é "ouro", que aparece
   * dentro de "couro" e "tesouro" e também é palavra comum em minúscula. É o
   * caso que revelou, no corpus real, que casar sem borda de palavra faz um
   * verbete citar quem ele nunca citou.
   */
  { key: "casa-do-ouro", name: "Casa do Ouro", seat: "Ferro-velho da Marginal", x: 300, y: 200 },
  { key: "cla-brujah", name: "Clã Brujah", seat: "Ocupação da Rua Treze", x: 500, y: 800 },
  { key: "cla-tremere", name: "Clã Tremere", seat: "Capela da Consolação", x: 1000, y: 300 },
  { key: "cla-gangrel", name: "Clã Gangrel", seat: "Parque do Norte", x: 620, y: 120 },
  { key: "cla-malkavian", name: "Clã Malkavian", seat: "Antigo Sanatório", x: 1300, y: 150 },
  { key: "cla-ravnos", name: "Clã Ravnos", seat: "Rodoviária velha", x: 200, y: 780 },
  { key: "cla-setita", name: "Clã Setita", seat: "Casa de banhos", x: 880, y: 960 },
  { key: "corte-do-sangue", name: "Corte do Sangue", seat: "Salão da Primazia", x: 760, y: 460 },
];

/** Perfil raso para as facções que só precisam existir no mapa. */
function perfilRaso(tem: string, falta: string): HouseProfile {
  return {
    wealth: "O suficiente para a noite.",
    resources: `${tem}; falta-lhe ${falta}.`,
    soldiers: "Os de sempre.",
    control: "Manda no que alcança.",
  };
}

export const PERSONAS_DE_TESTE: Record<string, LeaderPersona> = {
  "cla-ventrue": {
    leaderName: "Vasco Aranha",
    title: "Príncipe da Cidade",
    temperament: "paciente e cobrador",
    speechStyle: "Frases curtas. Nunca levanta a voz porque nunca precisou.",
    wants: "Que a Máscara continue de pé e que todos lhe devam alguma coisa.",
    refuses: "Perdoar dívida em público.",
    crownStance: "É a corte. Confia na Camarilla porque a Camarilla é ele.",
    interests: "Comprar dívida alheia e cobrá-la na noite mais cara.",
    distrusts: { "cla-nosferatu": "Sabem coisas que ele preferia enterradas." },
    trusts: { "cla-toreador": "Precisam do dinheiro dele para manter o teatro aberto." },
  },
  "cla-nosferatu": {
    leaderName: "Rala",
    title: "a que conta os túneis",
    temperament: "desconfiada e irônica",
    speechStyle: "Responde com pergunta. Guarda a informação até doer.",
    wants: "Ser deixada em paz debaixo da cidade.",
    refuses: "Aparecer num salão iluminado.",
    crownStance: "Obedece à corte de longe e não comparece ao que não é obrigada.",
    interests: "Trocar segredo por segurança.",
  },
};

export const ELENCO_DE_TESTE: Record<string, HouseCharacter[]> = {
  "cla-ventrue": [
    {
      name: "Vasco Aranha",
      role: "Príncipe",
      description: "Abraçado em 1908, quando o dinheiro do café ainda mandava.",
      wants: "Que a cidade continue lhe devendo.",
      hides: "Que perdeu o controle do porto há duas noites.",
    },
    {
      name: "Inês do Vale",
      role: "Carniçal",
      description: "Administra o que Vasco não pode assinar de dia.",
      wants: "O Abraço.",
      hides: "Que já pediu, e ouviu não.",
    },
  ],
  "cla-nosferatu": [
    {
      name: "Rala",
      role: "Anciã",
      description: "Conhece os túneis melhor do que a prefeitura conhece as ruas.",
      wants: "Silêncio.",
      hides: "Que vende o mesmo segredo duas vezes.",
    },
  ],
};

export const PERFIS_DE_TESTE: Record<string, HouseProfile> = {
  "cla-ventrue": {
    wealth: "Dinheiro velho e dívida alheia.",
    // A virada da frase é o que o motor lê: o que vem antes de "falta" é sobra,
    // o que vem depois é escassez. É esse encaixe que faz um clã escrever ao outro.
    resources: "Bancos, cartórios e um juiz de plantão; falta-lhe silêncio e gente que ande sem ser vista.",
    soldiers: "Poucos, e todos alugados.",
    control: "Manda pelo que os outros devem, não pelo que pode quebrar.",
  },
  "cla-nosferatu": {
    wealth: "Nenhuma; troca em segredo.",
    resources: "Silêncio de sobra e os túneis por onde ninguém olha; falta-lhe dinheiro.",
    soldiers: "Ninguém que apareça num relatório.",
    control: "Manda porque sabe.",
  },
  "cla-toreador": {
    wealth: "Vive do que a plateia paga e do que os patronos perdoam.",
    resources: "Rebanho farto, todo santo fim de semana; falta-lhe músculo quando a noite vira.",
    soldiers: "Admiradores, o que não é a mesma coisa.",
    control: "Manda pelo convite que dá e pelo que nega.",
  },
  "casa-do-ouro": {
    wealth: "Troca tudo por dinheiro, inclusive o que não deveria.",
    resources: "Documentos e certidões de qualquer nome; falta-lhe território que seja seu.",
    soldiers: "Compra quando precisa.",
    control: "Manda enquanto o pagamento estiver em dia.",
  },
  "cla-brujah": {
    wealth: "Nenhuma, e faz questão.",
    resources: "Músculo e território de sobra na zona leste; falta-lhe informação do que a corte decide.",
    soldiers: "Gente que aparece quando chamam.",
    control: "Manda porque ninguém quer discutir.",
  },
  "cla-tremere": {
    wealth: "O bastante para não precisar pedir.",
    resources: "Arquivo e segredos que ninguém mais guardou; falta-lhe sangue de doador confiável.",
    soldiers: "Poucos, e nenhum dispensável.",
    control: "Manda pelo que sabe fazer e não explica.",
  },
  "cla-gangrel": perfilRaso("Território de sobra fora da cidade", "documentos"),
  "cla-malkavian": perfilRaso("Informação que ninguém pediu", "refúgio"),
  "cla-ravnos": perfilRaso("Documentos de qualquer nome", "território"),
  "cla-setita": perfilRaso("Rebanho e sangue farto", "influência"),
  "corte-do-sangue": perfilRaso("Influência sobre a cidade inteira", "músculo"),
};

/** O dossiê territorial de cada clã: quanta gente, onde, com que força. */
export const CANON_DE_TESTE: Record<string, HouseCanon> = {
  "cla-ventrue": {
    name: "Clã Ventrue",
    population: 150000,
    region: "Centro velho, distrito financeiro e o que sobrou do porto.",
    mainCity: "Banco Providência",
    society: "Gente que trabalha em prédio com catraca e não sabe de nada.",
    military: "Segurança privada, e um batalhão que atende ao telefone.",
    sustainableTroops: 40,
    emergencyTroops: 120,
    demographicPressure: "O centro esvazia à noite, e isso é conveniente para todo mundo.",
  },
  "cla-nosferatu": {
    name: "Clã Nosferatu",
    population: 90000,
    region: "Galerias, córregos canalizados e o subsolo da rodoviária.",
    mainCity: "Galeria Subterrânea",
    society: "Quem some da cidade some para cá primeiro.",
    military: "Ninguém que apareça num relatório.",
    sustainableTroops: 15,
    emergencyTroops: 60,
    demographicPressure: "A prefeitura recapeou a avenida e fechou duas entradas.",
  },
};

/** Um figurante: existe parà Cidade ter gente, não para ter ficha. */
function npcRaso(id: string, name: string, role: string, affiliation: string): NpcIdentity {
  return {
    id, name, role, affiliation,
    tier: "RELEVANT",
    location: "",
    personality: "Ocupado com a própria vida.",
    speechStyle: "Fala como quem quer voltar ao trabalho.",
    values: "O emprego.",
    fears: "Perder o emprego.",
    ambitions: "Chegar em casa.",
    redLines: "Não se mete no que não é dele.",
    secrets: "",
    roleplayGuidance: "Não sabe de nada, e é verdade.",
  };
}

export const NPCS_DE_TESTE: NpcIdentity[] = [
  {
    id: "juiz-moreira",
    name: "Juiz Moreira",
    role: "Magistrado",
    tier: "RELEVANT",
    affiliation: "cla-ventrue",
    location: "Fórum central",
    personality: "Cordial e assustado.",
    speechStyle: "Formal demais para quem já foi comprado.",
    values: "A própria reputação.",
    fears: "Que perguntem de onde veio a casa de praia.",
    ambitions: "Chegar ao tribunal superior.",
    redLines: "Não assina nada que deixe rastro no nome dele.",
    secrets: "É carniçal de Vasco há onze anos.",
    roleplayGuidance: "Educado, evasivo, muda de assunto quando o nome de Vasco aparece.",
  },
  {
    id: "capita-solano",
    name: "Capitã Solano",
    role: "Delegada da Sétima",
    tier: "RELEVANT",
    affiliation: "cla-brujah",
    location: "Distrito da Rua Treze",
    personality: "Direta e cansada.",
    speechStyle: "Fala como quem já ouviu essa história antes.",
    values: "Os próprios policiais, e mais ninguém.",
    fears: "Perder o distrito para quem paga melhor.",
    ambitions: "Se aposentar viva.",
    redLines: "Não entrega gente da sua equipe.",
    secrets: "Sabe que três corpos do ano passado não tinham sangue.",
    roleplayGuidance: "Desconfiada de qualquer explicação limpa demais.",
  },
  {
    id: "padre-elias",
    name: "Padre Elias",
    role: "Pároco da Consolação",
    tier: "RELEVANT",
    affiliation: "cla-tremere",
    location: "Capela da Consolação",
    personality: "Gentil e insone.",
    speechStyle: "Pergunta mais do que responde.",
    values: "A paróquia.",
    fears: "Que o que mora no porão suba.",
    ambitions: "Ser transferido.",
    redLines: "Não abre o porão para ninguém.",
    secrets: "Assinou algo que não leu, em 1994.",
    roleplayGuidance: "Evasivo sobre a capela; caloroso sobre qualquer outro assunto.",
  },
  npcRaso("delegado-arruda", "Delegado Arruda", "Corregedor", "cla-brujah"),
  npcRaso("dona-marlene", "Dona Marlene", "Dona do bar da esquina", "cla-toreador"),
  npcRaso("wilson-cavalcanti", "Wilson Cavalcanti", "Vereador", "casa-do-ouro"),
  npcRaso("irma-benedita", "Irmã Benedita", "Enfermeira do turno da noite", "cla-tremere"),
  npcRaso("tico", "Tico", "Cobrador de van", "cla-ravnos"),
  npcRaso("professor-haddad", "Professor Haddad", "Arquivista da biblioteca", "cla-malkavian"),
  npcRaso("neide-do-corte", "Neide do Corte", "Cabeleireira", "cla-toreador"),
  npcRaso("seu-jorge-portaria", "Seu Jorge", "Porteiro do edifício central", "cla-ventrue"),
  npcRaso("dra-simone", "Dra. Simone", "Legista", "cla-gangrel"),
  npcRaso("bruno-da-oficina", "Bruno da Oficina", "Mecânico noturno", "cla-setita"),
];

/**
 * Um catálogo mínimo de cartas.
 *
 * Os ids são os que os testes de rota exercitam: uma carta comum, uma que exige
 * o aceite do alvo, uma de alvo secreto e uma compra de rumor. O catálogo real
 * é escrito pelo Narrador; estas quatro existem só para que as regras de alvo,
 * custo e teto tenham o que processar.
 */
/**
 * Toda carta de teste concede alguma coisa: uma carta sem ganho mecânico é um
 * defeito que o painel existe para denunciar, e um catálogo cheio delas faria
 * o teste passar por acidente.
 */
function carta(
  id: string,
  title: string,
  description: string,
  over: {
    category: string;
    durationTurns: number;
    ganho: { attribute: string; amount: number };
    qualitativos?: string[];
    requiresGmApproval?: boolean;
    requiresTargetApproval?: boolean;
    requiresSecretTarget?: boolean;
  },
) {
  const { category, durationTurns, ganho, qualitativos, ...flags } = over;
  return {
    id, title, description, category, durationTurns,
    costs: [{ type: "WEALTH", amount: 1, timing: "ON_START" }],
    requirements: [],
    risks: [],
    complications: [],
    completionEffects: {
      attributeChanges: [{ ...ganho, permanent: true }],
      favors: [],
      assets: [],
      qualitativeEffects: qualitativos ?? [],
      unlocks: [],
    },
    ...flags,
  };
}

export const CARTAS_DE_TESTE: ProjectTemplate[] = [
  carta("criar-uma-rede-de-batedores", "Criar uma rede de olheiros", "Gente sua em portaria, garagem e balcão.", {
    category: "INTELLIGENCE",
    durationTurns: 3,
    ganho: { attribute: "recursos", amount: 1 },
    qualitativos: ["O Mestre honra na narrativa: você ouve antes dos outros."],
  }),
  carta("rumores-da-rua-o-que-nao-se-explica", "Comprar rumores: o que não se explica", "Desaparecimentos e o que a polícia arquivou.", {
    category: "INTELLIGENCE",
    durationTurns: 2,
    ganho: { attribute: "riqueza", amount: 1 },
  }),
  carta("contratar-uma-companhia-mercenaria", "Contratar músculo de fora", "Gente que não tem laço na cidade, e por isso não hesita.", {
    category: "MILITARY",
    durationTurns: 2,
    ganho: { attribute: "soldados", amount: 1 },
  }),
  // A única que passa pelo Mestre. Deliberadamente não sobe o atributo mais alto
  // de ninguém: se ela liderasse a lista de recomendadas, o primeiro projeto de
  // todo jogador nasceria PENDING_GM em vez de ativo.
  carta("contratar-a-corte-do-sangue", "Pedir um favor à corte", "A corte atende. A corte cobra.", {
    category: "DIPLOMACY",
    durationTurns: 2,
    ganho: { attribute: "controle", amount: 1 },
    requiresGmApproval: true,
  }),
  carta("enviar-um-presente-cerimonial", "Enviar um presente formal", "Cortesia entre clãs, que sempre cobra depois.", {
    category: "DIPLOMACY",
    durationTurns: 1,
    ganho: { attribute: "controle", amount: 1 },
    requiresTargetApproval: true,
  }),
  // Sabotagem não pede licença: exige alvo e não consulta a vítima.
  carta(TEMPLATE_RUMOR_FALSO, "Plantar um rumor falso", "A mentira certa, na boca certa.", {
    category: "INTELLIGENCE",
    durationTurns: 1,
    ganho: { attribute: "controle", amount: 1 },
    requiresSecretTarget: true,
    requiresTargetApproval: false,
  }),
] as unknown as ProjectTemplate[];

/**
 * Verbetes sintéticos, para as telas que existem para mostrar cânone.
 *
 * Sem nenhum verbete, a enciclopédia, o acervo e o detector de menções ficam
 * corretamente em branco — e o teste deixa de exercitar qualquer coisa.
 */
export const VERBETES_DE_TESTE: DefaultWikiEntry[] = [
  {
    section: "visao-geral",
    title: "A Cidade, depois do anoitecer",
    body: "Dois milhões de pessoas, e algumas centenas que não são mais pessoas. A corte chama isso de equilíbrio.",
    order: 0,
  },
  {
    section: "clas",
    title: "Clã Ventrue",
    body: "Dinheiro velho, dívida nova. O **Banco Providência** ainda abre às nove, e ninguém pergunta quem assina depois das seis.",
    order: 0,
  },
  {
    section: "clas",
    title: "Clã Nosferatu",
    body: "Vivem sob a cidade e sabem o que ela enterrou. A Galeria Subterrânea tem mais saídas do que planta baixa.",
    order: 1,
  },
  {
    section: "clas",
    title: "Clã Tremere — O Sangue da Coroa",
    body: "Guardam o que ninguém mais quis guardar, e cobram caro para consultar.",
    order: 2,
  },
  {
    section: "clas",
    title: "Clã Toreador — Os Lobos da Fronteira",
    body: "Vivem do que a plateia paga e do que os patronos perdoam.",
    order: 3,
  },
  {
    section: "religioes",
    title: "A fé que sobrou",
    body: "Três paróquias abertas, uma delas com o porão trancado desde 1994.",
    order: 0,
  },
  {
    section: "bairros",
    title: "Atlas da Cidade",
    body: "Quatro domínios reconhecidos pela corte, e duas zonas que ninguém reivindica em voz alta.",
    order: 0,
  },
  {
    section: "lugares",
    title: "Banco Providência",
    body: "Fachada de 1911, cofre no subsolo e um andar que não aparece na planta.",
    order: 0,
  },
  {
    section: "corte",
    title: "A corte de Vasco Aranha",
    body: "O Príncipe recebe às terças. Quem falta duas vezes deixa de ser convidado, e deixar de ser convidado é o aviso.",
    order: 0,
  },
  {
    section: "mortais",
    title: "Censo da Cidade",
    body: "A Cidade tem aproximadamente **2.000.000 de habitantes**. A corte considera isso rebanho suficiente.",
    order: 0,
  },
];

/** Biografias autoradas, chaveadas por `afiliação:id` como no cânone real. */
export const BIOGRAFIAS_DE_TESTE: Record<string, string> = {
  "cla-ventrue:juiz-moreira": "Nasceu no interior, chegou à capital com uma mala e uma carta de recomendação falsa. Nunca soube que a carta era falsa.",
};

/** Enche as constantes de cânone com os dados sintéticos acima. */
export function semearCanon(): void {
  DEFAULT_PROJECT_TEMPLATES.push(...CARTAS_DE_TESTE);
  SEATS.push(...SEDES_DE_TESTE);
  reindexSeats();
  Object.assign(LEADER_PERSONAS, PERSONAS_DE_TESTE);
  Object.assign(HOUSE_CHARACTERS, ELENCO_DE_TESTE);
  Object.assign(HOUSE_PROFILE, PERFIS_DE_TESTE);
  Object.assign(HOUSE_CANON, CANON_DE_TESTE);
  ROSTER_CODEX.push(...NPCS_DE_TESTE);
  Object.assign(NPC_BIOGRAPHIES, BIOGRAFIAS_DE_TESTE);
  DEFAULT_WIKI_ENTRIES.push(...VERBETES_DE_TESTE);
}

/** Devolve as constantes ao vazio com que a crônica nasce. */
export function limparCanon(): void {
  DEFAULT_PROJECT_TEMPLATES.length = 0;
  SEATS.length = 0;
  reindexSeats();
  for (const k of Object.keys(LEADER_PERSONAS)) delete LEADER_PERSONAS[k];
  for (const k of Object.keys(HOUSE_CHARACTERS)) delete HOUSE_CHARACTERS[k];
  for (const k of Object.keys(HOUSE_PROFILE)) delete HOUSE_PROFILE[k];
  for (const k of Object.keys(HOUSE_CANON)) delete HOUSE_CANON[k];
  ROSTER_CODEX.length = 0;
  for (const k of Object.keys(NPC_BIOGRAPHIES)) delete NPC_BIOGRAPHIES[k];
  DEFAULT_WIKI_ENTRIES.length = 0;
}
