import { act } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SEATS } from "@vampiro/content";
import { ApiProvider } from "../api/ApiProvider";
import { MockApiClient } from "../api/mockClient";
import { LandingPage } from "./LandingPage";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => vi.unstubAllGlobals());

async function setup() {
  await act(async () => {
    render(
      <ApiProvider client={new MockApiClient()}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </ApiProvider>,
    );
  });
}

describe("LandingPage", () => {
  // As rotas de entrar na campanha só existiam aqui e no menu nenhum; o hero
  // é agora a porta principal, então os destinos precisam estar certos.
  it("leva a criar Casa e a explorar a Cidade pelo hero", async () => {
    await setup();

    const criar = screen.getAllByRole("link", { name: "Criar seu vampiro" });
    expect(criar.length).toBeGreaterThan(0);
    expect(criar[0]).toHaveAttribute("href", "/criar");
    expect(screen.getByRole("link", { name: "Explorar a Cidade" })).toHaveAttribute("href", "/cidade");
  });


  it("mostra o hero em vídeo com o título da campanha", async () => {
    await setup();

    expect(screen.getByTestId("hero-video")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  // A spec pedia estado da campanha e Casas em destaque; a primeira entrega
  // ficou sem os dois.
  it("mostra o estado da campanha com as dezesseis potências", async () => {
    await setup();

    expect(screen.getByText(String(SEATS.length))).toBeInTheDocument();
    expect(screen.getByText("Potências na cidade")).toBeInTheDocument();
      });

  it("destaca três Casas e leva à página de cada uma", async () => {
    await setup();

    expect(screen.getByRole("link", { name: /Clã Ventrue/ })).toHaveAttribute(
      "href",
      "/cla/cla-ventrue",
    );
    expect(screen.getByRole("link", { name: /Clã Nosferatu/ })).toHaveAttribute(
      "href",
      "/cla/cla-nosferatu",
    );
    expect(screen.getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/clas");
  });

  // Verbete e brasão vêm do acervo; a home não pode depender deles.
  it("continua utilizável quando o acervo não responde", async () => {
    const client = new MockApiClient();
    client.getWiki = () => Promise.reject(new Error("fora do ar"));
    client.getVisualGallery = () => Promise.reject(new Error("fora do ar"));

    await act(async () => {
      render(
        <ApiProvider client={client}>
          <MemoryRouter>
            <LandingPage />
          </MemoryRouter>
        </ApiProvider>,
      );
    });

    expect(screen.getByText("Verbetes na crônica")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Clã Ventrue/ })).toBeInTheDocument();
  });

  // A faixa encostava à esquerda enquanto o hero ficava centrado. A primeira
  // correção pôs `mx: auto` e este teste passou — mas a página continuou
  // torta, porque o pai é um flex em coluna e o item esticado nunca deixa
  // espaço livre para a margem automática absorver. Quem centraliza é o
  // `alignSelf`.
  //
  // jsdom não calcula layout, então isto guarda as declarações e não o
  // resultado; a posição real foi medida no navegador.
  it("centraliza as faixas de conteúdo", async () => {
    await setup();

    const band = document.querySelector("#estado");
    expect(band).not.toBeNull();
    const style = getComputedStyle(band as Element);
    expect(style.alignSelf).toBe("center");
    expect(style.marginLeft).toBe("auto");
  });

  it("explica como se joga em quatro passos", async () => {
    await setup();

    expect(screen.getByText("Escolha o seu clã")).toBeInTheDocument();
    expect(screen.getByText("Aja a cada noite")).toBeInTheDocument();
    expect(screen.getByText("A Cidade responde")).toBeInTheDocument();
    expect(screen.getByText("Acompanhe a crônica")).toBeInTheDocument();
  });
});

