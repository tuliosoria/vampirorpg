import { describe, it, expect } from "vitest";
import { act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiProvider } from "../api/ApiProvider";
import { MockApiClient } from "../api/mockClient";
import { CorrespondencePanel } from "./CorrespondencePanel";

const houseInput = {
  name: "Ventrue", motto: "O Sol jamais se curva!", emblem: { icon: "chama", color1: "#7f1d1d", color2: "#3f3f46" },
  castleName: "Sahra-Lun", townsText: "Oásis e observatórios.", historyText: "Uma Casa de estudiosos.",
  specialty: "Astronomia", weakness: "Orgulho",
  attributes: { riqueza: 4, recursos: 3, soldados: 1, controle: 2 },
} as never;

async function setup() {
  const client = new MockApiClient();
  const account = await client.createAccountAndHouse(houseInput);
  await act(async () => {
    render(
      <ApiProvider client={client}>
        <CorrespondencePanel playerToken={account.playerToken} houseName="Ventrue" />
      </ApiProvider>,
    );
  });
  return client;
}

describe("CorrespondencePanel", () => {
  it("lista as Casas com a distância e quantas cartas restam", async () => {
    // A distância é a regra do jogo, então precisa estar visível: recusar uma
    // carta sem explicar pareceria arbitrário.
    await setup();
    await waitFor(() => expect(screen.getByText("Clã Brujah")).toBeInTheDocument());
    // Subtítulo: cartas restantes · nº de pessoas endereçáveis · distância em dias.
    const lines = screen.getAllByText(/\d+\/\d+ cartas · \d+ pessoas? · ~\d+d/);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("deixa escolher entre a chancelaria e um NPC específico ao abrir um destino", async () => {
    await setup();
    await waitFor(() => expect(screen.getByText("Clã Brujah")).toBeInTheDocument());
    await act(async () => { await userEvent.click(screen.getByText("Clã Brujah")); });
    expect(await screen.findByText("Para quem escrever?")).toBeInTheDocument();
    expect(screen.getByText("A chancelaria")).toBeInTheDocument();
    expect(screen.getByText("Capitã Solano")).toBeInTheDocument();
  });

  it("marca a Casa de outro jogador como indisponível", async () => {
    await setup();
    await waitFor(() => expect(screen.getByText("conduzida por outro jogador")).toBeInTheDocument());
  });

  it("envia uma carta e mostra a resposta da Casa", async () => {
    await setup();
    await waitFor(() => expect(screen.getByText("Clã Brujah")).toBeInTheDocument());
    await act(async () => { await userEvent.click(screen.getByText("Clã Brujah")); });
    await act(async () => {
      await userEvent.type(screen.getByRole("textbox", { name: /Carta para Clã Brujah/ }), "Propomos uma aliança.");
    });
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: "Enviar carta" })); });

    await waitFor(() => expect(screen.getByText("Propomos uma aliança.")).toBeInTheDocument());
    expect(screen.getByText(/responde com cautela/)).toBeInTheDocument();
  });

  it("deixa endereçar uma pessoa da Casa, e a carta vai para o fio dela", async () => {
    await setup();
    await waitFor(() => expect(screen.getByText("Clã Brujah")).toBeInTheDocument());
    await act(async () => { await userEvent.click(screen.getByText("Clã Brujah")); });

    // Escolhe a pessoa; o campo de escrita passa a nomeá-la.
    await act(async () => { await userEvent.click(screen.getByText("Capitã Solano")); });
    await act(async () => {
      await userEvent.type(screen.getByRole("textbox", { name: /Carta para Capitã Solano/ }), "Escrevo a você diretamente.");
    });
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: "Enviar carta" })); });

    await waitFor(() => expect(screen.getByText("Escrevo a você diretamente.")).toBeInTheDocument());
    // A resposta pessoal, não a da chancelaria.
    expect(screen.getByText(/na própria voz/)).toBeInTheDocument();

    // Voltar à chancelaria esconde a conversa pessoal: são fios distintos.
    await act(async () => { await userEvent.click(screen.getByText("A chancelaria")); });
    expect(screen.queryByText("Escrevo a você diretamente.")).not.toBeInTheDocument();
  });

  it("esgota o orçamento e explica a distância em vez de só sumir com o campo", async () => {
    await setup();
    await waitFor(() => expect(screen.getByText("Clã Malkavian")).toBeInTheDocument());
    await act(async () => { await userEvent.click(screen.getByText("Clã Malkavian")); });
    await act(async () => {
      await userEvent.type(screen.getByRole("textbox", { name: /Carta para Clã Malkavian/ }), "Notícias do sul.");
    });
    await act(async () => { await userEvent.click(screen.getByRole("button", { name: "Enviar carta" })); });

    await waitFor(() => expect(screen.getByText(/Sem mensageiros disponíveis/)).toBeInTheDocument());
    expect(screen.getByText(/dias de viagem/)).toBeInTheDocument();
  });
});

describe("abrir uma Casa vinda do sino", () => {
  async function montarCom(abrirCasa?: string) {
    const client = new MockApiClient();
    const account = await client.createAccountAndHouse(houseInput);
    await act(async () => {
      render(
        <ApiProvider client={client}>
          <CorrespondencePanel playerToken={account.playerToken} houseName="Ventrue" abrirCasa={abrirCasa} />
        </ApiProvider>,
      );
    });
  }

  // O aviso aponta uma conversa específica. Sem isto o jogador chegava na aba
  // certa e ainda tinha de procurar quem lhe escreveu.
  it("abre o fio da Casa pedida pela URL", async () => {
    await montarCom("cla-brujah");
    expect(await screen.findByRole("heading", { name: /Clã Brujah/i })).toBeInTheDocument();
  });

  it("não abre nada quando ninguém foi pedido", async () => {
    await montarCom();
    expect(await screen.findByText(/Escolha a quem escrever/i)).toBeInTheDocument();
  });
});
