import { describe, it, expect } from "vitest";
import { PENDENCIAS_VAZIAS, PENDENCIA_DESTINO, type Pendencias } from "@vampiro/content";
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

  /**
   * A fileira sozinha é uma lista de substantivos, e "Acervo", "Escriba" e
   * "Contos" não dizem o que guardam. Quem chega para escrever o mundo não deve
   * precisar clicar em todos para descobrir onde escreve o quê.
   */
  it("toda seção diz o que se adiciona nela", () => {
    for (const g of ADMIN_GROUPS) {
      for (const s of g.sections) {
        expect(s.descricao.trim(), `${g.value}/${s.value}`).not.toBe("");
        // Uma frase de verdade, não o rótulo repetido com outra pontuação.
        expect(s.descricao.length, `${g.value}/${s.value}`).toBeGreaterThan(40);
        expect(s.descricao, `${g.value}/${s.value}`).not.toBe(s.label);
      }
    }
  });

  it("nenhuma descrição serve para duas seções", () => {
    const todas = ADMIN_GROUPS.flatMap((g) => g.sections.map((s) => s.descricao));
    expect(new Set(todas).size).toBe(todas.length);
  });

  /**
   * "(antiga)" dizia que a ferramenta era obsoleta, e nenhuma é: as três estão
   * ligadas e fazem coisas que as fichas do Mundo não fazem. O rótulo respondia
   * "isto ainda vale?" quando a pergunta de quem chega é "então o que é isto?".
   */
  it("nenhuma seção se chama de antiga", () => {
    for (const g of ADMIN_GROUPS) {
      for (const s of g.sections) {
        expect(s.label.toLowerCase(), `${g.value}/${s.value}`).not.toMatch(/antig[ao]/);
      }
    }
  });

  it("o que fica em Sistema é nomeado pelo que faz", () => {
    expect(groupOf("sistema").sections.map((s) => s.label)).toEqual(
      ["Campanha", "Bíblia", "Enciclopédia", "Escriba"],
    );
  });

  // A distinção que a fileira sozinha não dá: as três não são fichas, e a
  // pessoa acabou de escrever a Cidade no Mundo.
  it("Sistema explica em que difere do Mundo", () => {
    const porValor = Object.fromEntries(groupOf("sistema").sections.map((s) => [s.value, s.descricao]));
    expect(porValor.biblia).toMatch(/não cabe numa ficha/i);
    expect(porValor.canonico).toMatch(/difere do mundo/i);
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

/**
 * O elo que faltava, e por isso quebrou calado.
 *
 * A faixa dourada leva ao destino gravado em `PENDENCIA_DESTINO`, e o painel
 * conta as pendências de uma seção casando grupo e seção com o mesmo registro.
 * Os dois lados moram em pacotes diferentes — o destino no `shared`, a
 * navegação aqui — e reestruturar o painel não dá erro nenhum do outro lado:
 * um destino inválido só faz o atalho cair na primeira seção do grupo e o
 * contador zerar, as duas coisas parecendo funcionar.
 */
describe("os atalhos das pendências", () => {
  it("todo destino existe no painel", () => {
    for (const chave of Object.keys(PENDENCIAS_VAZIAS) as (keyof Pendencias)[]) {
      const { tab, sec } = PENDENCIA_DESTINO[chave];
      const grupo = ADMIN_GROUPS.find((g) => g.value === tab);
      expect(grupo, `${chave} aponta para o grupo "${tab}"`).toBeDefined();
      expect(
        grupo?.sections.some((s) => s.value === sec),
        `${chave} aponta para "${tab}/${sec}"`,
      ).toBe(true);
    }
  });

  // Não basta existir: tem de ser onde o atalho realmente para. `groupOf` e
  // `sectionOf` são quem decide isso, e é por elas que o clique passa.
  it("o atalho para exatamente onde o destino diz", () => {
    for (const chave of Object.keys(PENDENCIAS_VAZIAS) as (keyof Pendencias)[]) {
      const { tab, sec } = PENDENCIA_DESTINO[chave];
      expect(groupOf(tab).value, chave).toBe(tab);
      expect(sectionOf(tab, sec), chave).toBe(sec);
    }
  });
});
