import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { limparCanonAplicado } from "@vampiro/content";
import { ApiProvider } from "../../../api/ApiProvider";
import { CanonProvider } from "../../../api/CanonProvider";
import { MockApiClient } from "../../../api/mockClient";
import { AdminEstudio } from "./AdminEstudio";

/**
 * O Estúdio como o Narrador o usa: escrever, ver aparecer, e não ver o que é
 * secreto sair.
 */
beforeEach(limparCanonAplicado);

async function abrir(client: MockApiClient, secao = "cidade") {
  const idas: string[] = [];
  await act(async () => {
    render(
      <ApiProvider client={client}>
        <CanonProvider>
          <AdminEstudio adminToken="t" secao={secao} irPara={(s) => idas.push(s)} />
        </CanonProvider>
      </ApiProvider>,
    );
  });
  return idas;
}

describe("AdminEstudio", () => {
  // A navegação é a fileira do painel, e não uma segunda por dentro: abrir a
  // seção já mostra o formulário, sem clique intermediário.
  it("cada seção abre direto no seu formulário", async () => {
    await abrir(new MockApiClient(), "bairros");
    expect(await screen.findByRole("button", { name: /Novo bairro/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("a cidade nasce vazia e aceita nome, descrição e segredos", async () => {
    const client = new MockApiClient();
    await abrir(client);
    await act(async () => {
      await userEvent.type(screen.getByLabelText("Nome da Cidade"), "São Paulo");
      await userEvent.click(screen.getByRole("button", { name: /Salvar cidade/i }));
    });
    expect((await client.getEstudio("t")).cidade.nome).toBe("São Paulo");
  });

  // O cadeado não esconde nada — o backend é quem impede o campo de sair. Ele
  // existe para o Narrador saber, ao escrever, o que está do lado de dentro.
  it("marca com cadeado o que nunca chega ao jogador", async () => {
    await abrir(new MockApiClient(), "personagens");
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: /Novo personagem/i })); });

    expect(screen.getByLabelText(/🔒 Objetivos/)).toBeInTheDocument();
    expect(screen.getByLabelText(/🔒 Poder/)).toBeInTheDocument();
    expect(screen.getByLabelText("História")).toBeInTheDocument();
  });

  // Guardar clã num lobisomem colocaria um estranho no elenco na próxima
  // aplicação do cânone; o formulário nem oferece o campo.
  it("o campo de clã só aparece para vampiro", async () => {
    await abrir(new MockApiClient(), "personagens");
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: /Novo personagem/i })); });

    expect(screen.queryByLabelText("Clã")).not.toBeInTheDocument();

    await act(async () => {
      // MUI abre o menu no mouseDown, não no click.
      fireEvent.mouseDown(screen.getByRole("combobox", { name: "Tipo" }));
    });
    await act(async () => {
      await userEvent.click(await screen.findByRole("option", { name: "Vampiro" }));
    });
    expect(screen.getByLabelText("Clã")).toBeInTheDocument();
  });

  it("um bairro salvo aparece na lista", async () => {
    const client = new MockApiClient();
    await abrir(client, "bairros");
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: /Novo bairro/i })); });
    await act(async () => {
      await userEvent.type(screen.getByLabelText("Nome do bairro"), "Centro Velho");
      await userEvent.click(screen.getByRole("button", { name: /^Salvar$/i }));
    });
    expect(await screen.findByText("Centro Velho")).toBeInTheDocument();
  });

  /**
   * O que amarra a cosmologia: o bairro escrito numa seção vira escolha na
   * outra. Sem isso as fichas seriam sete formulários soltos em vez de uma rede.
   */
  it("o bairro escrito vira opção no formulário de local", async () => {
    const client = new MockApiClient();
    await client.saveEstudioItem("t", "bairros", {
      id: "centro-velho", nome: "Centro Velho", descricao: "", atmosfera: "", segredos: "", atualizadoEm: "",
    });

    await abrir(client, "locais");
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: /Novo local/i })); });
    await act(async () => { fireEvent.mouseDown(screen.getByRole("combobox", { name: "Bairro" })); });
    expect(await screen.findByRole("option", { name: "Centro Velho" })).toBeInTheDocument();
  });

  it("a trama nasce invisível, e o que sai para o jogador não a contém", async () => {
    const client = new MockApiClient();
    await abrir(client, "tramas");
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: /Nova trama/i })); });
    await act(async () => {
      await userEvent.type(screen.getByLabelText("Nome da trama"), "A dívida do porto");
      await userEvent.type(screen.getByLabelText(/🔒 A verdade/), "É o próprio Príncipe.");
      await userEvent.click(screen.getByRole("button", { name: /^Salvar$/i }));
    });

    const publico = await client.getEstudioPublico();
    expect(publico.tramas).toHaveLength(0);
    expect(JSON.stringify(publico)).not.toContain("É o próprio Príncipe");
    expect((await client.getEstudio("t")).tramas).toHaveLength(1);
  });

  /**
   * As sete abas do Mundo têm o mesmo peso na fileira, mas não são
   * intercambiáveis: quem começasse pelas Tramas abriria o formulário com todos
   * os menus vazios e sem dizer por quê. O roteiro é o que conta a ordem.
   */
  describe("o roteiro da Cidade", () => {
    it("aponta o primeiro passo vazio numa crônica em branco", async () => {
      await abrir(new MockApiClient(), "cidade");

      const passo = screen.getByRole("button", { name: "Cidade" }).closest("div");
      expect(passo).toHaveTextContent("comece por aqui");
      // Um só. "Comece por aqui" em sete linhas não indica nada.
      expect(screen.getAllByText("comece por aqui")).toHaveLength(1);
    });

    it("mostra o que já existe e avança o ponto de partida", async () => {
      const client = new MockApiClient();
      await client.saveCidade("t", { nome: "Porto Lívido", descricao: "", segredos: "", atualizadoEm: "" });
      await client.saveEstudioItem("t", "bairros", {
        id: "centro-velho", nome: "Centro Velho", descricao: "", atmosfera: "", segredos: "", atualizadoEm: "",
      });

      await abrir(client, "cidade");

      expect(screen.getByRole("button", { name: "Bairros" }).closest("div")).toHaveTextContent("1");
      expect(screen.getByRole("button", { name: "Clãs" }).closest("div")).toHaveTextContent("comece por aqui");
    });

    it("cada passo leva à sua seção", async () => {
      const idas = await abrir(new MockApiClient(), "cidade");
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: "Personagens" })); });
      expect(idas).toEqual(["personagens"]);
    });

    // Só na tela onde se chega. Repetido em toda seção viraria ruído para quem
    // já sabe onde está.
    it("não aparece nas outras seções", async () => {
      await abrir(new MockApiClient(), "tramas");
      expect(screen.queryByText(/por onde seguir/i)).not.toBeInTheDocument();
    });
  });

  /**
   * "Revisar com IA": a IA propõe, o Narrador decide.
   *
   * O que estes testes protegem não é a prosa — é a fronteira. Um botão que
   * melhorasse o texto sozinho estaria apagando a decisão de quem o escreveu
   * daquele jeito, e um que gravasse a revisão tiraria dele a última palavra.
   */
  describe("revisar com IA", () => {
    async function comBairro(client: MockApiClient) {
      await client.saveEstudioItem("t", "bairros", {
        id: "centro-velho", nome: "Centro Velho", descricao: "predios velhos",
        atmosfera: "decadente", segredos: "tem tunel", atualizadoEm: "",
      });
      await abrir(client, "bairros");
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /^Editar$/i })); });
    }

    it("mostra o que você escreveu ao lado do que a IA propôs", async () => {
      await comBairro(new MockApiClient());
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /revisar com ia/i })); });

      const dialogo = within(await screen.findByRole("dialog"));
      expect(dialogo.getByText("predios velhos")).toBeInTheDocument();
      expect(dialogo.getByLabelText(/versão da ia — descrição/i)).toHaveValue("predios velhos (revisado)");
    });

    // O caso comum: gostar da descrição e achar que a IA errou o tom do
    // segredo. Um botão só para as duas obrigaria a jogar fora a metade boa.
    it("aceita campo a campo, e não a revisão inteira", async () => {
      await comBairro(new MockApiClient());
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /revisar com ia/i })); });
      await screen.findByLabelText(/versão da ia — descrição/i);

      const usar = screen.getAllByRole("button", { name: /usar esta versão/i });
      await act(async () => { await userEvent.click(usar[0]); });
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /levar o campo/i })); });

      expect(screen.getByLabelText("Descrição")).toHaveValue("predios velhos (revisado)");
      // O segredo, que ele não aceitou, ficou como estava.
      expect(screen.getByLabelText(/🔒 Segredos/)).toHaveValue("tem tunel");
    });

    it("descartar não mexe em nada", async () => {
      await comBairro(new MockApiClient());
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /revisar com ia/i })); });
      await screen.findByLabelText(/versão da ia — descrição/i);

      await act(async () => { await userEvent.click(screen.getAllByRole("button", { name: /usar esta versão/i })[0]); });
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /descartar a revisão/i })); });

      expect(screen.getByLabelText("Descrição")).toHaveValue("predios velhos");
    });

    /**
     * A regra que o painel inteiro sustenta: gravar é do botão de salvar, com o
     * que estiver no formulário. Revisar leva o texto para a tela e para por aí.
     */
    it("levar para o formulário não grava", async () => {
      const client = new MockApiClient();
      await comBairro(client);
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /revisar com ia/i })); });
      await screen.findByLabelText(/versão da ia — descrição/i);
      await act(async () => { await userEvent.click(screen.getAllByRole("button", { name: /usar esta versão/i })[0]); });
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /levar o campo/i })); });
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      const gravado = (await client.getEstudio("t")).bairros[0];
      expect(gravado.descricao).toBe("predios velhos");

      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /^Salvar$/i })); });
      expect((await client.getEstudio("t")).bairros[0].descricao).toBe("predios velhos (revisado)");
    });

    it("diz quando a revisão falha, sem perder o que estava escrito", async () => {
      const client = new MockApiClient();
      client.revisarEstudioItem = async () => { throw new Error("A IA não está configurada."); };
      await comBairro(client);
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /revisar com ia/i })); });

      expect(await screen.findByText(/a ia não está configurada/i)).toBeInTheDocument();
      await act(async () => { await userEvent.click(screen.getByRole("button", { name: /descartar a revisão/i })); });
      expect(screen.getByLabelText("Descrição")).toHaveValue("predios velhos");
    });
  });
});
