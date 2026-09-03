import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WikiEntry } from "@vampiro/content";
import { ReconciliacaoPanel, suggestMatch } from "./ReconciliacaoPanel";

function entry(entryId: string, title: string, section = "clas"): WikiEntry {
  return { entryId, section, title, body: "", order: 0, updatedAt: "" };
}

const ENTRIES = [
  entry("w1", "Corte do Sangue"),
  entry("w2", "Galeria Subterrânea"),
  entry("w3", "Vasco Aranha"),
];

/**
 * Títulos nas formas que os nomes de entidade precisam sobreviver: `Nome —
 * Epíteto` nos verbetes e `Nome (Outro nome)` nas entidades. Os quase-acertos
 * estão aqui de propósito — "Clã Gangrel" e "Clã Ventrue" não podem ser
 * confundidos com os lugares.
 */
const REAL_ENTRIES = [
  entry("c1", "Galeria Subterrânea — A Cidade da Montanha Viva", "lugares"),
  entry("c2", "Teatro Municipal — A Cidade das Asas", "lugares"),
  entry("c3", "Cais Velho — Oásis das Sete Sombras", "lugares"),
  entry("c4", "Clã Setita — O Povo que Quebrou as Correntes"),
  entry("c5", "Clã Gangrel — Os Senhores do Céu"),
  entry("c6", "Clã Ventrue — Os Olhos do Meio-Dia"),
];

describe("suggestMatch", () => {
  it("matches an exact title", () => {
    expect(suggestMatch("Corte do Sangue", ENTRIES)?.entryId).toBe("w1");
  });

  it("ignores case and accents", () => {
    expect(suggestMatch("vasco aranha", ENTRIES)?.entryId).toBe("w3");
    expect(suggestMatch("VASCO ARANHA", ENTRIES)?.entryId).toBe("w3");
  });

  it("trims surrounding whitespace", () => {
    expect(suggestMatch("  Galeria Subterrânea  ", ENTRIES)?.entryId).toBe("w2");
  });

  it("returns null when nothing matches exactly", () => {
    expect(suggestMatch("Clã Tremere", ENTRIES)).toBeNull();
    expect(suggestMatch("", ENTRIES)).toBeNull();
  });

  it("matches a title whose epithet follows an em dash", () => {
    expect(suggestMatch("Galeria Subterrânea", REAL_ENTRIES)?.entryId).toBe("c1");
    expect(suggestMatch("Clã Setita", REAL_ENTRIES)?.entryId).toBe("c4");
  });

  it("does not truncate a name at a hyphen that is not a separator", () => {
    // "Galeria Subterrânea" is one word, not "Khar" with an epithet.
    expect(suggestMatch("Galeria Subterrânea", [entry("z", "Khar — A Fenda Antiga")])).toBeNull();
    expect(suggestMatch("Cais Velho", [entry("z", "Sahra — Nada a Ver")])).toBeNull();
  });

  it("matches through the entity's own parenthetical", () => {
    expect(suggestMatch("Gangrel (Teatro Municipal)", REAL_ENTRIES)?.entryId).toBe("c2");
    expect(suggestMatch("Ventrue (Cais Velho)", REAL_ENTRIES)?.entryId).toBe("c3");
  });

  it("prefers the whole name over a parenthetical head", () => {
    const entries = [...REAL_ENTRIES, entry("c7", "Gangrel (Teatro Municipal)", "lugares")];
    expect(suggestMatch("Gangrel (Teatro Municipal)", entries)?.entryId).toBe("c7");
  });

  it("still declines the seeded entities that have no verbete at all", () => {
    for (const name of [
      "Vasco Aranha",
      "Lady Inês Tremere",
      "Mapa Oficial da Cidade",
      "Elfos de Ventrue",
      "Elfos de Cais Velho",
      "Gnomos de Gangrel",
    ]) {
      expect(suggestMatch(name, REAL_ENTRIES)).toBeNull();
    }
  });

  it("declines rather than guessing when two entries share a head", () => {
    const entries = [entry("a", "Ferrum — A Cidade"), entry("b", "Ferrum — A Casa")];
    expect(suggestMatch("Ferrum", entries)).toBeNull();
  });
});

describe("ReconciliacaoPanel", () => {
  it("renders nothing when there are no unlinked entities", () => {
    const { container } = render(
      <ReconciliacaoPanel unlinked={[]} entries={ENTRIES} onLink={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("offers a link button for a matched entity", async () => {
    const onLink = vi.fn();
    render(
      <ReconciliacaoPanel
        unlinked={[{ id: "e1", canonicalName: "Corte do Sangue" }]}
        entries={ENTRIES}
        onLink={onLink}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Vincular a Corte do Sangue" }));
    expect(onLink).toHaveBeenCalledWith("e1", "w1");
  });

  it("offers a working manual picker when nothing matches", async () => {
    const onLink = vi.fn();
    render(
      <ReconciliacaoPanel
        unlinked={[{ id: "e9", canonicalName: "Mapa Oficial da Cidade" }]}
        entries={REAL_ENTRIES}
        onLink={onLink}
      />,
    );
    expect(screen.getByText("Mapa Oficial da Cidade")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Vincular a/ })).not.toBeInTheDocument();

    const picker = screen.getByRole("combobox", { name: "Escolher verbete" });
    await userEvent.click(picker);
    await userEvent.type(picker, "Teatro");
    await userEvent.click(screen.getByRole("option", { name: "Teatro Municipal — A Cidade das Asas" }));
    expect(onLink).toHaveBeenCalledWith("e9", "c2");
  });

  it("keeps the picker as a secondary option next to a suggestion", async () => {
    const onLink = vi.fn();
    render(
      <ReconciliacaoPanel
        unlinked={[{ id: "e1", canonicalName: "Galeria Subterrânea" }]}
        entries={REAL_ENTRIES}
        onLink={onLink}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Vincular a Galeria Subterrânea — A Cidade da Montanha Viva" }),
    ).toBeInTheDocument();

    const picker = screen.getByRole("combobox", { name: "Vincular a outro verbete" });
    await userEvent.click(picker);
    await userEvent.type(picker, "Meio-Dia");
    await userEvent.click(screen.getByRole("option", { name: "Clã Ventrue — Os Olhos do Meio-Dia" }));
    expect(onLink).toHaveBeenCalledWith("e1", "c6");
  });

  it("lists every unlinked entity", () => {
    render(
      <ReconciliacaoPanel
        unlinked={[
          { id: "e1", canonicalName: "Galeria Subterrânea" },
          { id: "e9", canonicalName: "Mapa Oficial da Cidade" },
        ]}
        entries={REAL_ENTRIES}
        onLink={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Vincular a Galeria Subterrânea — A Cidade da Montanha Viva" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mapa Oficial da Cidade")).toBeInTheDocument();
    // Both rows can be resolved by hand; neither is a dead end.
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });
});
