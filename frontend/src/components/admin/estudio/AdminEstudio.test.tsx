import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
  await act(async () => {
    render(
      <ApiProvider client={client}>
        <CanonProvider>
          <AdminEstudio adminToken="t" secao={secao} />
        </CanonProvider>
      </ApiProvider>,
    );
  });
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
});
