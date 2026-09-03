import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeroVideo } from "./HeroVideo";

/**
 * jsdom não implementa matchMedia, e o componente decide o que montar por ela.
 * `query` recebe as consultas que devem responder verdadeiro.
 */
function mockMedia(...matching: string[]) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matching.some((m) => query.includes(m)),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("HeroVideo", () => {
  it("monta o vídeo mudo, em loop e sem controles na tela larga", () => {
    mockMedia();
    render(<HeroVideo>conteúdo</HeroVideo>);

    const video = screen.getByTestId("hero-video");
    expect(video).toHaveAttribute("poster", "/hero-poster.jpg");
    expect(video).toHaveAttribute("src", "/hero.mp4");
    // Autoplay só é permitido em vídeo mudo; sem isto o hero fica parado.
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveProperty("loop", true);
    expect(video).toHaveProperty("autoplay", true);
    expect(video).toHaveAttribute("aria-hidden", "true");
  });

  // Não basta pausar: o objetivo é não baixar os 2,9 MB.
  it("não monta o vídeo quando o usuário pede menos movimento", () => {
    mockMedia("prefers-reduced-motion");
    render(<HeroVideo>conteúdo</HeroVideo>);

    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });

  it("não monta o vídeo em viewport estreita", () => {
    mockMedia("max-width: 900px");
    render(<HeroVideo>conteúdo</HeroVideo>);

    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
  });

  // Sem vídeo o hero não pode virar um retângulo preto atrás do texto.
  // O hero tem chão próprio: a crônica nasce sem mídia, e o degradê oxblood
  // sustenta a seção sozinho. O poster entra por cima quando existir.
  it("desenha o chão do hero mesmo sem vídeo nem poster", () => {
    mockMedia("prefers-reduced-motion");
    const { container } = render(<HeroVideo>conteúdo</HeroVideo>);

    const fundo = getComputedStyle(container.querySelector("section")!).backgroundImage;
    expect(fundo).toContain("/hero-poster.jpg");
    expect(fundo).toContain("radial-gradient");
  });

  it("renderiza o conteúdo por cima", () => {
    mockMedia();
    render(
      <HeroVideo>
        <h1>A Cidade</h1>
      </HeroVideo>,
    );

    expect(screen.getByRole("heading", { name: "A Cidade" })).toBeInTheDocument();
  });
});
