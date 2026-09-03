import type { NavLink } from "./NavMenu";

/**
 * A navegação, organizada por quem está pedindo — não por como o código está
 * dividido.
 *
 * Três destinos, cada um com um dono claro: o leitor, o jogador e o Narrador.
 */

export const WORLD_LINKS: NavLink[] = [
  { label: "A crônica", to: "/cidade", hint: "A wiki da Cidade, noite a noite" },
  { label: "Os Clãs", to: "/clas", hint: "Quem divida Cidade, com dossiê e símbolo", tambem: ["/cla"] },
  { label: "Personagens", to: "/personagens", hint: "O elenco da Cidade, com retrato e ficha" },
  { label: "Histórias Contadas", to: "/historias", hint: "Os verbetes da crônica, narrados em áudio" },
  { label: "Galeria", to: "/galeria", hint: "As imagens da crônica, noite a noite" },
];

/**
 * As portas do jogo, uma por aba de /game.
 *
 * Cada aba tem URL própria para que o menu leve direto ao lugar, em vez de
 * esconder o que o jogo tem atrás de um destino só.
 */
export const PLAY_LINKS: NavLink[] = [
  { label: "Minhas noites", to: "/game?aba=turnos", hint: "A noite aberta e todas as que já passaram", tambem: ["/game"] },
  { label: "Meu personagem", to: "/game?aba=casa", hint: "Atributos, posses e o que você tem" },
  { label: "Empreitadas", to: "/game?aba=projetos", hint: "Domínio, influência, rebanho e refúgio" },
  { label: "Olhos na cidade", to: "/game?aba=espioes", hint: "Comprar informação e plantar rumores" },
  { label: "Pactos e dívidas", to: "/game?aba=pactos", hint: "Alianças, acordos e quem lhe deve um favor" },
  { label: "Correspondência", to: "/game?aba=cartas", hint: "Escrever aos outros e ler o que chegou" },
  { label: "Criar seu vampiro", to: "/criar", hint: "Escolher um clã e entrar na crônica" },
];

/** Só para o Narrador. O jogador nunca vê este destino. */
export const STUDIO_LINKS: NavLink[] = [
  { label: "Painel do Narrador", to: "/admin", hint: "A noite: ordens, correspondência e resolução" },
  { label: "Os personagens", to: "/admin?tab=casas", hint: "Personagens, relações entre eles e NPCs vivos" },
  { label: "Construir a Cidade", to: "/admin?tab=mundo", hint: "Bíblia, cânone, prompts e o Estúdio de imagens" },
  // São duas portas de propósito. O formulário de /canonico tem a revisão de
  // IA e a classificação automática de seção, e pede sessão de JOGADOR — o
  // verbete sai atribuído àquele personagem e entra na fila. A aba do painel
  // publica direto, sem fila.
  { label: "Adicionar Canônico", to: "/canonico", hint: "Escrever um verbete com revisão da IA (pede código de jogador)" },
  { label: "Fila do cânone", to: "/admin?tab=mundo&sec=canonico", hint: "Despachar propostas e publicar verbetes direto" },
];

/**
 * As portas de entrada.
 *
 * O painel do Narrador precisa estar aqui, e não só dentro do Estúdio: o
 * Estúdio só aparece para quem já tem token, e o token se obtém entrando em
 * /admin. Deixar a entrada apenas lá dentro trancava a porta pelo lado de fora.
 */
export const ENTER_LINKS: NavLink[] = [
  { label: "Entrar como jogador", to: "/login", hint: "Com o seu código" },
  { label: "Entrar como Narrador", to: "/admin", hint: "Com o código de admin" },
];
