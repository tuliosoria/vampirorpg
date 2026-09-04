import { describe, expect, it } from "vitest";
import {
  CAMPOS_REVISAVEIS, contextoDoMundo, parseRevisao, pedidoDeRevisao, sistemaDeRevisao,
  type MundoParaRevisao,
} from "./estudioRevisao.js";
import { fichaVazia } from "@vampiro/content";
import { HttpError } from "../types/domain.js";

const VAZAMENTO = "ISTO_NUNCA_PODE_VAZAR";

const mundo: MundoParaRevisao = {
  cidade: { nome: "Porto Lívido", descricao: "Uma cidade de cais podre.", segredos: VAZAMENTO, atualizadoEm: "" },
  bairros: [
    { id: "centro-velho", nome: "Centro Velho", atmosfera: "decadente", descricao: "Sobrados tortos.", segredos: VAZAMENTO, atualizadoEm: "" },
    { id: "porto", nome: "Porto", atmosfera: "industrial", descricao: "Guindastes.", segredos: VAZAMENTO, atualizadoEm: "" },
  ],
  personagens: [
    {
      id: "rala", nome: "Rala", historia: "Conhece os túneis.", tipo: "VAMPIRO",
      claKey: "cla-nosferatu", respondePeloCla: false, bairroId: "centro-velho", voz: null,
      poder: "MEDIO", objetivos: VAZAMENTO, relacoes: [], atualizadoEm: "",
    },
  ],
  locais: [{ id: "capela", nome: "Capela do Cais", bairroId: "porto", descricao: "Fechada há anos.", segredos: VAZAMENTO, personagemIds: [], tramaIds: [], atualizadoEm: "" }],
  tramas: [
    {
      id: "divida", nome: "A dívida do porto", importancia: "PRINCIPAL", estado: "ATIVA",
      visivel: false, descricaoPublica: "Contas que não fecham.", verdadeDoMestre: VAZAMENTO,
      personagens: [], localIds: [], atualizadoEm: "",
    },
  ],
  contos: [{ id: "incendio", titulo: "O incêndio de 1987", tipo: "EVENTO", periodo: "1987", visibilidade: "MESTRE", historia: "Queimou tudo.", atualizadoEm: "" }],
  clas: [{ ...fichaVazia("cla-nosferatu", "Clã Nosferatu"), descricao: "Vivem embaixo.", segredos: VAZAMENTO }],
};

describe("o contexto que a revisão recebe", () => {
  /**
   * A garantia que sustenta a separação em duas chamadas. Se o contexto
   * carregasse um segredo, a chamada dos campos públicos leria segredo do mundo
   * inteiro, e a instrução no prompt viraria a única defesa.
   */
  it("não carrega segredo nenhum, de ficha nenhuma", () => {
    const item = { nome: "Vasco", bairroId: "centro-velho", claKey: "cla-nosferatu" };
    expect(contextoDoMundo(mundo, item)).not.toContain(VAZAMENTO);
  });

  it("ancora a ficha no bairro e no clã dela", () => {
    const ctx = contextoDoMundo(mundo, { bairroId: "porto", claKey: "cla-nosferatu" });
    expect(ctx).toContain("BAIRRO DESTA FICHA: Porto");
    expect(ctx).toContain("CLÃ DESTA FICHA: Clã Nosferatu");
  });

  // Sem os nomes já escritos a IA inventa gente nova a cada revisão, e a
  // cosmologia cresce em vez de ganhar consistência.
  it("lista o que já existe, para a revisão não inventar em cima", () => {
    const ctx = contextoDoMundo(mundo, {});
    expect(ctx).toContain("Rala");
    expect(ctx).toContain("Capela do Cais");
  });

  /**
   * O nome de uma trama oculta é segredo, e não metadado: "O que dorme sob a
   * Capela" não tem campo secreto nenhum e já entrega o enredo. É por isso que
   * a projeção do jogador remove a trama invisível inteira em vez de esvaziar
   * seus campos, e aqui vale igual.
   */
  it("cala o nome da trama que os jogadores ainda não veem", () => {
    expect(contextoDoMundo(mundo, {})).not.toContain("A dívida do porto");
    expect(contextoDoMundo(mundo, {}, true)).toContain("A dívida do porto");
  });

  it("mostra a trama que já é pública", () => {
    const aberto = { ...mundo, tramas: [{ ...mundo.tramas[0], visivel: true }] };
    expect(contextoDoMundo(aberto, {})).toContain("A dívida do porto");
  });

  it("aguenta a crônica vazia", () => {
    const vazio: MundoParaRevisao = {
      cidade: { nome: "", descricao: "", segredos: "", atualizadoEm: "" },
      bairros: [], personagens: [], locais: [], tramas: [], contos: [], clas: [],
    };
    expect(contextoDoMundo(vazio, {})).toBe("");
  });
});

describe("o pedido de revisão", () => {
  const campos = [{ nome: "descricao", rotulo: "Descrição", valor: "um bar" }];

  it("diz ao modelo que o campo é público e o que isso proíbe", () => {
    const p = pedidoDeRevisao({ rotuloDaFicha: "locais", nomeDaFicha: "Bar", contexto: "", campos, secretos: false });
    expect(p).toContain("PÚBLICOS");
    expect(p).toMatch(/só o que os personagens poderiam saber/i);
  });

  it("solta a mão na revisão do que é secreto", () => {
    const p = pedidoDeRevisao({ rotuloDaFicha: "locais", nomeDaFicha: "Bar", contexto: "", campos, secretos: true });
    expect(p).toContain("SEGREDOS DO NARRADOR");
  });

  it("pede exatamente as chaves que vão ser lidas de volta", () => {
    const p = pedidoDeRevisao({
      rotuloDaFicha: "tramas", nomeDaFicha: "A dívida", contexto: "",
      campos: [
        { nome: "descricaoPublica", rotulo: "Pública", valor: "a" },
        { nome: "verdadeDoMestre", rotulo: "A verdade", valor: "b" },
      ],
      secretos: true,
    });
    expect(p).toContain('{"descricaoPublica": "…", "verdadeDoMestre": "…"}');
  });

  it("marca o campo vazio como vazio, em vez de deixar a linha em branco", () => {
    const p = pedidoDeRevisao({
      rotuloDaFicha: "locais", nomeDaFicha: "Bar", contexto: "",
      campos: [{ nome: "segredos", rotulo: "Segredos", valor: "   " }], secretos: true,
    });
    expect(p).toContain("(vazio)");
  });
});

describe("a voz do editor", () => {
  // O pedido do Narrador foi melhorar o texto dele, não receber outro no lugar.
  it("proíbe trocar nome próprio e contradizer fato", () => {
    const s = sistemaDeRevisao();
    expect(s).toMatch(/nome próprio/i);
    expect(s).toMatch(/contradizer.*fato/i);
    expect(s).toMatch(/mudar a intenção/i);
  });
});

describe("a leitura da resposta", () => {
  it("aceita os campos pedidos", () => {
    expect(parseRevisao('{"descricao":" Um bar sem porta. "}', ["descricao"])).toEqual({
      descricao: "Um bar sem porta.",
    });
  });

  /**
   * A chave a mais não é curiosidade: é a IA escrevendo num campo fora de
   * revisão. Quem grava confia no que sai daqui, e um `claKey` revisado muda de
   * quem o personagem é.
   */
  it("descarta campo que ninguém pediu", () => {
    const saida = parseRevisao('{"descricao":"ok","claKey":"cla-outro","nome":"Outro Nome"}', ["descricao"]);
    expect(saida).toEqual({ descricao: "ok" });
  });

  it("ignora valor que não é texto", () => {
    expect(parseRevisao('{"descricao":"ok","segredos":{"a":1}}', ["descricao", "segredos"])).toEqual({
      descricao: "ok",
    });
  });

  it("recusa resposta que não é JSON de objeto", () => {
    expect(() => parseRevisao("desculpe, não consegui", ["descricao"])).toThrow(HttpError);
    expect(() => parseRevisao('["descricao"]', ["descricao"])).toThrow(HttpError);
  });

  it("recusa a resposta que não traz nenhum campo pedido", () => {
    expect(() => parseRevisao('{"outra":"coisa"}', ["descricao"])).toThrow(HttpError);
  });
});

describe("o que pode ser revisado", () => {
  /**
   * Nome, id, clã, bairro e visibilidade ficam de fora. Uma revisão que muda o
   * clã de um personagem não melhorou a prosa: mudou de quem ele é.
   */
  it("não expõe vínculo nem escolha do Narrador", () => {
    const proibidos = ["id", "nome", "titulo", "claKey", "bairroId", "visivel", "visibilidade", "tipo", "poder", "estado"];
    for (const [colecao, campos] of Object.entries(CAMPOS_REVISAVEIS)) {
      for (const c of campos) {
        expect(proibidos, `${colecao}.${c.nome}`).not.toContain(c.nome);
      }
    }
  });

  it("marca como segredo o que o jogador nunca lê", () => {
    const nomeDosSecretos = (colecao: string) =>
      CAMPOS_REVISAVEIS[colecao].filter((c) => c.segredo).map((c) => c.nome);
    expect(nomeDosSecretos("personagens")).toEqual(["objetivos"]);
    expect(nomeDosSecretos("tramas")).toEqual(["verdadeDoMestre"]);
    expect(nomeDosSecretos("bairros")).toEqual(["segredos"]);
    expect(nomeDosSecretos("locais")).toEqual(["segredos"]);
    expect(nomeDosSecretos("cidade")).toEqual(["segredos"]);
  });
});
