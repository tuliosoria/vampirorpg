/**
 * O que cada número de atributo realmente significa para aquela Casa.
 *
 * "Riqueza 4" não diz nada sobre com quem negociar. Riqueza 4 em ouro vivo é
 * uma coisa; riqueza 4 em favores devidos é outra, e uma delas não compra
 * mantimento no inverno. O mesmo vale para o resto: mil cavaleiros de estepe e
 * mil fuzileiros de doca não servem para a mesma guerra.
 *
 * Cada linha diz o que a Casa TEM e — quando o cânone é claro — o que lhe
 * FALTA. A escassez é o motor da mesa: é ela que obriga uma Casa a negociar com
 * quem ela detesta, porque o ferro não nasce no deserto e o trigo não cresce
 * dentro da montanha.
 *
 * Escrito a partir de `HOUSE_CANON` e da Enciclopédia; não recalibra as notas,
 * apenas explica o que elas representam.
 */
export interface HouseProfile {
  /** Em que a Riqueza consiste: dinheiro, favores, influência ou necessidade. */
  wealth: string;
  /** O que o território produz — e o que ele não dá. */
  resources: string;
  /** Que tipo de força: marinha, exército de campo, especialistas de terreno. */
  soldiers: string;
  /** Como a Casa manda: pela força, pela influência ou pela estrutura social. */
  control: string;
}

export const HOUSE_PROFILE: Record<string, HouseProfile> = {};

export function houseProfileFor(seatKey: string): HouseProfile | null {
  return HOUSE_PROFILE[seatKey] ?? null;
}
