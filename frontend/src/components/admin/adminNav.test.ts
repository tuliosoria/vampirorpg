import { describe, it, expect } from "vitest";
import { ADMIN_GROUPS, groupOf, sectionOf } from "./adminNav";

describe("ADMIN_GROUPS", () => {
  it("dá cinco destinos, cada um com um dono claro", () => {
    expect(ADMIN_GROUPS.map((g) => g.value)).toEqual(["mundo", "turno", "jogadores", "imagens", "sistema"]);
  });

  /**
   * O defeito que esta reestruturação existe para consertar: eram três níveis,
   * e o do meio era uma gaveta de dez itens onde "Canônico", "Acervo" e
   * "Escriba" não diziam o que faziam. Quem chegava para escrever um bairro
   * precisava acertar três cliques antes de ver um campo de texto.
   */
  it("nenhum grupo passa de sete seções", () => {
    for (const g of ADMIN_GROUPS) {
      expect(g.sections.length, g.value).toBeLessThanOrEqual(7);
    }
  });

  it("o Mundo abre na Cidade e traz as sete fichas numa fileira só", () => {
    expect(groupOf("mundo").sections.map((s) => s.value)).toEqual(
      ["cidade", "bairros", "clas", "personagens", "locais", "tramas", "contos"],
    );
    expect(sectionOf("mundo", null)).toBe("cidade");
  });

  it("as ferramentas de imagem vivem juntas, fora do caminho de quem escreve", () => {
    expect(groupOf("imagens").sections.map((s) => s.value)).toEqual(
      ["gerador", "entidades", "acervo", "prompts"],
    );
  });

  // Guardam conteúdo que o Estúdio ainda não absorveu. Ficam alcançáveis, e
  // marcadas, para não se perderem nem confundirem quem chega.
  it("o que ficou para trás está em Sistema e diz que é antigo", () => {
    const rotulos = groupOf("sistema").sections.map((s) => s.label);
    expect(rotulos).toContain("Bíblia (antiga)");
    expect(rotulos).toContain("Enciclopédia (antiga)");
    expect(rotulos).toContain("Escriba (antigo)");
  });
});

/**
 * O painel guarda a aba em `?tab=`, então há links salvos e abas abertas há
 * dias. Um link antigo tem de cair em algum lugar sensato, e nunca num lugar
 * que pareça certo e não seja.
 */
describe("links antigos", () => {
  it.each([
    ["turnos", "turno", "resolver"],
    ["projetos", "turno", "resolver"],
    ["correspondencia", "turno", "resolver"],
    ["registro", "turno", "registro"],
    ["casas", "jogadores", "fichas"],
    ["relacoes", "jogadores", "relacoes"],
    ["vivos", "jogadores", "vivos"],
    ["historia", "sistema", "biblia"],
    ["canonico", "sistema", "canonico"],
    ["escriba", "sistema", "escriba"],
    ["prompts", "imagens", "prompts"],
    ["acervo", "imagens", "acervo"],
    ["entidades", "imagens", "entidades"],
    ["estudio", "mundo", "cidade"],
    ["sistema", "sistema", "campanha"],
  ])("leva ?tab=%s para %s/%s", (antigo, grupo, secao) => {
    expect(groupOf(antigo).value).toBe(grupo);
    expect(sectionOf(antigo, null)).toBe(secao);
  });

  /**
   * "clas" era o grupo dos jogadores, e agora é também a seção dos clãs do
   * Mundo. Um link antigo tem de ir para as fichas de jogador — mandá-lo para
   * os clãs pareceria certo e levaria a pessoa ao lugar errado sem erro nenhum.
   */
  it("?tab=clas continua sendo o dos jogadores, e não os clãs do Mundo", () => {
    expect(groupOf("clas").value).toBe("jogadores");
    expect(sectionOf("clas", null)).toBe("fichas");
  });

  it("valor desconhecido cai no Mundo, que é onde se começa", () => {
    expect(groupOf("inventado").value).toBe("mundo");
    expect(sectionOf("inventado", null)).toBe("cidade");
  });
});

describe("seções", () => {
  it("aceita a seção pedida quando ela existe no grupo", () => {
    expect(sectionOf("mundo", "tramas")).toBe("tramas");
  });

  it("cai na primeira quando a pedida não existe naquele grupo", () => {
    expect(sectionOf("mundo", "acervo")).toBe("cidade");
    expect(sectionOf("imagens", "tramas")).toBe("gerador");
  });
});
