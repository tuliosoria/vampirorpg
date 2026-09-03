import { isDeadInChronicle } from "@vampiro/content";

/**
 * Descobre se o líder canônico de uma Casa morreu no que já aconteceu na
 * campanha.
 *
 * As personas nascem do wiki, que descreve a Cidade antes da crise. A campanha
 * seguiu: o incêndio do Banco levou, no turno 3, o líder de um clã e a herdeira de
 * Brujah. Sem esta checagem, Brujah assinaria cartas com o nome de alguém que
 * morreu afogado, e o erro apareceria já na primeira linha.
 *
 * A detecção mora em `shared` porque a página de cada Casa precisa da mesma
 * resposta que a diplomacia: duas implementações divergiriam, e um morto vivo
 * numa das telas é pior do que em nenhuma.
 */
export function leaderIsDead(leaderName: string, chronicle: string): boolean {
  return isDeadInChronicle(leaderName, chronicle);
}
