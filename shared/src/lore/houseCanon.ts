/**
 * Dossiê demográfico e territorial de cada Casa.
 *
 * Extraído de cidade-context/PUBLICO/04_POPULACAO_DEMOGRAFIA_E_CAPACIDADE_MILITAR.md
 * por backend/scripts/extract-house-canon.mjs. Nada é inventado aqui: o
 * documento já trazia uma seção por Casa que nunca chegou ao site.
 *
 * Cânone do mundo, não estado de partida — vale para qualquer campanha.
 */
export interface HouseCanon {
  name: string;
  /** Habitantes do território, do censo canônico. */
  population: number | null;
  region: string;
  mainCity: string;
  society: string;
  military: string;
  /** Soldados que a Casa sustenta numa campanha longa. */
  sustainableTroops: number | null;
  /** Mobilização máxima, com custo econômico. */
  emergencyTroops: number | null;
  demographicPressure: string;
}

export const HOUSE_CANON: Record<string, HouseCanon> = {};

export function houseCanonFor(key: string): HouseCanon | null {
  return HOUSE_CANON[key] ?? null;
}
