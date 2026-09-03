import type { House } from "./types.js";
import type { ProjectTemplate } from "./projects.js";
import { DEFAULT_PROJECT_TEMPLATES } from "./projectTemplates.js";
import { ATTRIBUTE_KEYS } from "./types.js";

const STARTER_LIMIT = 8;

/**
 * Sugere um punhado de cartas iniciais para um personagem.
 *
 * Na Cidade isto era uma tabela de ids escritos à mão — "forja" levava a
 * `construir-um-arsenal-regional` —, o que só funcionava porque o catálogo
 * também vivia no código. Aqui o catálogo é cânone da crônica, criado pelo
 * Narrador, e a função não pode conhecer o id de carta nenhuma.
 *
 * O que sobrou é a regra: casar as palavras da especialidade do personagem
 * contra o texto de cada carta, pontuar, e desempatar pelo atributo mais alto.
 * Determinística e pura. Catálogo vazio devolve lista vazia, em vez de fingir
 * que recomendou alguma coisa.
 */
export function recommendStarterCards(
  house: House,
  catalogo: ProjectTemplate[] = DEFAULT_PROJECT_TEMPLATES,
): ProjectTemplate[] {
  if (catalogo.length === 0) return [];

  const termos = palavrasDe(house.specialty ?? "");
  const atributoForte = maiorAtributo(house);

  const pontuadas = catalogo.map((t, ordem) => ({
    template: t,
    ordem,
    pontos: pontuar(t, termos, atributoForte),
  }));

  // A ordem do catálogo desempata, para que a sugestão não dependa da ordem em
  // que o motor de ordenação recebeu os itens.
  pontuadas.sort((a, b) => b.pontos - a.pontos || a.ordem - b.ordem);

  return pontuadas.slice(0, STARTER_LIMIT).map((p) => p.template);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Palavras da especialidade que valem como pista. Descarta as curtas demais. */
function palavrasDe(texto: string): string[] {
  return normalize(texto)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
}

function maiorAtributo(house: House): string | null {
  let melhor: string | null = null;
  let valor = -1;
  for (const key of ATTRIBUTE_KEYS) {
    if (house.attributes[key] > valor) {
      valor = house.attributes[key];
      melhor = key;
    }
  }
  return melhor;
}

function pontuar(t: ProjectTemplate, termos: string[], atributoForte: string | null): number {
  const texto = normalize(`${t.title} ${t.description ?? ""} ${t.category}`);
  let pontos = 0;
  for (const termo of termos) {
    if (texto.includes(termo)) pontos += 2;
  }
  // Uma carta que sobe o atributo em que o personagem já é forte joga a favor
  // do que ele escolheu ser, e é a desempate quando a especialidade não diz nada.
  if (atributoForte) {
    const sobe = t.completionEffects?.attributeChanges ?? [];
    if (sobe.some((c) => c.attribute === atributoForte)) pontos += 1;
  }
  return pontos;
}
