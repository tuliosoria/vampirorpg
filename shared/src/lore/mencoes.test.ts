import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { construirDetector } from "./mencoes.js";
import { fold, nameKey } from "./mortality.js";
import { semearCanon, limparCanon } from "../test/fixtures.js";

beforeEach(semearCanon);
afterEach(limparCanon);

const elenco = [
  { id: "gloriandur", nome: "Faraó Gloriandur" },
  { id: "nima", nome: "Nima Olhos de Cinza" },
  { id: "kael", nome: "Ser Kael Rimerberg" },
];

function verbete(body: string, title = "Um verbete") {
  return { entryId: "a", title, body };
}

describe("construirDetector", () => {
  it("encontra o personagem citado pelo nome próprio", () => {
    const v = verbete("Gloriandur chegou ao porto.");
    const d = construirDetector([v], elenco);

    expect(d.mencoesEm(v).personagens).toEqual(["gloriandur"]);
  });

  it("descarta a palavra do nome que o corpus escreve em minúscula", () => {
    // "Nima Olhos de Cinza" casaria por "olhos", que é palavra comum. Quem
    // decide é o próprio texto da crônica, não uma lista mantida à mão.
    const v = verbete("Os olhos da guarda não piscaram.");
    const d = construirDetector([v], elenco);

    expect(d.mencoesEm(v).personagens).toEqual([]);
  });

  it("descarta o termo que serviria a dois personagens", () => {
    // Mandar o leitor para a pessoa errada é pior do que não oferecer link.
    const doisKael = [
      { id: "kael-a", nome: "Ser Kael Rimerberg" },
      { id: "kael-b", nome: "Kael de o centro velho" },
    ];
    const v = verbete("Kael partiu ao amanhecer.");
    const d = construirDetector([v], doisKael);

    expect(d.mencoesEm(v).personagens).toEqual([]);
  });

  it("não casa pedaço de palavra", () => {
    const v = verbete("Kaelen partiu ao amanhecer.");
    const d = construirDetector([v], elenco);

    expect(d.mencoesEm(v).personagens).toEqual([]);
  });

  it("acha o nome no título do verbete, não só no corpo", () => {
    const v = verbete("Nada aqui.", "A queda de Gloriandur");
    const d = construirDetector([v], elenco);

    expect(d.mencoesEm(v).personagens).toEqual(["gloriandur"]);
  });

  it("ignora acento e caixa", () => {
    const v = verbete("GLORIANDUR voltou.");
    const d = construirDetector([v], elenco);

    expect(d.mencoesEm(v).personagens).toEqual(["gloriandur"]);
  });

  it("verbete sem citação devolve listas vazias", () => {
    const v = verbete("A neve caiu por três dias.");
    const d = construirDetector([v], elenco);

    expect(d.mencoesEm(v)).toEqual({ personagens: [], casas: [] });
  });

  it("encontra o clã citado pelo nome", () => {
    const v = verbete("O Clã Ventrue fechou as portas do banco.");
    const d = construirDetector([v], elenco);

    expect(d.mencoesEm(v).casas).toContain("cla-ventrue");
  });

  it("encontra o clã citado pelo endereço do refúgio", () => {
    // O texto quase nunca diz "cla-nosferatu": diz o nome do lugar.
    const v = verbete("O silêncio da Galeria Subterrânea durou a noite toda.");
    const d = construirDetector([v], elenco);

    expect(d.mencoesEm(v).casas).toContain("cla-nosferatu");
  });
  describe("os enganos que o corpus real revelou", () => {
    it("não confunde a Casa do Ouro com couro nem tesouro", () => {
      // Sem borda de palavra, "ouro" casava dentro de couro, tesouro e vulgar.
      // No corpus real isso fazia um verbete afirmar que citava a Casa do Ouro
      // só porque o texto falava em couro.
      const v = verbete("Trabalhavam o couro e guardavam o tesouro da Coroa.");
      const d = construirDetector([v], elenco);

      expect(d.mencoesEm(v).casas).not.toContain("casa-do-ouro");
    });

    it("não casa o nome do clã dentro de outra palavra", () => {
      const v = verbete("O gesto foi vulgar.");
      const d = construirDetector([v], elenco);

      expect(d.mencoesEm(v).casas).toEqual([]);
    });

    it("descarta o termo de Casa que o corpus usa como palavra comum", () => {
      // "ouro" identifica a Casa do Ouro, mas também é o metal.
      const v = verbete("Pagaram em ouro e prata.");
      const d = construirDetector([v], elenco);

      expect(d.mencoesEm(v).casas).not.toContain("casa-do-ouro");
    });

    it("não identifica a pessoa pelo sobrenome que também nomeia um lugar", () => {
      // "Torre de Véspera" é um lugar. Maelor Véspera era o personagem mais
      // citado do corpus, e quatro dos seis achados eram a torre.
      const gente = [{ id: "maelor", nome: "Maelor Véspera" }];
      const v = verbete("A Torre de Véspera fica ao sul, e o mestre a evitava.");
      const d = construirDetector([v], gente);

      expect(d.mencoesEm(v).personagens).toEqual([]);
    });

    it("não identifica a pessoa pelo sobrenome de outra pessoa", () => {
      // No verbete dos vinte e sete magos, "Alaric Venn" oferecia um link que
      // levava a Liora Venn: o leitor ia parar na pessoa errada.
      const gente = [{ id: "liora", nome: "Mestra Liora Venn" }];
      const v = verbete("Alaric Venn falou por último, e a mestra calou-se.");
      const d = construirDetector([v], gente);

      expect(d.mencoesEm(v).personagens).toEqual([]);
    });
  });
});

/**
 * A corte da Cidade, inventada aqui.
 *
 * Antes estes dois blocos liam o cânone real com `corpusDoCanone()` — o que só
 * funcionava porque o cânone morava no código. Agora a crônica nasce vazia, e
 * o que se testa é o detector, não o elenco: por isso o elenco vem explícito.
 * Os títulos são os da corte porque é neles que a regra tropeça.
 */
const CORTE = [
  { id: "dama-elara-voss", nome: "Dama Elara Voss" },
  { id: "principe-vasco-aranha", nome: "Príncipe Vasco Aranha" },
  { id: "vasco-aranha", nome: "Vasco Aranha" },
  { id: "xerife-remy-hal", nome: "Xerife Remy Hal" },
  { id: "senescal-aelric-roderic", nome: "Senescal Aelric Roderic" },
  { id: "primogenita-ines-do-vale", nome: "Primogênita Inês do Vale" },
  { id: "lucia-ventrue", nome: "Lúcia Ventrue" },
  { id: "rala-vasques", nome: "Rala Vasques" },
  { id: "rala-do-cais", nome: "Rala do Cais" },
];

const CORPUS = [
  { entryId: "c1", title: "", body: "A noite passou sobre o cais e ninguém respondeu ao chamado." },
  { entryId: "c2", title: "", body: "Pagaram em ouro e prata, como sempre pagaram." },
];

describe("trechos para virar link", () => {
  const detector = construirDetector(CORPUS, CORTE);
  const pessoas = (t: string) =>
    detector.trechos(t).filter((p) => p.tipo === "pessoa").map((p) => `${p.valor}:${(p as { id: string }).id}`);

  it("acha quem o leitor não lembra quem é", () => {
    // A pergunta que originou tudo: "eu não lembrava quem era Dama Elara".
    expect(pessoas("A Dama Elara Voss selou os portões.")).toEqual(["Elara:dama-elara-voss"]);
  });

  it("linka só a primeira menção de cada pessoa", () => {
    const t = "Elara mandou aviso. Elara não esperou resposta. Elara fechou a rua.";
    expect(pessoas(t)).toEqual(["Elara:dama-elara-voss"]);
  });

  it("devolve o texto inteiro, sem perder nem duplicar um caractere", () => {
    const t = "Remy escreveu a Elara sobre Aelric, e ninguém respondeu.";
    expect(detector.trechos(t).map((p) => p.valor).join("")).toBe(t);
  });

  it("não confunde o clã com a pessoa", () => {
    // "Ventrue" nomeia o clã inteiro; linkar para uma pessoa seria mentira.
    expect(pessoas("O Clã Ventrue recusou o tributo.")).toEqual([]);
  });

  it("junta os registros duplicados da mesma pessoa em vez de descartá-la", () => {
    // Vasco aparece duas vezes na corte, com e sem o título. Antes disso o nome
    // saía como disputado e o personagem central ficava sem link.
    expect(pessoas("Vasco desceu a escadaria.")).toEqual(["Vasco:principe-vasco-aranha"]);
  });

  it("recusa o nome que duas pessoas de verdade dividem", () => {
    // Rala Vasques e Rala do Cais são duas pessoas distintas. Sem link é o
    // resultado certo: link errado seria pior.
    expect(pessoas("Rala cruzou o salão.")).toEqual([]);
  });

  it("não linka dentro de outra palavra", () => {
    expect(pessoas("O elaramento do porto range.")).toEqual([]);
  });

  it("aguenta texto vazio", () => {
    expect(detector.trechos("")).toEqual([]);
  });
});

describe("título não é nome", () => {
  const detector = construirDetector(CORPUS, CORTE);
  const termo = (nome: string) => {
    const p = detector.trechos(nome).find((t) => t.tipo === "pessoa");
    return p ? p.valor : null;
  };

  it.each([
    ["Dama Elara Voss", "Elara"],
    ["Senescal Aelric Roderic", "Aelric"],
    ["Primogênita Inês do Vale", "Inês"],
    ["Xerife Remy Hal", "Remy"],
  ])("procura %s pelo nome próprio, não pelo título", (nome, esperado) => {
    expect(termo(nome)).toBe(esperado);
  });

  it("não deixa um cargo solto virar link para alguém", () => {
    // Só existe um Senescal na corte, então nada acusava a colisão: a palavra
    // em qualquer frase levava a Aelric Roderic.
    expect(detector.trechos("O Senescal chegou tarde ao conselho.")).toEqual([
      { tipo: "texto", valor: "O Senescal chegou tarde ao conselho." },
    ]);
  });

  it("nenhum título usado pelo elenco sobrevive como termo de busca", () => {
    // Guarda estrutural: uma palavra que abre o nome de duas pessoas
    // diferentes é título, não nome. Foi assim que "dama" passou despercebido.
    const porPrimeiraPalavra = new Map<string, Set<string>>();
    for (const npc of CORTE) {
      const primeira = fold(npc.nome).split(/\s+/)[0];
      if (!porPrimeiraPalavra.has(primeira)) porPrimeiraPalavra.set(primeira, new Set());
      porPrimeiraPalavra.get(primeira)!.add(nameKey(npc.nome));
    }
    const titulos = [...porPrimeiraPalavra].filter(([, pessoas]) => pessoas.size > 1).map(([p]) => p);

    for (const titulo of titulos) {
      const achados = detector.trechos(`Assim falou ${titulo} naquela noite.`);
      expect(achados.filter((t) => t.tipo === "pessoa")).toEqual([]);
    }
  });
});
