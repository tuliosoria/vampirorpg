import { SEATS, reindexSeats, type Seat } from "../diplomacy/geography.js";
import { LEADER_PERSONAS } from "../diplomacy/leaders.js";
import { HOUSE_CHARACTERS, type HouseCharacter } from "../lore/characters.js";
import { HOUSE_PROFILE, type HouseProfile } from "../lore/houseProfile.js";
import { HOUSE_CANON, type HouseCanon } from "../lore/houseCanon.js";
import type { VozDePersonagem } from "../estudio/modelos.js";

/**
 * A ficha de um clã: o que é do clã, e não de quem o habita.
 *
 * Guarda domínio, coordenada e escassez. O elenco e o líder saíram daqui e
 * viraram derivados — são os personagens que apontam para esta chave, e aquele
 * marcado como quem responde. Escrever a mesma pessoa em dois formulários era
 * como o cânone de uma crônica se contradizia.
 */
export interface ClaFicha {
  /** Chave canônica, em slug: `cla-ventrue`. É o id em todo o resto do motor. */
  key: string;
  name: string;
  /** O que os jogadores sabem sobre este clã. */
  descricao: string;
  /** 🔒 O que o clã esconde. Nunca sai por rota de jogador. */
  segredos: string;

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

  atualizadoEm: string;
}

/**
 * O que `aplicarCanon` precisa saber de um personagem.
 *
 * Estruturalmente mínimo de propósito: o backend passa o personagem inteiro,
 * com objetivos; o navegador passa a projeção pública, que não os tem. Os dois
 * satisfazem este tipo, e é isso que garante que o cliente nunca receba um
 * segredo só porque o motor precisava dele do outro lado.
 */
export interface PersonagemParaCanon {
  id: string;
  nome: string;
  historia: string;
  claKey: string | null;
  respondePeloCla: boolean;
  voz: VozDePersonagem | null;
  /** 🔒 Só o backend preenche. */
  objetivos?: string;
}

/** Uma ficha nova, com o mínimo preenchido e o resto por escrever. */
export function fichaVazia(key: string, name: string): ClaFicha {
  return {
    key, name, descricao: "", segredos: "",
    refugio: "", outrosLugares: [],
    x: 768, y: 512,
    perfil: null, dossie: null,
    atualizadoEm: new Date().toISOString(),
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
 * Escreve o cânone nas constantes que o motor lê.
 *
 * Substitui tudo a cada chamada, e não acumula: o Narrador que apaga um clã ou
 * um personagem precisa vê-lo sumir do mapa e da lista de destinatários, e um
 * `push` incremental deixaria fantasmas recebendo carta para sempre.
 *
 * O sub-projeto do cânone compilado troca isto por um objeto explícito nas
 * `Deps`. Enquanto o motor ler de módulo, é aqui que o mundo entra.
 */
export function aplicarCanon(clas: ClaFicha[], personagens: PersonagemParaCanon[] = []): void {
  limparCanonAplicado();

  for (const f of clas) {
    const seat: Seat = { key: f.key, name: f.name, seat: f.refugio, x: f.x, y: f.y };
    if (f.outrosLugares.length > 0) seat.otherCities = [...f.outrosLugares];
    SEATS.push(seat);

    if (f.perfil) HOUSE_PROFILE[f.key] = f.perfil;
    if (f.dossie) HOUSE_CANON[f.key] = f.dossie;
  }

  const clasConhecidos = new Set(clas.map((c) => c.key));

  for (const p of personagens) {
    // Um personagem que aponta para um clã apagado não vira elenco fantasma.
    if (!p.claKey || !clasConhecidos.has(p.claKey)) continue;

    const figura: HouseCharacter = {
      name: p.nome,
      role: p.voz?.titulo ?? "",
      description: p.historia,
      wants: p.objetivos ?? "",
      hides: "",
    };
    (HOUSE_CHARACTERS[p.claKey] ??= []).push(figura);

    // Quem responde pelo clã dá a voz das cartas. Sem voz escrita não há o que
    // encarnar, então o clã segue mudo em vez de responder como ninguém.
    if (p.respondePeloCla && p.voz) {
      LEADER_PERSONAS[p.claKey] = {
        leaderName: p.nome,
        title: p.voz.titulo,
        temperament: p.voz.temperamento,
        speechStyle: p.voz.comoFala,
        wants: p.voz.oQueQuer,
        refuses: p.voz.oQueRecusa,
        crownStance: p.voz.posturaComACorte,
        interests: p.voz.interesses,
      };
    }
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
