import type { HouseExample } from "./types.js";

/**
 * O exemplo mostrado a quem está criando seu personagem.
 *
 * É um marcador, não cânone: a crônica de verdade nasce vazia e é o Mestre quem
 * a povoa pela interface do Admin. Serve só para que o formulário mostre o
 * formato esperado de cada campo em vez de uma tela em branco.
 *
 * Os nomes dos campos ainda são os herdados da Cidade (`castleName`,
 * `heirName`), porque a renomeação do modelo para Personagem é uma passada
 * própria. O que o jogador lê são os rótulos, não estas chaves.
 */
export const EXEMPLO_DE_PERSONAGEM: HouseExample = {
  name: "Vasco Aranha, do clã Ventrue",
  motto: "A cidade paga o que deve.",
  leaderName: "Vasco Aranha",
  heirName: "Inês do Vale, seu carniçal",
  castleName: "O antigo Banco Providência",
  townsText: "Quatro quadras do centro velho, mais o que sobrou do porto.",
  historyText: "Abraçado em 1908, quando o dinheiro do café ainda mandava. Nunca perdeu o hábito de cobrar juros.",
  specialty: "Dinheiro antigo e as pessoas que o devem.",
  weakness: "Só se alimenta de quem tem algo a perder.",
  attributes: { riqueza: 4, recursos: 3, soldados: 1, controle: 2 },
  emblem: { icon: "corvo", color1: "#7f1d1d", color2: "#3f3f46" },
};
