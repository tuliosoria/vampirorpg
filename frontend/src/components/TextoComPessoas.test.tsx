import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TextoComPessoas } from "./TextoComPessoas";
import { WikiMarkdown } from "./WikiMarkdown";

function mostrar(no: React.ReactNode) {
  return render(<MemoryRouter>{no}</MemoryRouter>);
}

describe("nome de gente vira link", () => {
  // A pergunta que originou tudo: "eu não lembrava quem era Dama Vasco".
  it("leva o leitor até a ficha de quem ele não reconheceu", () => {
    mostrar(<TextoComPessoas texto="A Vasco Aranha fechou os portões ao amanhecer." />);
    expect(screen.getByRole("link", { name: "Vasco" })).toHaveAttribute(
      "href",
      "/personagens/vasco-aranha",
    );
  });

  it("não altera uma vírgula do texto", () => {
    const texto = "Solano escreveu a Vasco sobre Vasco, e ninguém respondeu.";
    const { container } = mostrar(<TextoComPessoas texto={texto} />);
    expect(container.textContent).toBe(texto);
  });

  it("linka a primeira menção e deixa as outras em paz", () => {
    mostrar(<TextoComPessoas texto="Vasco mandou aviso. Vasco não esperou resposta." />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("não transforma o nome de uma Casa em pessoa", () => {
    mostrar(<TextoComPessoas texto="A Clã Brujah recusou o tributo." />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("dentro do texto do turno", () => {
  it("linka nomes no meio de um parágrafo de markdown", () => {
    mostrar(<WikiMarkdown body="O conselho ouviu **em silêncio** quando Vasco falou." />);
    expect(screen.getByRole("link", { name: "Vasco" })).toHaveAttribute(
      "href",
      "/personagens/vasco-aranha",
    );
  });

  it("não mexe no link que o autor escreveu", () => {
    mostrar(<WikiMarkdown body="Veja [o relatório de Vasco](/cidade/cronica)." />);
    const link = screen.getByRole("link", { name: "o relatório de Vasco" });
    expect(link).toHaveAttribute("href", "/cidade/cronica");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("deixa o título do verbete em paz", () => {
    mostrar(<WikiMarkdown body="# Vasco Voss\n\nUm parágrafo qualquer." />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
