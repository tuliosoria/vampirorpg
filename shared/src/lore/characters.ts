/**
 * O elenco de cada Casa: quem lidera, quem herda, quem discorda.
 *
 * Gerado a partir do cânone por backend/scripts/seed-house-characters.mjs e
 * versionado à mão. Cânone do mundo, não estado de partida: quem está vivo
 * sai de `isDeadInChronicle`, em mortality.ts.
 */
export interface HouseCharacter {
  name: string;
  role: string;
  description: string;
  wants: string;
  hides: string;
}

/**
 * Um id estável para um personagem, derivado do nome.
 *
 * O canon não guarda id — o nome é a fonte. Endereçar uma carta a uma pessoa
 * precisa de uma chave curta e estável que sobreviva a reordenar o elenco, e
 * um slug do nome é isso. Só a primeira parte do nome entra: vários nomes aqui
 * embutem o cargo depois de uma vírgula ("Lorde Vasco Ouro, Comandante
 * da Cavalaria…"), e o cargo não faz parte da identidade.
 */
export function characterId(name: string): string {
  return name
    .split(",")[0]
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** O elenco endereçável de uma Casa. */
export function houseRoster(houseKey: string): HouseCharacter[] {
  return HOUSE_CHARACTERS[houseKey] ?? [];
}

/** Resolve um personagem pela Casa e pelo id, ou null se não existir ali. */
export function characterFor(houseKey: string, id: string): HouseCharacter | null {
  return houseRoster(houseKey).find((c) => characterId(c.name) === id) ?? null;
}

export const HOUSE_CHARACTERS: Record<string, HouseCharacter[]> = {};

export function charactersFor(key: string): HouseCharacter[] {
  return HOUSE_CHARACTERS[key] ?? [];
}
