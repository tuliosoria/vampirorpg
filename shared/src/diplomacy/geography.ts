/**
 * Onde cada domínio fica no mapa da Cidade, e o quanto isso custa a quem
 * escreve.
 *
 * Na Cidade esta tabela era o atlas de um reino-ilha, com tempos de viagem
 * transcritos de um documento canônico e a capital cravada no código. A Cidade
 * não tem atlas: quem coloca os domínios no mapa é o Narrador, pela interface,
 * e o motor não pode conhecer nenhum deles pelo nome. O que sobrou aqui é só a
 * geometria — distância entre dois pontos e o que ela permite mandar por noite.
 *
 * Nasce vazio. Enquanto o Narrador não cadastrar domínio nenhum, toda consulta
 * devolve null e os sistemas que dependem dela ficam quietos, em vez de mentir.
 */

export interface Seat {
  /** Chave canônica do clã, seita ou facção. */
  key: string;
  name: string;
  /** O endereço que identifica o domínio: refúgio, sede, ponto de encontro. */
  seat: string;
  /**
   * Outros lugares da Cidade que dão nome a verbetes e a peças do acervo.
   *
   * O refúgio nem sempre é o único endereço que identifica quem manda num
   * bairro, e há arte batizada só com o nome do segundo.
   */
  otherCities?: string[];
  x: number;
  y: number;
}

/**
 * Escala do mapa da Cidade: quilômetros por pixel.
 *
 * Calibrado para um mapa de 1536×1024 cobrindo uma área urbana de cerca de
 * trinta quilômetros de ponta a ponta. O Narrador que trocar o mapa troca este
 * número junto, e todas as distâncias acompanham.
 */
export const KM_PER_PIXEL = 30 / 1024;

export const SEATS: Seat[] = [];

const BY_KEY = new Map<string, Seat>();

/**
 * Reconstrói o índice depois que SEATS muda.
 *
 * Existe porque o cânone deixou de ser constante de código: quem povoa `SEATS`
 * agora é o Narrador, em tempo de execução. É o ponto de costura que o
 * sub-projeto do cânone editável substitui por um objeto de cânone explícito.
 */
export function reindexSeats(): void {
  BY_KEY.clear();
  for (const s of SEATS) BY_KEY.set(s.key, s);
}

export function seatOf(key: string): Seat | null {
  if (BY_KEY.size !== SEATS.length) reindexSeats();
  return BY_KEY.get(key) ?? null;
}

/**
 * O domínio correspondente ao personagem de um jogador, ou null quando nenhum.
 *
 * O id nasce de slugify(nome) mais um sufixo aleatório de quatro caracteres,
 * então "ventrue-k0hc" precisa alcançar "cla-ventrue". Tentamos o id inteiro
 * antes do id sem sufixo porque uma chave pode terminar em quatro caracteres
 * legítimos, e cortar primeiro os perderia.
 *
 * Os personagens vivos guardam nomes curtos ("Ventrue", "Nosferatu") enquanto
 * as chaves seguem os títulos do wiki ("Clã Ventrue"), então o título é
 * descartado dos dois lados antes da comparação.
 */
const SEAT_TITLE_PREFIX = /^(cla|clan|casa|seita|ordem|irmandade|corte|bando)(-(?:do|dos|da|das|de))?-/;

export function seatKeyForHouseId(houseId: string): string | null {
  // Dados antigos guardam o nome onde hoje vai o id, então normalizamos para a
  // forma de slug antes de comparar.
  const slug = houseId
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const candidates = [slug, slug.replace(/-[a-z0-9]{4}$/, "")].filter((c) => c.length > 0);

  const exact = SEATS.find((s) => candidates.includes(s.key));
  if (exact) return exact.key;

  for (const candidate of candidates) {
    const bare = candidate.replace(SEAT_TITLE_PREFIX, "");
    const hit = SEATS.find((s) => s.key.replace(SEAT_TITLE_PREFIX, "") === bare || s.key.endsWith(`-${candidate}`));
    if (hit) return hit.key;
  }
  return null;
}

/** Distância em quilômetros entre dois domínios. Simétrica por construção. */
export function distanceKm(a: string, b: string): number | null {
  const sa = seatOf(a);
  const sb = seatOf(b);
  if (!sa || !sb) return null;
  return Math.round(Math.hypot(sa.x - sb.x, sa.y - sb.y) * KM_PER_PIXEL);
}

/**
 * Horas de viagem estimadas entre dois domínios.
 *
 * Numa cidade não existe geleira nem rota marítima: o que separa dois pontos é
 * trânsito, e trânsito é aproximadamente proporcional à distância. Por isso o
 * custo é uniforme, e não uma tabela por rota como era no reino. Se a crônica
 * precisar de uma zona cara de atravessar, isso vira propriedade do domínio no
 * cânone editável, não uma constante aqui.
 */
const HORAS_POR_KM = 0.25;

export function travelDays(a: string, b: string): number | null {
  const km = distanceKm(a, b);
  if (km === null) return null;
  return Math.round(km * HORAS_POR_KM * 10) / 10;
}

export const DISTANCE_BANDS = ["VIZINHA", "PROXIMA", "DISTANTE", "EXTREMA"] as const;
export type DistanceBand = (typeof DISTANCE_BANDS)[number];

/**
 * Os cortes são de calibragem, não de cânone. Medidos nas horas que `travelDays`
 * devolve. Ajustar aqui, num lugar só.
 */
export function bandFor(days: number): DistanceBand {
  if (days <= 1) return "VIZINHA";
  if (days <= 3) return "PROXIMA";
  if (days <= 6) return "DISTANTE";
  return "EXTREMA";
}

/** Envios permitidos por noite. Cada envio recebe uma resposta. */
export const SENDS_PER_BAND: Record<DistanceBand, number> = {
  VIZINHA: 2,
  PROXIMA: 2,
  DISTANTE: 1,
  EXTREMA: 1,
};

export interface Budget {
  band: DistanceBand;
  km: number;
  days: number;
  sends: number;
}

export function budgetBetween(a: string, b: string): Budget | null {
  const km = distanceKm(a, b);
  const days = travelDays(a, b);
  if (km === null || days === null) return null;
  const band = bandFor(days);
  return { band, km, days, sends: SENDS_PER_BAND[band] };
}
