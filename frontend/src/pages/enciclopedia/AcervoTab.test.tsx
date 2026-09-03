import { describe, it, expect, afterEach, vi } from "vitest";
import { act } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WikiEntry } from "@vampiro/content";
import { ApiProvider } from "../../api/ApiProvider";
import { MockApiClient } from "../../api/mockClient";
import { AcervoTab, firstPopulatedSection, loreSummary, entityTypeForSection } from "./AcervoTab";
import { saveAdminToken, clearAdminToken } from "../../auth/adminSession";

const TOKEN = "mock-admin-token";

async function setup(isAdmin: boolean, client = new MockApiClient()) {
  await client.adminSeedWiki(TOKEN);
  if (isAdmin) saveAdminToken(TOKEN);
  await act(async () => {
    render(
      <ApiProvider client={client}>
        <AcervoTab isAdmin={isAdmin} />
      </ApiProvider>,
    );
  });
  return client;
}

function coverage(): { covered: number; total: number } {
  const text = screen.getByText(/\d+ de \d+ verbetes com cânone visual/).textContent ?? "";
  const m = /(\d+) de (\d+)/.exec(text);
  if (!m) throw new Error(`coverage line not parseable: ${text}`);
  return { covered: Number(m[1]), total: Number(m[2]) };
}

function entry(entryId: string, section: string, title: string): WikiEntry {
  return { entryId, section, title, body: "", order: 0, updatedAt: "" };
}

describe("firstPopulatedSection", () => {
  it("skips sections that have no entries", () => {
    expect(firstPopulatedSection([entry("w1", "clas", "Clã Tremere")])).toBe("clas");
  });

  it("keeps WIKI_SECTIONS ordering among populated sections", () => {
    const entries = [entry("w1", "clas", "A"), entry("w2", "corte", "B")];
    // "corte" precedes "clas" in WIKI_SECTIONS.
    expect(firstPopulatedSection(entries)).toBe("corte");
  });

  it("returns null when there are no entries at all", () => {
    expect(firstPopulatedSection([])).toBeNull();
  });
});

describe("entityTypeForSection", () => {
  it("uses the obvious type when the section names one", () => {
    expect(entityTypeForSection("clas")).toBe("HOUSE");
    expect(entityTypeForSection("lugares")).toBe("CITY");
    expect(entityTypeForSection("bairros")).toBe("REGION");
    expect(entityTypeForSection("religioes")).toBe("HOUSE");
  });

  it("falls back to SCENE for sections with no entity-shaped subject", () => {
    expect(entityTypeForSection("costumes")).toBe("SCENE");
    expect(entityTypeForSection("qualquer-coisa")).toBe("SCENE");
  });

  /**
   * entityType is fixed at creation, so a section label that lies about its
   * contents mistypes every entry promoted from it, permanently. "Povos de
   * a Cidade" holds Idiomas, Alimentação, Família e herança, Educação and
   * Justiça cotidiana — cultural topics, not peoples — and "Calendário" holds
   * the calendar itself, the week and lists of festivals, not single events.
   */
  it("does not promise a type the section's real entries cannot deliver", () => {
    expect(entityTypeForSection("seitas")).toBe("SCENE");
    expect(entityTypeForSection("calendario")).toBe("SCENE");
    // Six magia entries, one of them an order; the other five are abstractions.
    expect(entityTypeForSection("disciplinas")).toBe("SCENE");
  });

  it("keeps no mapping for sections the wiki never populates", () => {
    for (const dead of ["criaturas", "cacadores", "historia"]) {
      expect(entityTypeForSection(dead)).toBe("SCENE");
    }
  });
});

describe("loreSummary", () => {
  it("skips the markdown metadata block and takes the first prose paragraph", () => {
    const body = "> **Lema:** “Todo nome merece um último toque.”\n\n### Por que o Sino?\n\nA religião ensina que o mundo começou com um som.\n\nOutro parágrafo.";
    expect(loreSummary(body)).toBe("A religião ensina que o mundo começou com um som.");
  });

  it("strips markdown emphasis", () => {
    expect(loreSummary("Os **Ferrumor** descendem de _Caladris_.")).toBe(
      "Os Ferrumor descendem de Caladris.",
    );
  });

  it("truncates long paragraphs on a word boundary", () => {
    const long = `${"palavra ".repeat(80)}fim.`;
    const out = loreSummary(long);
    expect(out.length).toBeLessThanOrEqual(281);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/palavr…$/);
  });

  it("returns an empty string when there is no prose", () => {
    expect(loreSummary("")).toBe("");
    expect(loreSummary("### Só um título\n\n- item\n- item")).toBe("");
  });
});

describe("AcervoTab", () => {
  afterEach(() => clearAdminToken());

  it("shows a loading state until both requests resolve", async () => {
    const client = new MockApiClient();
    await client.adminSeedWiki(TOKEN);
    vi.spyOn(client, "listVisualEntities").mockReturnValue(new Promise(() => {}));
    await act(async () => {
      render(
        <ApiProvider client={client}>
          <AcervoTab isAdmin={false} />
        </ApiProvider>,
      );
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an error with a retry that recovers", async () => {
    const client = new MockApiClient();
    await client.adminSeedWiki(TOKEN);
    const spy = vi.spyOn(client, "getWiki").mockRejectedValueOnce(new Error("rede caiu"));
    await act(async () => {
      render(
        <ApiProvider client={client}>
          <AcervoTab isAdmin={false} />
        </ApiProvider>,
      );
    });
    expect(screen.getByText("rede caiu")).toBeInTheDocument();
    spy.mockRestore();
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    });
    expect(screen.getByText(/verbetes com cânone visual/)).toBeInTheDocument();
  });

  it("shows the coverage line over the whole wiki", async () => {
    await setup(false);
    const { covered, total } = coverage();
    // The two seeded visual entities are unlinked, so nothing is covered yet.
    expect(covered).toBe(0);
    expect(total).toBeGreaterThan(0);
  });

  it("marks entries that have no visual entity", async () => {
    await setup(false);
    expect(screen.getAllByText("visual ✗").length).toBeGreaterThan(0);
    expect(screen.getAllByText("lore ✓").length).toBe(screen.getAllByText("visual ✗").length);
  });

  it("switches sections", async () => {
    await setup(false);
    expect(screen.getByText("A Cidade, depois do anoitecer")).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Os Clãs" }));
    });
    expect(screen.getByText("Clã Tremere — O Sangue da Coroa")).toBeInTheDocument();
    expect(screen.queryByText("A Cidade, depois do anoitecer")).not.toBeInTheDocument();
  });

  it("lets an admin promote a lore entry into a visual entity", async () => {
    const client = await setup(true);
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Religiões" }));
    });
    const row = screen.getByText("A fé que sobrou").closest("li");
    expect(row).not.toBeNull();
    await act(async () => {
      await userEvent.click(
        within(row as HTMLElement).getByRole("button", { name: "Criar entidade visual" }),
      );
    });

    // The canon sheet for the new entity opens straight away.
    expect(await screen.findByText("Traços imutáveis")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveTextContent("A fé que sobrou");

    const created = (await client.listVisualEntities()).find(
      (e) => e.canonicalName === "A fé que sobrou",
    );
    expect(created).toBeDefined();
    expect(created?.wikiEntryId).toBeTruthy();
    expect(created?.entityType).toBe("HOUSE");

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    });
    expect(coverage().covered).toBe(1);
    expect(within(row as HTMLElement).getByText("visual ✓")).toBeInTheDocument();
  });

  it("saves canon edits from the dialog", async () => {
    const client = await setup(true);
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Os Clãs" }));
    });
    const row = screen.getByText("Clã Tremere — O Sangue da Coroa").closest("li") as HTMLElement;
    await act(async () => {
      await userEvent.click(within(row).getByRole("button", { name: "Criar entidade visual" }));
    });
    await screen.findByText("Traços imutáveis");
    await act(async () => {
      await userEvent.type(
        screen.getByRole("textbox", { name: "Novo traço imutável" }),
        "coroa de ferro",
      );
    });
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Adicionar traço" }));
    });
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Salvar cânone" }));
    });
    await waitFor(async () => {
      const saved = (await client.listVisualEntities()).find(
        (e) => e.canonicalName === "Clã Tremere — O Sangue da Coroa",
      );
      expect(saved?.immutableTraits.map((t) => t.text)).toContain("coroa de ferro");
    });
  });

  it("keeps trait identity when the same sheet is saved twice", async () => {
    const client = await setup(true);
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Os Clãs" }));
    });
    const row = screen.getByText("Clã Toreador — Os Lobos da Fronteira").closest("li") as HTMLElement;
    await act(async () => {
      await userEvent.click(within(row).getByRole("button", { name: "Criar entidade visual" }));
    });
    await screen.findByText("Traços imutáveis");
    await act(async () => {
      await userEvent.type(screen.getByRole("textbox", { name: "Novo traço imutável" }), "pelagem cinza");
    });
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Adicionar traço" }));
    });
    const traitId = async () => {
      const e = (await client.listVisualEntities()).find(
        (x) => x.canonicalName === "Clã Toreador — Os Lobos da Fronteira",
      );
      return e?.immutableTraits[0]?.id;
    };
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Salvar cânone" }));
    });
    const first = await traitId();
    expect(first).toBeTruthy();
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Salvar cânone" }));
    });
    // Re-saving must patch the same trait, not replace it: a fresh id would
    // reset the trait's provenance and drop the asset it was discovered from.
    expect(await traitId()).toBe(first);
  });

  it("hides entity creation from non-admins", async () => {
    await setup(false);
    expect(screen.queryByRole("button", { name: "Criar entidade visual" })).not.toBeInTheDocument();
  });

  it("still lets a non-admin read the canon sheet of a covered entry", async () => {
    const client = new MockApiClient();
    await client.adminSeedWiki(TOKEN);
    const entries = await client.getWiki();
    const target = entries.find((e) => e.section === "clas");
    await client.createVisualEntity(TOKEN, {
      canonicalName: target!.title,
      entityType: "HOUSE",
      wikiEntryId: target!.entryId,
    });
    await setup(false, client);
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Os Clãs" }));
    });
    const row = screen.getByText(target!.title).closest("li") as HTMLElement;
    expect(within(row).getByText("visual ✓")).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(within(row).getByRole("button", { name: /Ver cânone visual/ }));
    });
    expect(await screen.findByText("Traços imutáveis")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar cânone" })).not.toBeInTheDocument();
  });

  it("lists seeded entities that have no verbete and links them", async () => {
    // Sem verbete sintético: a entidade semeada precisa alcançar o título real
    // do verbete só pelo casador de nomes.
    const client = await setup(true);
    const link = "Vincular a Banco Providência";

    expect(screen.getByText("Entidades sem verbete")).toBeInTheDocument();
    expect(screen.getByText("Vasco Aranha")).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: link }));
    });
    await waitFor(async () => {
      const linked = (await client.listVisualEntities()).find((e) => e.id === "e2");
      expect(linked?.wikiEntryId).toBeTruthy();
    });
    // Once linked it leaves the unlinked list and counts towards coverage.
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: link })).not.toBeInTheDocument(),
    );
    expect(coverage().covered).toBe(1);
  });

  it("lets an admin link an entity the matcher cannot resolve", async () => {
    const client = await setup(true);
    const row = screen.getByText("Vasco Aranha").closest("li") as HTMLElement;
    expect(row).not.toBeNull();

    const picker = within(row).getByRole("combobox", { name: "Escolher verbete" });
    await act(async () => {
      await userEvent.click(picker);
      await userEvent.type(picker, "Clã Tremere");
    });
    await act(async () => {
      await userEvent.click(
        await screen.findByRole("option", { name: "Clã Tremere — O Sangue da Coroa" }),
      );
    });

    await waitFor(async () => {
      const linked = (await client.listVisualEntities()).find((e) => e.id === "e1");
      expect(linked?.wikiEntryId).toBeTruthy();
    });
  });

  it("hides the reconciliation panel from non-admins", async () => {
    await setup(false);
    expect(screen.queryByText("Entidades sem verbete")).not.toBeInTheDocument();
  });
});
