import { describe, it, expect } from "vitest";
import { act } from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiProvider } from "../../api/ApiProvider";
import { MockApiClient } from "../../api/mockClient";
import type { ApiClient } from "../../api/client";
import { CasaPage } from "./CasaPage";

const ASTERIA = [
  "A prefeitura selou duas entradas da galeria, e o que ficou preso lá dentro não saiu.",
  "Rala morreu antes que alguém pensasse em procurá-la.",
].join("\n");

function clientWith(chronicle: string): ApiClient {
  const mock = new MockApiClient();
  return Object.assign(Object.create(Object.getPrototypeOf(mock)), mock, {
    getChronicle: async () => chronicle,
    getVisualGallery: async () => [
      { id: "emb", entityId: "emblem-cla-nosferatu", storageUrl: "https://img/emb.png", thumbnailUrl: null },
    ],
    listVisualEntities: async () => [{ id: "emblem-cla-nosferatu", canonicalName: "Brasão — Clã Nosferatu" }],
    getWiki: async () => [],
  }) as ApiClient;
}

async function setup(chave: string, chronicle = ASTERIA) {
  await act(async () => {
    render(
      <ApiProvider client={clientWith(chronicle)}>
        <MemoryRouter initialEntries={[`/cla/${chave}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/cla/:chave" element={<CasaPage />} />
            <Route path="/clas" element={<p>lista de Casas</p>} />
          </Routes>
        </MemoryRouter>
      </ApiProvider>,
    );
  });
}

describe("CasaPage", () => {
  it("mostra o brasão, a sede e a população canônica", async () => {
    await setup("cla-nosferatu");

    expect(screen.getByRole("heading", { name: "Clã Nosferatu" })).toBeInTheDocument();
    expect(screen.getByText("Sede em Galeria Subterrânea")).toBeInTheDocument();
    expect(screen.getByText("90.000 habitantes")).toBeInTheDocument();
    expect(screen.getByAltText("Brasão da Clã Nosferatu")).toHaveAttribute("src", "https://img/emb.png");
  });

  it("lista as figuras da Casa", async () => {
    await setup("cla-nosferatu");
    expect(screen.getByText("Figuras importantes")).toBeInTheDocument();
  });

  /**
   * O dossiê da Casa é público e não exige sessão. Antecipar o que cada figura
   * persegue — e pior, o que ela esconde — entregava a mesa de graça.
   */
  it("não entrega o que as figuras querem nem o que escondem", async () => {
    await setup("cla-nosferatu");
    expect(screen.getByText("Figuras importantes")).toBeInTheDocument();
    expect(screen.queryByText("Esconde")).not.toBeInTheDocument();
    expect(screen.queryByText("Quer")).not.toBeInTheDocument();
    expect(screen.queryByText("Busca")).not.toBeInTheDocument();
  });

  it("leva da figura à ficha onde está a história dela", async () => {
    await setup("cla-nosferatu");
    const [link] = screen.getAllByRole("link", { name: "Ver a história" });
    expect(link).toHaveAttribute("href", expect.stringContaining("/personagens/"));
  });

  /**
   * O erro que esta página existe para não cometer: apresentar como vivo
   * alguém que a campanha já matou.
   */
  it("marca como morto quem a crônica declara morto", async () => {
    await setup("cla-nosferatu");
    expect(screen.getAllByText("morto").length).toBeGreaterThan(0);
  });

  it("não marca ninguém quando a crônica está vazia", async () => {
    await setup("cla-nosferatu", "");
    expect(screen.queryByText("morto")).not.toBeInTheDocument();
  });

  it("redireciona chave desconhecida para a lista", async () => {
    await setup("casa-inexistente");
    expect(screen.getByText("lista de Casas")).toBeInTheDocument();
  });
  it("liga a Casa à crônica, que é onde o mundo é descrito", async () => {
    await setup("cla-nosferatu");

    const link = await screen.findByRole("link", { name: /Os clãs na crônica/i });
    expect(link).toHaveAttribute("href", "/cidade/clas");
  });
  it("acende Os Clãs na barra lateral, que é a página onde o leitor mais se perde", async () => {
    // A rota do dossiê é /cla/:chave, e o índice é /casas: sem tratamento,
    // nenhum item ficava aceso justo no destino de todos os links novos.
    await setup("cla-nosferatu");

    const casca = await screen.findByRole("navigation", { name: /O Mundo/i });
    const item = within(casca).getByRole("link", { name: "Os Clãs" });
    expect(item).toHaveClass("Mui-selected");
  });
});
