import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SEATS, addressableNpcs, aplicarCanon, limparCanonAplicado, houseRoster } from "@vampiro/content";
import { ApiProvider } from "./api/ApiProvider";
import { CanonProvider } from "./api/CanonProvider";
import { MockApiClient } from "./api/mockClient";
import { AppRoutes } from "./App";

/**
 * O ciclo inteiro: o Narrador cadastra um clã e a Cidade passa a existir.
 *
 * É o teste que justifica o sub-projeto. Antes dele, cadastrar um clã gravava
 * uma linha no banco e não acontecia mais nada — o mapa continuava vazio, a
 * lista de destinatários em branco e a página do clã dizendo que ele não
 * existe, porque o motor lê de constantes que só o código povoava.
 */
beforeEach(limparCanonAplicado);

async function comCanonCarregado(client: MockApiClient, rota: string) {
  await act(async () => {
    render(
      <ApiProvider client={client}>
        <CanonProvider>
          <MemoryRouter initialEntries={[rota]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
          </MemoryRouter>
        </CanonProvider>
      </ApiProvider>,
    );
  });
}

describe("o mundo que o Narrador escreve", () => {
  it("um clã salvo entra no mapa do motor", async () => {
    const client = new MockApiClient();
    await client.adminSaveCla("t", { name: "Clã Ventrue", refugio: "Banco Providência", x: 700, y: 500 });

    aplicarCanon(await client.listCla());

    expect(SEATS.map((s) => s.key)).toEqual(["cla-ventrue"]);
  });

  it("um clã com líder vira destinatário de carta, sem mais nenhum passo", async () => {
    const client = new MockApiClient();
    await client.adminSaveCla("t", {
      name: "Clã Ventrue",
      lider: {
        leaderName: "Vasco Aranha", title: "Príncipe", temperament: "", speechStyle: "",
        wants: "", refuses: "", crownStance: "", interests: "",
      },
    });

    aplicarCanon(await client.listCla());

    expect(addressableNpcs().map((n) => n.name)).toContain("Vasco Aranha");
  });

  it("o elenco da ficha vira o elenco do clã", async () => {
    const client = new MockApiClient();
    await client.adminSaveCla("t", {
      name: "Clã Nosferatu",
      elenco: [{ name: "Rala", role: "Anciã", description: "Conhece os túneis.", wants: "Silêncio.", hides: "Que vende duas vezes." }],
    });

    aplicarCanon(await client.listCla());

    expect(houseRoster("cla-nosferatu").map((c) => c.name)).toEqual(["Rala"]);
  });

  // O provedor é quem fecha o ciclo no navegador: sem ele o bundle carrega com
  // as constantes vazias e a Cidade aparece deserta mesmo cheia no banco.
  it("a página dos clãs mostra o que foi cadastrado", async () => {
    const client = new MockApiClient();
    await client.adminSaveCla("t", { name: "Clã Ventrue", refugio: "Banco Providência" });

    await comCanonCarregado(client, "/clas");

    expect(await screen.findByText("Clã Ventrue")).toBeInTheDocument();
  });

  it("sem clã cadastrado, o site abre vazio em vez de quebrar", async () => {
    await comCanonCarregado(new MockApiClient(), "/clas");
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(20);
    expect(SEATS).toHaveLength(0);
  });
});
