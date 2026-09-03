export interface GmSection {
  id: string;
  label: string;
}

/**
 * As seções da Bíblia do Mestre, que só o Narrador vê.
 *
 * NUNCA saem por endpoint público: é aqui que vive o que estragaria a crônica
 * se vazasse. A separação da wiki do jogador é estrutural, e não uma questão de
 * lembrar de esconder.
 *
 * As seções são gavetas, não conteúdo: no jogo de origem uma delas levava o
 * nome próprio de um vilão daquela campanha, anunciado na interface a quem
 * abrisse a aba. Estas nomeiam o TIPO de segredo, e servem a qualquer crônica.
 */
export const GM_SECTIONS: GmSection[] = [
  { id: "a-verdade", label: "A Verdade" },
  { id: "casas-segredo", label: "O que cada clã esconde" },
  { id: "revelacao", label: "Como revelar, e quando" },
  { id: "ancoras", label: "Conspirações em curso" },
  { id: "pergunta", label: "A Pergunta Central" },
];

export const GM_SECTION_IDS: string[] = GM_SECTIONS.map((s) => s.id);

export function gmSectionLabel(id: string): string {
  return GM_SECTIONS.find((s) => s.id === id)?.label ?? id;
}

export interface GmEntry {
  entryId: string;
  section: string;
  title: string;
  body: string;
  order: number;
  updatedAt: string;
}
