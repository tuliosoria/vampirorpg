/**
 * Um id do Codex vira o id da entidade visual canônica.
 *
 * Nasce vazio: os dois ids batem por construção. O mapa existe porque no jogo
 * de origem eles divergiram — um retrato foi criado antes de o Codex existir e
 * ficou com outro id, e a ficha do personagem passou a mostrar "retrato em
 * breve" para alguém que já tinha retrato. Uma linha aqui conserta esse caso
 * sem renomear nada no acervo.
 */
const ENTITY_ALIAS: Record<string, string> = {};

export function portraitEntityId(codexId: string): string {
  return ENTITY_ALIAS[codexId] ?? codexId;
}
