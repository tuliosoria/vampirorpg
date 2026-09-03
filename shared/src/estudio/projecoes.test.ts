import { describe, it, expect } from "vitest";
import {
  bairroParaJogador, cidadeParaJogador, contosParaJogador, localParaJogador,
  personagemParaJogador, tramaParaJogador, tramasParaJogador,
} from "./projecoes.js";
import type {
  Bairro, Cidade, Conto, Local, Personagem, PersonagemPublico, Trama, TramaPublica,
} from "./modelos.js";

/**
 * A palavra que não pode atravessar.
 *
 * Cada campo secreto das fixturas contém este marcador. O teste não confere
 * nome de campo: varre o JSON inteiro atrás da palavra. É o que faz a rede
 * sobreviver a campos que ainda não existem — quem acrescentar um segredo novo
 * e esquecer de descartá-lo é pego aqui, mesmo sem escrever teste nenhum.
 */
const SEGREDO = "ISTO_NUNCA_PODE_VAZAR";

const cidade: Cidade = {
  nome: "São Paulo",
  descricao: "Vinte milhões de pessoas e algumas centenas que não são mais pessoas.",
  segredos: `A prefeitura sabe. ${SEGREDO}`,
  atualizadoEm: "",
};

const bairro: Bairro = {
  id: "centro-velho",
  nome: "Centro Velho",
  descricao: "Prédios dos anos trinta, esvaziados depois das seis.",
  atmosfera: "decadente",
  segredos: `Três entradas para a galeria. ${SEGREDO}`,
  atualizadoEm: "",
};

const personagem: Personagem = {
  id: "vasco-aranha",
  nome: "Vasco Aranha",
  historia: "Abraçado em 1908, quando o dinheiro do café ainda mandava.",
  tipo: "VAMPIRO",
  claKey: "cla-ventrue",
  respondePeloCla: true,
  bairroId: "centro-velho",
  voz: {
    titulo: "Príncipe", temperamento: "paciente", comoFala: "Frases curtas.",
    oQueQuer: "Que lhe devam.", oQueRecusa: "Perdoar em público.",
    posturaComACorte: "É a corte.", interesses: "Comprar dívida.",
  },
  poder: "ALTO",
  objetivos: `Quer o porto de volta. ${SEGREDO}`,
  relacoes: [{ paraId: "rala", tipo: "INIMIGO", descricao: `Ela sabe do incêndio. ${SEGREDO}` }],
  atualizadoEm: "",
};

const local: Local = {
  id: "banco-providencia",
  nome: "Banco Providência",
  bairroId: "centro-velho",
  descricao: "Fachada de 1911, cofre no subsolo.",
  segredos: `Um andar que não aparece na planta. ${SEGREDO}`,
  personagemIds: ["vasco-aranha"],
  tramaIds: ["a-divida"],
  atualizadoEm: "",
};

const tramaVisivel: Trama = {
  id: "a-divida",
  nome: "A dívida do porto",
  importancia: "PRINCIPAL",
  estado: "ATIVA",
  visivel: true,
  descricaoPublica: "Alguém está comprando as dívidas do cais, e ninguém sabe quem.",
  verdadeDoMestre: `É o próprio Príncipe. ${SEGREDO}`,
  personagens: [{ personagemId: "vasco-aranha", papel: `conspirador ${SEGREDO}` }],
  localIds: ["banco-providencia"],
  atualizadoEm: "",
};

const tramaInvisivel: Trama = {
  ...tramaVisivel,
  id: "o-que-dorme",
  nome: `O que dorme sob a catedral ${SEGREDO}`,
  visivel: false,
  descricaoPublica: `Nem o nome disto pode aparecer. ${SEGREDO}`,
};

const contoPublico: Conto = {
  id: "o-incendio", titulo: "O incêndio de 1987", historia: "Durou até o amanhecer.",
  tipo: "EVENTO", visibilidade: "PUBLICO", periodo: "1987", atualizadoEm: "",
};

const contoDoMestre: Conto = {
  id: "a-verdade-do-incendio", titulo: `Quem acendeu ${SEGREDO}`,
  historia: `Foi ele. ${SEGREDO}`, tipo: "HORROR", visibilidade: "MESTRE",
  periodo: "1987", atualizadoEm: "",
};

function vazou(valor: unknown): boolean {
  return JSON.stringify(valor).includes(SEGREDO);
}

/**
 * A garantia de compilação, travada aqui para não voltar a ser verdade só na
 * cabeça de quem escreveu.
 *
 * A primeira versão usava `Omit` puro e eu afirmei que devolver o objeto cru
 * não compilaria. Compilava: `Omit` produz um tipo mais LARGO, e o TypeScript
 * aceita campos a mais quando a atribuição vem de uma variável. A marca conserta
 * isso; estas linhas garantem que ela continue lá.
 */
describe("a fronteira é de tipo, não de disciplina", () => {
  it("o objeto cru não é aceito onde se espera o projetado", () => {
    // @ts-expect-error — Personagem não tem a marca pública.
    const vaza: PersonagemPublico = personagem;
    expect(vaza).toBeDefined();
  });

  it("a trama crua também não passa", () => {
    // @ts-expect-error — Trama não tem a marca pública.
    const vaza: TramaPublica = tramaVisivel;
    expect(vaza).toBeDefined();
  });

  it("o que a projeção devolve é aceito", () => {
    const ok: PersonagemPublico = personagemParaJogador(personagem);
    expect(ok.nome).toBe("Vasco Aranha");
  });
});

describe("o que sai para o jogador", () => {
  it.each([
    ["cidade", () => cidadeParaJogador(cidade)],
    ["bairro", () => bairroParaJogador(bairro)],
    ["personagem", () => personagemParaJogador(personagem)],
    ["local", () => localParaJogador(local)],
    ["trama", () => tramaParaJogador(tramaVisivel)],
    ["lista de tramas", () => tramasParaJogador([tramaVisivel, tramaInvisivel])],
    ["lista de contos", () => contosParaJogador([contoPublico, contoDoMestre])],
  ])("%s não carrega nenhum segredo", (_nome, projetar) => {
    expect(vazou(projetar())).toBe(false);
  });

  it("o que é público continua chegando inteiro", () => {
    expect(cidadeParaJogador(cidade).descricao).toMatch(/Vinte milhões/);
    expect(personagemParaJogador(personagem).historia).toMatch(/1908/);
    expect(personagemParaJogador(personagem).voz?.titulo).toBe("Príncipe");
    expect(localParaJogador(local).personagemIds).toEqual(["vasco-aranha"]);
  });

  /**
   * O nome de uma trama já é meio caminho do enredo. Filtrar depois de projetar
   * deixaria "O que dorme sob a catedral" numa lista pública, sem a verdade
   * junto mas com o susto inteiro.
   */
  it("a trama invisível some da lista, e não apenas perde a verdade", () => {
    const publicas = tramasParaJogador([tramaVisivel, tramaInvisivel]);
    expect(publicas.map((t) => t.id)).toEqual(["a-divida"]);
  });

  it("o conto do Mestre não sai pela metade: não sai", () => {
    expect(contosParaJogador([contoPublico, contoDoMestre]).map((c) => c.id)).toEqual(["o-incendio"]);
  });

  // A projeção descarta; não pode inventar nem renomear.
  it("não acrescenta campo que o Narrador não escreveu", () => {
    const p = personagemParaJogador(personagem);
    expect(Object.keys(p).sort()).toEqual(
      ["atualizadoEm", "bairroId", "claKey", "historia", "id", "nome", "respondePeloCla", "tipo", "voz"],
    );
  });
});
