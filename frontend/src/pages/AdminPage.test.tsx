import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiProvider } from "../api/ApiProvider";
import { AdminPage } from "./AdminPage";
import type { ApiClient } from "../api/client";
import { ApiError, type AdminDashboard } from "../types/api";
import { clearAdminToken } from "../auth/adminSession";

const draftDashboard: AdminDashboard = {
  pendencias: { projetos: 0, canonico: 0, espioes: 0, rascunho: 0, porto: 0, resolucao: 0 },
  turnId: 2,
  turnStatus: "DRAFT",
  publicEvent: "",
  privateInfo: { "house-1": "Sussurros sob a neve." },
  result: null,
  houses: [
    {
      houseId: "house-1",
      name: "Casa Nevasca",
      motto: "Sob a neve, resistimos.",
      emblem: { icon: "lobo", color1: "#7f1d1d", color2: "#1e3a5f" },
      leaderName: "Dama Elira",
      heirName: "Tomas",
      castleName: "Castelo Nevasca",
      townsText: "Aldeias sob pinheiros negros.",
      historyText: "Uma linhagem marcada pelo inverno.",
      specialty: "Patrulhas na neve",
      weakness: "Celeiros vazios",
      attributes: { riqueza: 2, recursos: 3, soldados: 2, controle: 3 },
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  submissions: [],
};

const lockedDashboard: AdminDashboard = {
  ...draftDashboard,
  turnStatus: "LOCKED",
  publicEvent: "A neve fecha os portões.",
  result: null,
  submissions: [
    {
      houseId: "house-1",
      orderText: "Enviamos batedores para a Ponte de Harrow.",
      submittedAt: "2026-01-03T00:00:00.000Z",
    },
  ],
};

function makeClient(dashboard: AdminDashboard = draftDashboard): ApiClient {
  return {
    getCampaign: vi.fn(),
    listCla: vi.fn().mockResolvedValue([]),
    getEstudioPublico: vi.fn(),
    getEstudio: vi.fn().mockResolvedValue({
      cidade: { nome: "", descricao: "", segredos: "", atualizadoEm: "" },
      bairros: [], personagens: [], locais: [], tramas: [], contos: [], clas: [],
    }),
    saveEstudioItem: vi.fn(),
    deleteEstudioItem: vi.fn(),
    saveCidade: vi.fn(),
    adminSaveCla: vi.fn(),
    adminDeleteCla: vi.fn(),
    getHouseExample: vi.fn(),
    createAccountAndHouse: vi.fn(),
    generateHouseImage: vi.fn().mockResolvedValue({ image: "data:image/png;base64,ZZ" }),
    login: vi.fn(),
    getGame: vi.fn(),
    submitOrder: vi.fn(),
    adminLogin: vi.fn().mockResolvedValue({ adminToken: "admin-token" }),
    getAdminDashboard: vi.fn().mockResolvedValue(dashboard),
    adminComposeTurn: vi.fn().mockResolvedValue(undefined),
    adminGetTurnDraft: vi.fn().mockResolvedValue({ draft: null }),
    adminDiscardTurnDraft: vi.fn().mockResolvedValue(undefined),
    adminPublishTurnDraft: vi.fn().mockResolvedValue({ turnId: 1, opened: true }),
    adminSetTurnImageUrl: vi.fn().mockResolvedValue({ imageUrl: "" }),
    adminOpenTurn: vi.fn().mockResolvedValue(undefined),
    adminLockTurn: vi.fn(),
    adminUnlockTurn: vi.fn(),
    adminDraftPrivateInfo: vi.fn().mockResolvedValue({ "house-1": "Informação privada da IA." }),
    adminDraftPublicEvent: vi.fn().mockResolvedValue("Evento público gerado pela IA."),
    adminDraftResolution: vi.fn().mockResolvedValue({
      publicResult: "Resultado público da IA.",
      houseResults: { "house-1": "Resultado privado da IA." },
      attributeDeltas: { "house-1": { controle: 1 } },
      discoveries: ["Um sino enterrado guia os mortos."],
    }),
    adminApplyResolution: vi.fn(),
    adminGenerateTurnImage: vi.fn().mockResolvedValue({ imageUrl: "https://img/e.png" }),
    adminUploadTurnImage: vi.fn().mockResolvedValue({ imageUrl: "https://img/uploaded.png" }),
    adminDeleteTurnImage: vi.fn().mockResolvedValue(undefined),
    getGallery: vi.fn().mockResolvedValue([]),
    getVisualGallery: vi.fn().mockResolvedValue([]),
    listVisualEntities: vi.fn().mockResolvedValue([]),
    getVisualEntity: vi.fn(),
    getVisualEntityAssets: vi.fn().mockResolvedValue([]),
    createVisualEntity: vi.fn(),
    escribaPreview: vi.fn(),
    escribaPublicar: vi.fn(),
    updateVisualEntity: vi.fn(),
    getVisualCoverage: vi.fn().mockResolvedValue({ totalEntries: 0, coveredEntries: 0, sections: [], unlinkedEntities: [] }),
    previewVisualContext: vi.fn().mockResolvedValue({ operation: "GENERATE", referenceCount: 1, warnings: [] }),
    createVisualGeneration: vi.fn().mockResolvedValue({ generationId: "g1", status: "PENDING" }),
    getVisualGeneration: vi.fn(),
    adminCreateHouse: vi.fn().mockResolvedValue({ houseId: "house-new", playerCode: "NEVASCA-AB12" }),
    adminUpdateHouse: vi.fn().mockResolvedValue(undefined),
    adminDeleteHouse: vi.fn().mockResolvedValue({ deleted: 1 }),
    adminResetCampaign: vi.fn().mockResolvedValue({ deleted: 0 }),
    adminAiStatus: vi.fn().mockResolvedValue({ configured: true, status: "OK", model: "gpt-4o-mini" }),
    adminGetWorldBible: vi.fn().mockResolvedValue({ lore: "", visualDirectives: "", updatedAt: "" }),
    adminPutWorldBible: vi.fn().mockResolvedValue(undefined),
    adminListNpcDynamics: vi.fn().mockResolvedValue([]),
    adminPutNpcDynamic: vi.fn().mockResolvedValue({ affiliation: "", id: "", mood: "", location: "", objective: "", concerns: "", loyalty: "", relations: {}, memory: [], updatedAt: "" }),
    getChronicle: async () => "",
    getWiki: vi.fn().mockResolvedValue([]),
    adminListWiki: vi.fn().mockResolvedValue([]),
    adminCreateWikiEntry: vi.fn().mockResolvedValue({ entryId: "w1", section: "clas", title: "Casa", body: "", order: 0, updatedAt: "t" }),
    adminUpdateWikiEntry: vi.fn().mockResolvedValue({ entryId: "w1", section: "clas", title: "Casa", body: "", order: 0, updatedAt: "t" }),
    adminDeleteWikiEntry: vi.fn().mockResolvedValue(undefined),
    adminSeedWiki: vi.fn().mockResolvedValue({ seeded: 0 }),
    adminListGm: vi.fn().mockResolvedValue([]),
    adminCreateGmEntry: vi.fn().mockResolvedValue({ entryId: "g1", section: "a-verdade", title: "V", body: "", order: 0, updatedAt: "t" }),
    adminUpdateGmEntry: vi.fn().mockResolvedValue({ entryId: "g1", section: "a-verdade", title: "V", body: "", order: 0, updatedAt: "t" }),
    adminDeleteGmEntry: vi.fn().mockResolvedValue(undefined),
    adminSeedGm: vi.fn().mockResolvedValue({ seeded: 0 }),
    getProjects: vi.fn().mockResolvedValue({ templates: [], recommended: [], projects: [], favors: [], slotLimit: 1, stability: 3 }),
    startProjectFromTemplate: vi.fn(),
    enhanceCustomProject: vi.fn(),
    startCustomProject: vi.fn(),
    acceptProject: vi.fn(),
    requestProjectRevision: vi.fn(),
    submitProjectToGm: vi.fn(),
    cancelProject: vi.fn(),
    setEnergia: async () => ({ porProjeto: {} }),
    respondToFavor: vi.fn(),
    adminListProjects: vi.fn().mockResolvedValue([]),
    adminApproveProject: vi.fn(),
    adminRejectProject: vi.fn(),
    adminPauseProject: vi.fn(),
    adminResumeProject: vi.fn(),
    getVisualAsset: async () => ({}) as any,
    enhanceVisualPrompt: async () => ({ compiledPrompt: "", enhancedBrief: "", canonSources: [], entityName: null, warnings: [] }),
    getCorrespondence: async () => ({ turnNumber: 0, open: false, entries: [] }),
    adminGetCorrespondence: async () => ({ turnNumber: 0, threads: [], facts: [] }),
    getCorrespondenceThread: async () => [],
    sendCorrespondence: async () => ({}) as any,
    getVisualStyleBible: async () => ({}) as any,
    updateVisualStyleBible: async () => ({}) as any,
    canonizeAsset: async () => ({ id: "x", canonicalLevel: "CANONICAL" }) as any,
    playerCanonPreview: async () => ({ proposal: {} as any, review: null }),
    playerCanonUploadImage: async () => ({ imageUrl: "", imageKey: "" }),
    playerCanonSubmit: async () => ({}) as any,
    playerCanonList: async () => [],
    adminCanonList: async () => [],
    adminCanonApprove: async () => ({}) as any,
    adminCanonReject: async () => ({}) as any,
    adminGetRelations: async () => ({ seats: [], relations: [] }),
    adminPutRelation: async () => ({}) as any,
    countIncomingLetters: async () => ({ cartas: 0, turnNumber: 0 }),
    adminSendWorldLetters: async () => ({ enviadas: 0 }),
    adminWithdrawLetter: async () => ({ id: "x" }),
    respondToPact: async () => ({ aceito: true }),
    listPacts: async () => ({ firmados: [], abertos: [], historico: [], favores: [], ativos: [] }),
    listSpyOps: async () => ({ tiers: [], operations: [] }),
    startSpyOp: async () => ({}) as any,
    adminListSpyOps: async () => ({ tiers: [], operations: [] }),
    adminResolveSpyOp: async () => ({}) as any,
    playerCanonAdvice: async () => ({}) as any,
    listWorldFacts: async () => [],
    revokeWorldFact: async () => {},
  } as ApiClient;
}

describe("AdminPage", () => {
  // Precisa zerar os dois armazenamentos: o login do GM passou a viver em
  // localStorage para sobreviver ao fechamento da aba, e limpar só a sessão
  // deixaria um teste logado vazar para o seguinte.
  beforeEach(() => clearAdminToken());

  /** A navegação é a coluna da esquerda: um clique, de qualquer lugar. */
  function lateral() {
    return within(screen.getByRole("navigation", { name: "Seções do painel" }));
  }

  async function irPara(name: RegExp) {
    await userEvent.click(lateral().getByRole("button", { name }));
  }

  it("logs in and shows draft compose controls", async () => {
    const client = makeClient();
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await userEvent.type(screen.getByLabelText(/código de admin/i), "admin-secret");
    await userEvent.click(within(screen.getByRole("main")).getByRole("button", { name: /entrar/i }));

    await waitFor(() => expect(client.getAdminDashboard).toHaveBeenCalledWith("admin-token"));
    expect(screen.getByRole("heading", { name: /painel do turno 2/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/evento público/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/informação privada para Casa Nevasca/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /abrir turno/i })).toBeInTheDocument();
  });

  it("keeps drafted private info visible after the AI action returns", async () => {
    const client = makeClient();
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await userEvent.type(screen.getByLabelText(/código de admin/i), "admin-secret");
    await userEvent.click(within(screen.getByRole("main")).getByRole("button", { name: /entrar/i }));
    await screen.findByLabelText(/informação privada para Casa Nevasca/i);
    await userEvent.click(screen.getByRole("button", { name: /rascunhar informações/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/informação privada para Casa Nevasca/i)).toHaveValue("Informação privada da IA."),
    );
  });

  it("fills the public event field after drafting it with AI", async () => {
    const client = makeClient();
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await userEvent.type(screen.getByLabelText(/código de admin/i), "admin-secret");
    await userEvent.click(within(screen.getByRole("main")).getByRole("button", { name: /entrar/i }));
    await screen.findByLabelText(/evento público/i);
    await userEvent.click(screen.getByRole("button", { name: /rascunhar evento/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/evento público/i)).toHaveValue("Evento público gerado pela IA."),
    );
    expect(client.adminDraftPublicEvent).toHaveBeenCalled();
  });

  // Login, digitação, upload e espera da prévia num teste só. Passa sempre
  // isolado; os 5s padrão é que não sobrevivem à suíte inteira em paralelo.
  it("preserves typed draft event text and updates preview after uploading an event image", async () => {
    const client = makeClient();
    vi.mocked(client.getAdminDashboard)
      .mockResolvedValueOnce(draftDashboard)
      .mockResolvedValue({ ...draftDashboard, publicEvent: "Evento salvo no servidor.", eventImageUrl: "https://img/uploaded.png" });
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await userEvent.type(screen.getByLabelText(/código de admin/i), "admin-secret");
    await userEvent.click(within(screen.getByRole("main")).getByRole("button", { name: /entrar/i }));
    const publicEventInput = await screen.findByLabelText(/evento público/i);
    await userEvent.clear(publicEventInput);
    await userEvent.type(publicEventInput, "Evento público ainda não salvo.", { delay: null });

    const file = new File(["png"], "evento.png", { type: "image/png" });
    await userEvent.upload(screen.getByLabelText(/enviar imagem para imagem do evento/i), file);

    await waitFor(() => expect(client.adminUploadTurnImage).toHaveBeenCalledWith("admin-token", "event", file));
    expect(screen.getByLabelText(/evento público/i)).toHaveValue("Evento público ainda não salvo.");
    expect(screen.getByAltText("Imagem do evento")).toHaveAttribute("src", expect.stringContaining("https://img/uploaded.png"));
  }, 20000);

  // Login, digitação, upload e espera da prévia num teste só. Passa sempre
  // isolado; os 5s padrão é que não sobrevivem à suíte inteira em paralelo.
  it("preserves typed public result and updates preview after uploading a result image", async () => {
    const lockedWithResult = {
      ...lockedDashboard,
      result: { publicResult: "Fim.", houseResults: {}, attributeDeltas: {}, discoveries: [] },
    };
    const client = makeClient(lockedWithResult);
    vi.mocked(client.getAdminDashboard)
      .mockResolvedValueOnce(lockedWithResult)
      .mockResolvedValue({
        ...lockedWithResult,
        result: { publicResult: "Resultado salvo no servidor.", houseResults: {}, attributeDeltas: {}, discoveries: [] },
        resultImageUrl: "https://img/uploaded.png",
      });
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await userEvent.type(screen.getByLabelText(/código de admin/i), "admin-secret");
    await userEvent.click(within(screen.getByRole("main")).getByRole("button", { name: /entrar/i }));
    const publicResultInput = await screen.findByLabelText(/resultado público/i);
    await userEvent.clear(publicResultInput);
    await userEvent.type(publicResultInput, "Resultado público ainda não salvo.", { delay: null });

    const file = new File(["webp"], "resultado.webp", { type: "image/webp" });
    await userEvent.upload(screen.getByLabelText(/enviar imagem para imagem do resultado/i), file);

    await waitFor(() => expect(client.adminUploadTurnImage).toHaveBeenCalledWith("admin-token", "result", file));
    expect(screen.getByLabelText(/resultado público/i)).toHaveValue("Resultado público ainda não salvo.");
    expect(screen.getByAltText("Imagem do resultado")).toHaveAttribute("src", expect.stringContaining("https://img/uploaded.png"));
  }, 20000);

  it("shows a manual-entry notice when public event drafting leaks private context", async () => {
    const client = makeClient();
    vi.mocked(client.adminDraftPublicEvent).mockRejectedValue(
      new ApiError("AI_LEAKED_PRIVATE_CONTEXT", "O evento expõe contexto privado."),
    );
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await userEvent.type(screen.getByLabelText(/código de admin/i), "admin-secret");
    await userEvent.click(within(screen.getByRole("main")).getByRole("button", { name: /entrar/i }));
    await screen.findByLabelText(/evento público/i);
    await userEvent.click(screen.getByRole("button", { name: /rascunhar evento/i }));

    expect(await screen.findByText("O evento expõe contexto privado. Você pode escrever manualmente.")).toBeInTheDocument();
    expect(screen.getByLabelText(/evento público/i)).toHaveValue("");
  });

  it("keeps drafted resolution visible after the AI action returns", async () => {
    const client = makeClient(lockedDashboard);
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /rodar turno/i });
    await userEvent.click(screen.getByRole("button", { name: /rascunhar resolução/i }));

    await waitFor(() => expect(screen.getByLabelText("Resultado público")).toHaveValue("Resultado público da IA."));
    expect(screen.getByLabelText(/resultado privado para Casa Nevasca/i)).toHaveValue("Resultado privado da IA.");
    expect(screen.getByLabelText("Descobertas")).toHaveValue("Um sino enterrado guia os mortos.");
  });

  it("shows each house's submitted order while resolving a locked turn", async () => {
    const client = makeClient(lockedDashboard);
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /rodar turno/i });
    expect(screen.getByRole("heading", { name: /Ordem de Casa Nevasca/i })).toBeInTheDocument();
    expect(screen.getByText("Enviamos batedores para a Ponte de Harrow.")).toBeInTheDocument();
  });

  it("resets the campaign after confirming in the dialog", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    await irPara(/^campanha$/i);
    await userEvent.click(screen.getByRole("button", { name: /reiniciar campanha/i }));

    const confirm = await screen.findByRole("button", { name: /sim, apagar tudo/i });
    await userEvent.click(confirm);

    await waitFor(() => expect(client.adminResetCampaign).toHaveBeenCalledWith("admin-token"));
  });

  it("creates a house and shows the generated access code", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    await irPara(/^fichas$/i);
    await screen.findByRole("heading", { name: /gerenciar personagens/i });
    await userEvent.click(screen.getByRole("button", { name: /adicionar personagem/i }));

    await userEvent.type(screen.getByLabelText(/nome de exibição do jogador/i), "Novo Jogador");
    await userEvent.type(screen.getByLabelText(/nome do personagem/i), "Casa Corvo");
    await userEvent.click(screen.getByRole("button", { name: /^criar casa$/i }));

    await waitFor(() =>
      expect(client.adminCreateHouse).toHaveBeenCalledWith(
        "admin-token",
        expect.objectContaining({ displayName: "Novo Jogador", name: "Casa Corvo" }),
      ),
    );
    expect(await screen.findByText("NEVASCA-AB12")).toBeInTheDocument();
  });

  it("updates a house after editing", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    await irPara(/^fichas$/i);
    await screen.findByRole("heading", { name: /gerenciar personagens/i });
    await userEvent.click(screen.getByRole("button", { name: /^editar$/i }));
    await userEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() =>
      expect(client.adminUpdateHouse).toHaveBeenCalledWith(
        "admin-token",
        expect.objectContaining({ houseId: "house-1", name: "Casa Nevasca" }),
      ),
    );
  });

  it("deletes a house after confirming in the dialog", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    await irPara(/^fichas$/i);
    await screen.findByRole("heading", { name: /gerenciar personagens/i });
    await userEvent.click(screen.getByRole("button", { name: /^deletar$/i }));

    const confirm = await screen.findByRole("button", { name: /sim, deletar/i });
    await userEvent.click(confirm);

    await waitFor(() => expect(client.adminDeleteHouse).toHaveBeenCalledWith("admin-token", "house-1"));
  });

  it("troca de seção e esconde as outras", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    expect(screen.getByRole("heading", { name: /compor turno/i })).toBeInTheDocument();

    // Duas fileiras, e só duas: o grupo diz onde estou, a seção diz qual
    // ferramenta. O Mundo abre na Cidade, que é onde uma crônica vazia começa.
    await irPara(/^cidade$/i);
    expect(screen.queryByRole("heading", { name: /compor turno/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/nome da cidade/i)).toBeInTheDocument();

    await irPara(/^estilo$/i);
    expect(screen.getByRole("heading", { name: /estilo das imagens/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/nome da cidade/i)).not.toBeInTheDocument();

    await irPara(/^bíblia$/i);
    expect(screen.getByRole("heading", { name: /bíblia do mundo/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /estilo das imagens/i })).not.toBeInTheDocument();
  });

  it("não carrega mais as seções mortas de Galeria e Senhas", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    expect(screen.queryByRole("button", { name: /em breve/i })).not.toBeInTheDocument();

    /**
     * A regra que esta mudança existe para criar: nenhuma aba no painel.
     * Eram duas fileiras, uma dentro da outra, e dezesseis dos vinte destinos
     * ficavam escondidos atrás do clique no grupo certo.
     */
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryAllByRole("tablist")).toHaveLength(0);

    // Os vinte, todos na coluna, todos alcançáveis de onde quer que se esteja.
    expect(lateral().getAllByRole("button")).toHaveLength(20);
  });

  /**
   * O defeito que o cabeçalho conserta: cinco seções traziam a própria
   * explicação no corpo e catorze não traziam nenhuma, então a segunda fileira
   * era uma lista de substantivos que só se entendia clicando em todos.
   */
  it("toda seção aberta diz o que se adiciona nela", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=turno"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    expect(screen.getByRole("heading", { name: /^resolver$/i })).toBeInTheDocument();
    expect(screen.getByText(/a noite em andamento/i)).toBeInTheDocument();

    // Uma seção que nunca teve explicação nenhuma no corpo.
    await irPara(/^acervo$/i);
    expect(screen.getByText(/tudo que já foi gerado/i)).toBeInTheDocument();
  });

  /**
   * A coluna substituiu duas fileiras de abas, uma dentro da outra. O que ela
   * precisa provar é o que as abas não davam: que todo destino está alcançável
   * de onde quer que se esteja, e que dá para saber em qual deles se está.
   */
  describe("a coluna da esquerda", () => {
    async function painelAberto(tab = "sistema&sec=escriba", dashboard = draftDashboard) {
      const client = makeClient(dashboard);
      sessionStorage.setItem("vampirorpg.admin", "admin-token");
      render(
        <ApiProvider client={client}>
          <MemoryRouter initialEntries={[`/admin?tab=${tab}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AdminPage />
          </MemoryRouter>
        </ApiProvider>,
      );
      await screen.findByRole("heading", { name: /painel do turno 2/i });
    }

    // Do canto mais escondido do painel até a primeira ficha do Mundo, num
    // clique. Com as abas eram dois, e o primeiro era adivinhar a família.
    it("leva de qualquer seção a qualquer outra num clique", async () => {
      await painelAberto();
      // Pela frase da seção, e não pelo título: "Escriba" nomeia tanto a seção
      // quanto a ferramenta dentro dela, e a frase é única por construção.
      expect(screen.getByText(/pergunta sobre o mundo/i)).toBeInTheDocument();

      await userEvent.click(lateral().getByRole("button", { name: /^contos$/i }));

      expect(screen.getByText(/o que a cidade conta sobre si/i)).toBeInTheDocument();
      expect(screen.queryByText(/pergunta sobre o mundo/i)).not.toBeInTheDocument();
    });

    it("marca a seção aberta, e só ela", async () => {
      await painelAberto("mundo&sec=tramas");
      const marcados = lateral()
        .getAllByRole("button")
        .filter((b) => b.getAttribute("aria-current") === "page");
      expect(marcados).toHaveLength(1);
      expect(marcados[0]).toHaveTextContent("Tramas");
    });

    // O badge de trabalho parado vivia na aba do grupo e sumia quando o grupo
    // não era o aberto. Na coluna ele fica à vista o tempo todo.
    it("mostra o trabalho parado mesmo estando em outro grupo", async () => {
      await painelAberto("mundo&sec=cidade", {
        ...draftDashboard,
        pendencias: { ...draftDashboard.pendencias, rascunho: 1, resolucao: 1 },
      });
      expect(lateral().getByRole("button", { name: /resolver/i })).toHaveTextContent("2");
    });

    it("no celular a coluna vira gaveta, e a gaveta navega", async () => {
      await painelAberto("mundo&sec=cidade");

      await userEvent.click(screen.getByRole("button", { name: /Mundo › Cidade/i }));
      const gaveta = within(await screen.findByRole("navigation", { name: /gaveta/i }));
      await userEvent.click(gaveta.getByRole("button", { name: /^locais$/i }));

      expect(screen.getByRole("heading", { name: /^locais$/i })).toBeInTheDocument();
      // Fecha ao navegar: numa tela estreita ela cobre o formulário para onde
      // a pessoa acabou de pedir para ir.
      await waitFor(() =>
        expect(screen.queryByRole("navigation", { name: /gaveta/i })).not.toBeInTheDocument(),
      );
    });
  });

  it("opens the tab from the ?tab= query param", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=casas"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    expect(await screen.findByRole("heading", { name: /gerenciar personagens/i })).toBeInTheDocument();
  });

  it("cai no Mundo para um tab desconhecido ou desativado", async () => {
    const client = makeClient();
    sessionStorage.setItem("vampirorpg.admin", "admin-token");
    render(
      <ApiProvider client={client}>
        <MemoryRouter initialEntries={["/admin?tab=galeria"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminPage />
        </MemoryRouter>
      </ApiProvider>,
    );

    await screen.findByRole("heading", { name: /painel do turno 2/i });
    expect(await screen.findByLabelText(/nome da cidade/i)).toBeInTheDocument();
  });
});
