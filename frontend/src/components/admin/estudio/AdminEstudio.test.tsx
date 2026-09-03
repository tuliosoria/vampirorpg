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

async function abrir(client: MockApiClient) {
  await act(async () => {
    render(
      <ApiProvider client={client}>
        <CanonProvider>
          <AdminEstudio adminToken="t" />
        </CanonProvider>
      </ApiProvider>,
    );
  });
}

describe("AdminEstudio", () => {
  it("abre nas cinco abas mais a Cidade", async () => {
    await abrir(new MockApiClient());
    for (const aba of ["Cidade", "Bairros", "Personagens", "Locais", "Tramas", "Contos"]) {
      expect(await screen.findByRole("tab", { name: new RegExp(`^${aba}`) })).toBeInTheDocument();
    }
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
    await abrir(new MockApiClient());
    await act(async () => { await userEvent.click(screen.getByRole("tab", { name: /^Personagens/ })); });
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: /Novo personagem/i })); });

    expect(screen.getByLabelText(/🔒 Objetivos/)).toBeInTheDocument();
    expect(screen.getByLabelText(/🔒 Poder/)).toBeInTheDocument();
    expect(screen.getByLabelText("História")).toBeInTheDocument();
  });

  // Guardar clã num lobisomem colocaria um estranho no elenco na próxima
  // aplicação do cânone; o formulário nem oferece o campo.
  it("o campo de clã só aparece para vampiro", async () => {
    await abrir(new MockApiClient());
    await act(async () => { await userEvent.click(screen.getByRole("tab", { name: /^Personagens/ })); });
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

  it("um bairro salvo aparece na lista e vira opção de local", async () => {
    const client = new MockApiClient();
    await abrir(client);
    await act(async () => { await userEvent.click(screen.getByRole("tab", { name: /^Bairros/ })); });
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: /Novo bairro/i })); });
    await act(async () => {
      await userEvent.type(screen.getByLabelText("Nome do bairro"), "Centro Velho");
      await userEvent.click(screen.getByRole("button", { name: /^Salvar$/i }));
    });

    expect(await screen.findByText("Centro Velho")).toBeInTheDocument();

    await act(async () => { await userEvent.click(screen.getByRole("tab", { name: /^Locais/ })); });
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: /Novo local/i })); });
    await act(async () => { fireEvent.mouseDown(screen.getByRole("combobox", { name: "Bairro" })); });
    expect(await screen.findByRole("option", { name: "Centro Velho" })).toBeInTheDocument();
  });

  it("a trama nasce invisível, e o que sai para o jogador não a contém", async () => {
    const client = new MockApiClient();
    await abrir(client);
    await act(async () => { await userEvent.click(screen.getByRole("tab", { name: /^Tramas/ })); });
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
