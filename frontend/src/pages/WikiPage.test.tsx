import { describe, it, expect } from "vitest";
import { act } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { fullCodex } from "@vampiro/content";
import { ApiProvider } from "../api/ApiProvider";
import { MockApiClient } from "../api/mockClient";
import { WikiPage } from "./WikiPage";
import { HISTORIAS } from "./historias/historias";

async function setup(client: MockApiClient, path = "/cidade/clas") {
  await act(async () => {
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/cidade/:section" element={<WikiPage />} />
            {/* O destino do redirecionamento precisa existir no harness, senão
                a página vazia é indistinguível de uma falha de render. */}
            <Route path="/cidade" element={<div data-testid="indice">Índice</div>} />
          </Routes>
        </MemoryRouter>
      </ApiProvider>,
    );
  });
}

describe("WikiPage", () => {
  it("does not show a public empty state when the wiki has no entries", async () => {
    await setup(new MockApiClient());
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());

    expect(screen.queryByText(/Nada foi registrado nesta seção ainda/i)).not.toBeInTheDocument();
  });

  it("does not show section links before wiki entries are loaded", async () => {
    const client = new MockApiClient();
    client.getWiki = () => new Promise(() => []);

    await setup(client);

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ocultismo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Os Mortais" })).not.toBeInTheDocument();
  });

  // Antes, uma seção vazia jogava o leitor na primeira seção povoada — ele
  // acabava numa página que não pediu, sem entender por quê. Agora volta ao
  // índice, onde a escolha é dele.
  it("manda a seção vazia de volta ao índice da crônica", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, {
      section: "mortais",
      title: "Censo da Cidade",
      body: "a Cidade possui aproximadamente **2.000.000 de habitantes**.",
      order: 0,
    });

    await setup(client, "/cidade/ocultismo");

    expect(await screen.findByTestId("indice")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ocultismo" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Nada foi registrado nesta seção ainda/i)).not.toBeInTheDocument();
  });

  it("renders entries for the current section only", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, { section: "clas", title: "Clã Toreador", body: "Os lobos do norte.", order: 0 });
    await client.adminCreateWikiEntry(adminToken, { section: "ocultismo", title: "Fronteira", body: "Névoa perpétua.", order: 0 });

    await setup(client, "/cidade/clas");

    // Ancorado no título: o painel de ligações do verbete também escreve
    // "Clã Toreador", e um getByText solto passaria a casar os dois.
    expect(await screen.findByRole("heading", { name: "Clã Toreador" })).toBeInTheDocument();
    expect(screen.getByText("Os lobos do norte.")).toBeInTheDocument();
    expect(screen.queryByText("Névoa perpétua.")).not.toBeInTheDocument();
  });

  it("renders the Censo section route", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, {
      section: "mortais",
      title: "Censo da Cidade",
      body: "a Cidade possui aproximadamente **2.000.000 de habitantes**.",
      order: 0,
    });

    await setup(client, "/cidade/mortais");

    expect(await screen.findByRole("heading", { name: "Os Mortais" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Censo da Cidade" })).toBeInTheDocument();
    expect(screen.getByText("2.000.000 de habitantes").tagName.toLowerCase()).toBe("strong");
  });

  it("renders the Guerras section route", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, {
      section: "guerras",
      title: "As Guerras da Cidade",
      body: "A Guerra das **Cinco Bandeiras** deixou tratados antigos.",
      order: 0,
    });

    await setup(client, "/cidade/guerras");

    expect(await screen.findByRole("heading", { name: "Guerras de Sangue" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "As Guerras da Cidade" })).toBeInTheDocument();
    expect(screen.getByText("Cinco Bandeiras").tagName.toLowerCase()).toBe("strong");
  });

  it("renders the Os Magos section route", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, {
      section: "linhagens",
      title: "Os Vinte e Sete Magos da Corte do Sangue",
      body: "A Ordem mantém **vinte e sete magos** plenamente iniciados.",
      order: 0,
    });

    await setup(client, "/cidade/linhagens");

    expect(await screen.findByRole("heading", { name: "Linhagens" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Os Vinte e Sete Magos da Corte do Sangue" })).toBeInTheDocument();
    expect(screen.getByText("vinte e sete magos").tagName.toLowerCase()).toBe("strong");
  });

  it("renders the Expedição section route", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, {
      section: "lendas",
      title: "A Expedição Além da névoa",
      body: "A **Trigésima Terceira Expedição** partirá no Dia Entre os Anos.",
      order: 0,
    });

    await setup(client, "/cidade/lendas");

    expect(await screen.findByRole("heading", { name: "Boatos e Lendas Urbanas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A Expedição Além da névoa" })).toBeInTheDocument();
    expect(screen.getByText("Trigésima Terceira Expedição").tagName.toLowerCase()).toBe("strong");
  });

  it("renders an entry image above the body text", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, {
      section: "bairros",
      title: "Atlas da Cidade",
      body: "Mapa público do reino.",
      order: 0,
      imageUrl: "/cidade-map.png",
    } as never);

    await setup(client, "/cidade/bairros");

    const image = await screen.findByAltText("Imagem de Atlas da Cidade");
    const body = screen.getByText("Mapa público do reino.");
    expect(image.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders multiple entry images for illustrated Houses", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, {
      section: "clas",
      title: "Clã Gangrel — Os Senhores do Céu",
      body: "Cavaleiros das alturas.",
      order: 0,
      imageUrls: ["/houses/toreador.jpg", "/houses/toreador-2.jpg"],
    } as never);

    await setup(client, "/cidade/clas");

    expect(await screen.findByAltText("Imagem 1 de Clã Gangrel — Os Senhores do Céu")).toBeInTheDocument();
    expect(screen.getByAltText("Imagem 2 de Clã Gangrel — Os Senhores do Céu")).toBeInTheDocument();
  });

  it("renders markdown body formatting instead of raw markdown text", async () => {
    const client = new MockApiClient();
    const { adminToken } = await client.adminLogin("admin-test");
    await client.adminCreateWikiEntry(adminToken, {
      section: "clas",
      title: "Clã Brujah",
      body: `> **Lema:** As estrelas lembram.

### Cultura

A Casa protege **rotas antigas**.

- Caminhos sob o deserto
- Guardiãs da estrela`,
      order: 0,
      imageUrls: ["/houses/brujah.jpg"],
    });

    await setup(client, "/cidade/clas");

    expect(await screen.findByAltText("Imagem de Clã Brujah")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cultura", level: 4 })).toBeInTheDocument();
    expect(screen.getByText("rotas antigas").tagName.toLowerCase()).toBe("strong");
    // Escopado ao artigo: a sidebar de seções também é feita de listitem, e
    // uma consulta global passaria a misturar navegação com conteúdo.
    const article = screen.getByRole("article");
    expect(within(article).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Caminhos sob o deserto",
      "Guardiãs da estrela",
    ]);
    expect(screen.queryByText(/\*\*rotas antigas\*\*/)).not.toBeInTheDocument();
  });

  describe("as ligações do verbete", () => {
    async function comVerbete(title: string, body: string) {
      const client = new MockApiClient();
      const { adminToken } = await client.adminLogin("admin-test");
      await client.adminCreateWikiEntry(adminToken, { section: "clas", title, body, order: 0 });
      return client;
    }

    it("liga para a Casa citada no texto", async () => {
      const client = await comVerbete("A fronteira", "A Clã Toreador fechou as estradas.");

      await setup(client, "/cidade/clas");

      const link = await screen.findByRole("link", { name: "Clã Toreador" });
      expect(link).toHaveAttribute("href", "/cla/cla-toreador");
    });

    it("liga para o personagem citado no texto, no rodapé e na própria frase", async () => {
      const client = await comVerbete("O porto", "Rala chegou ao porto ao amanhecer.");

      await setup(client, "/cidade/clas");

      // Duas portas para a mesma ficha, e é de propósito: a do rodapé é índice
      // de quem aparece no verbete, a da frase atende quem travou na leitura
      // sem saber de quem o texto está falando.
      const links = await screen.findAllByRole("link", { name: /Rala/ });
      expect(links.length).toBe(2);
      for (const link of links) expect(link).toHaveAttribute("href", "/personagens/rala");
    });

    it("não mostra o painel quando o verbete não cita ninguém", async () => {
      const client = await comVerbete("O clima", "A neve caiu por três dias seguidos.");

      await setup(client, "/cidade/clas");

      await screen.findByText(/A neve caiu/);
      expect(screen.queryByText(/Neste verbete/i)).not.toBeInTheDocument();
    });

    it("acima do teto, resume o excesso em vez de virar um tapete de etiquetas", async () => {
      // Um verbete pode citar a corte inteira. Sem teto o painel deixa de ser
      // navegação e vira um tapete de etiquetas.
      const nomes = fullCodex().slice(0, 40).map((n) => n.name).join(", ");
      const client = await comVerbete("O conclave", `Compareceram: ${nomes}.`);

      await setup(client, "/cidade/clas");

      const painel = (await screen.findByText("Neste verbete")).closest("div")!;
      const resumos = within(painel).getAllByText(/e mais \d+/);
      expect(resumos.length).toBeGreaterThan(0);
    });
  });
  describe("a narração da seção", () => {
    async function comVerbeteEm(section: string) {
      const client = new MockApiClient();
      const { adminToken } = await client.adminLogin("admin-test");
      await client.adminCreateWikiEntry(adminToken, {
        section,
        title: "Um verbete",
        body: "A neve caiu por três dias seguidos.",
        order: 0,
      });
      return client;
    }

    // A ligação existia só no sentido Histórias -> crônica: quem estava lendo o
    // verbete nunca ficava sabendo que havia narração. A lista real nasce
    // vazia, então quem prova a ligação é uma narração inventada aqui.
    it("oferece o áudio quando a seção é narrada", async () => {
      HISTORIAS.push({
        id: "a-primeira-noite",
        title: "A Primeira Noite",
        description: "",
        audioUrl: "https://exemplo.invalido/a.mp3",
        voice: "Fenrir",
        section: "visao-geral",
        duration: "8 min",
      });
      try {
        await setup(await comVerbeteEm("visao-geral"), "/cidade/visao-geral");
        const link = await screen.findByRole("link", { name: /Ouvir a narração/i });
        expect(link).toHaveAttribute("href", "/historias#a-primeira-noite");
      } finally {
        HISTORIAS.length = 0;
      }
    });

    it("não oferece áudio quando a seção não tem narração", async () => {
      await setup(await comVerbeteEm("dinheiro"), "/cidade/dinheiro");

      await screen.findByText(/A neve caiu/);
      expect(screen.queryByRole("link", { name: /Ouvir a narração/i })).not.toBeInTheDocument();
    });
  });
});
