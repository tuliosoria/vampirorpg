export interface DefaultGmEntry {
  section: string;
  title: string;
  body: string;
  order: number;
}

/**
 * The GM-only lore of a Cidade, the buried truth of the campaign. This content
 * is seeded into the Bíblia do Mestre and shown only to the admin. It reveals
 * that the Pale King is o Príncipe I, the king a Cidade erased; the ancient betrayal
 * of the Great Houses; the phases for revealing the truth; and o Príncipe's three
 * anchors. None of it is ever served through a public endpoint.
 */
export const DEFAULT_GM_ENTRIES: DefaultGmEntry[] = [];
