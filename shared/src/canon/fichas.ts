import { SEATS, reindexSeats, type Seat } from "../diplomacy/geography.js";
import { LEADER_PERSONAS, type LeaderPersona } from "../diplomacy/leaders.js";
import { HOUSE_CHARACTERS, type HouseCharacter } from "../lore/characters.js";
import { HOUSE_PROFILE, type HouseProfile } from "../lore/houseProfile.js";
import { HOUSE_CANON, type HouseCanon } from "../lore/houseCanon.js";

/**
 * A ficha de um clã — a unidade com que o Narrador constrói a Cidade.
 *
 * É uma ficha só de propósito. O motor lê o cânone de cinco constantes
 * separadas (`SEATS`, `LEADER_PERSONAS`, `HOUSE_CHARACTERS`, `HOUSE_PROFILE`,
 * `HOUSE_CANON`), e no Valdren cada uma era um arquivo versionado à mão, o que
 * obrigava quem inventasse uma Casa a lembrar de cinco lugares. Aqui o Narrador
 * preenche uma ficha e `aplicarCanon` a distribui pelas cinco.
 *
 * Só `key` e `name` são obrigatórios: um clã pode entrar na Cidade sendo apenas
 * um nome no mapa e ganhar elenco, escassez e demografia depois. O que estiver
 * vazio simplesmente não alimenta a constante correspondente, e o sistema que
 * dependia dela fica quieto em vez de inventar.
 */
export interface ClaFicha {
  /** Chave canônica, em slug: `cla-ventrue`. É o id em todo o resto do motor. */
  key: string;
  name: string;

  /** O endereço que identifica o domínio: refúgio, sede, ponto de encontro. */
  refugio: string;
  /** Outros lugares que também nomeiam este clã em verbetes e no acervo. */
  outrosLugares: string[];
  /**
   * Onde fica no mapa da Cidade, em pixels de uma imagem 1536×1024.
   *
   * Não é enfeite: é daqui que sai a distância entre dois clãs, e dela o
   * orçamento de cartas por noite. Dois clãs no mesmo ponto se falam à vontade.
   */
  x: number;
  y: number;

  /** Quem responde pelo clã. Vazio = o clã não recebe carta. */
  lider: LeaderPersona | null;
  /** As figuras endereçáveis do clã, além do líder. */
  elenco: HouseCharacter[];
  /**
   * O que o clã tem e o que lhe falta.
   *
   * A escassez é o motor da mesa: é ela que obriga um clã a negociar com quem
   * ele detesta. O texto de `resources` é lido por palavra — o que vem antes de
   * "falta" é sobra, o que vem depois é carência.
   */
  perfil: HouseProfile | null;
  /** Território, gente e força, para a oferta parar de ser chute. */
  dossie: HouseCanon | null;

  updatedAt: string;
}

/** Uma ficha nova, com o mínimo preenchido e o resto por escrever. */
export function fichaVazia(key: string, name: string): ClaFicha {
  return {
    key,
    name,
    refugio: "",
    outrosLugares: [],
    x: 768,
    y: 512,
    lider: null,
    elenco: [],
    perfil: null,
    dossie: null,
    updatedAt: new Date().toISOString(),
  };
}

/** O slug canônico de um nome de clã, para a chave nascer previsível. */
export function chaveDeCla(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Escreve as fichas nas constantes que o motor lê.
 *
 * Substitui o cânone inteiro a cada chamada, e não acumula: o Narrador que
 * apaga um clã precisa vê-lo sumir do mapa, e um `push` incremental deixaria
 * fantasmas para trás. É a mesma costura que os testes usam com `semearCanon`,
 * agora alimentada pelo banco em vez de por dados inventados.
 *
 * O sub-projeto do cânone compilado troca isto por um objeto explícito nas
 * `Deps`. Enquanto o motor ler de módulo, é aqui que o mundo entra.
 */
export function aplicarCanon(fichas: ClaFicha[]): void {
  limparCanonAplicado();

  for (const f of fichas) {
    const seat: Seat = { key: f.key, name: f.name, seat: f.refugio, x: f.x, y: f.y };
    if (f.outrosLugares.length > 0) seat.otherCities = [...f.outrosLugares];
    SEATS.push(seat);

    if (f.lider) LEADER_PERSONAS[f.key] = f.lider;
    if (f.elenco.length > 0) HOUSE_CHARACTERS[f.key] = f.elenco;
    if (f.perfil) HOUSE_PROFILE[f.key] = f.perfil;
    if (f.dossie) HOUSE_CANON[f.key] = f.dossie;
  }

  reindexSeats();
}

/** Devolve as constantes ao vazio com que a crônica nasce. */
export function limparCanonAplicado(): void {
  SEATS.length = 0;
  for (const k of Object.keys(LEADER_PERSONAS)) delete LEADER_PERSONAS[k];
  for (const k of Object.keys(HOUSE_CHARACTERS)) delete HOUSE_CHARACTERS[k];
  for (const k of Object.keys(HOUSE_PROFILE)) delete HOUSE_PROFILE[k];
  for (const k of Object.keys(HOUSE_CANON)) delete HOUSE_CANON[k];
  reindexSeats();
}
