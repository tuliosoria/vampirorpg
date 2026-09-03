/**
 * As abas de /game.
 *
 * A página era uma rolagem só, com seis blocos grandes empilhados. Tudo estava
 * lá e nada era achável: comprar informação exigia rolar até Empreitadas,
 * descobrir que existe uma Biblioteca dentro dela, e então achar a carta certa
 * numa lista longa. Três níveis de profundidade para uma ação de toda noite.
 *
 * A ordem é a do uso: primeiro o que ele veio fazer, depois o que ele consulta.
 */
export interface GameTab {
  value: string;
  label: string;
  /** O que a aba resolve, para o jogador que ainda não sabe onde clicar. */
  hint: string;
}

export const GAME_TABS: GameTab[] = [
  { value: "turnos", label: "Noites", hint: "A noite aberta e todas as que já passaram" },
  { value: "casa", label: "Meu personagem", hint: "Atributos, posses e o que você tem" },
  { value: "projetos", label: "Empreitadas", hint: "Domínio, influência, rebanho e refúgio" },
  { value: "espioes", label: "Olhos na cidade", hint: "Comprar informação na rua e plantar rumores" },
  { value: "pactos", label: "Pactos", hint: "Alianças, acordos e dívidas" },
  { value: "cartas", label: "Correspondência", hint: "Escrever aos outros e ler o que chegou" },
];

export const DEFAULT_GAME_TAB = "turnos";

/**
 * Onde as abas antigas foram parar.
 *
 * "O Turno" e "Histórico" eram a mesma coisa partida em duas: quem abria a
 * primeira via só o turno corrente — e quando o Mestre ainda não o tinha
 * aberto, via um aviso vazio e concluía que o jogo tinha sumido. Os sete turnos
 * anteriores estavam a uma aba de distância, sem nada que dissesse isso.
 *
 * Os dois valores continuam entrando: há link salvo e há o menu do site
 * apontando para ?aba=turno.
 */
const ABAS_ANTIGAS: Record<string, string> = { turno: "turnos", historico: "turnos" };

export function isGameTab(v: string | null): boolean {
  return !!v && GAME_TABS.some((t) => t.value === v);
}

export function gameTabOf(v: string | null): string {
  if (isGameTab(v)) return v as string;
  if (v && ABAS_ANTIGAS[v]) return ABAS_ANTIGAS[v];
  return DEFAULT_GAME_TAB;
}
