/**
 * Quem responde as cartas de cada Casa.
 *
 * Gerado a partir do cânone por backend/scripts/seed-leader-personas.mjs e
 * versionado à mão: a personalidade de um líder é cânone do mundo, vale para
 * qualquer campanha e deve ser editável como qualquer outro texto do cenário.
 *
 * Sem isto toda Casa escreve como a mesma chancelaria educada. Com isto, Lorde
 * Thrain responde como alguém que acha que pedra não suporta duas fundações.
 */
export interface LeaderPersona {
  leaderName: string;
  title: string;
  temperament: string;
  speechStyle: string;
  wants: string;
  refuses: string;
  /** Confiança e lealdade ao trono de Vasco Aranha, e por quê. Entra em toda carta. */
  crownStance: string;
  /** Interesses políticos do momento e favores que a Casa busca ou deve. Entra em toda carta. */
  interests: string;
  /**
   * Casas de quem esta desconfia, por chave de Casa, com o motivo. Injetado só
   * quando a Casa que escreve está no mapa — é o que faz os orcs responderem a
   * Solarion com a memória da escravidão sem tratar todo mundo igual.
   */
  distrusts?: Record<string, string>;
  /** Casas em quem esta confia, mesmo formato. */
  trusts?: Record<string, string>;
}

export const LEADER_PERSONAS: Record<string, LeaderPersona> = {};

export function personaFor(houseKey: string): LeaderPersona | null {
  return LEADER_PERSONAS[houseKey] ?? null;
}
