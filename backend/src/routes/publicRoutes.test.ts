import { describe, it, expect, beforeEach, vi } from "vitest";
import { EXEMPLO_DE_PERSONAGEM } from "@vampiro/content";
import { makeImageStoreFake } from "./testHelpers";
import { getCampaign, getHouseExample, createAccountAndHouse, login, getGallery, getChronicle, generateHouseImage } from "./publicRoutes";
import { verifyToken } from "../auth/tokens";
import { hashCode } from "../auth/codes";
import type { Config } from "../types/domain";
import * as housesDb from "../db/houses";
import * as playersDb from "../db/players";
import * as turnsDb from "../db/turns";
import * as rateLimitDb from "../db/rateLimit";

vi.mock("../db/houses", () => ({
  createAccountAndHouse: vi.fn(),
  setHouseImages: vi.fn(),
}));

vi.mock("../db/rateLimit", () => ({
  hitRateLimit: vi.fn(),
}));

vi.mock("../db/players", () => ({
  getPlayerByCodeHash: vi.fn(),
}));

vi.mock("../db/turns", () => ({
  listTurns: vi.fn(),
}));

const config: Config = {
  tableName: "vampirorpg-game",
  campaignId: "cidade-noturna",
  adminCodeHash: "x",
  tokenSigningSecret: "secret",
  allowedOrigin: "*",
  tokenTtlSeconds: 3600,
  openAiApiKey: "",
  openAiModel: "gpt-4o-mini",
  openAiDiplomacyModel: "gpt-4o-mini",
  openAiImageModel: "gpt-image-1",
  openAiImageSize: "1536x1024",
  openAiImageQuality: "medium",
  openAiImageInputFidelity: "high",
  openAiSyncImageModel: "gpt-image-1",
  openAiSyncImageSize: "1536x1024",
  openAiSyncImageQuality: "medium",
  imagesBucket: "",
  visualWorkerFunctionName: "",
  draftIngestToken: "",
};
const deps = { doc: { send: vi.fn() } as any, config };
const req = (over = {}) => ({ method: "GET", path: "/", headers: {}, body: undefined, pathParams: {}, ...over });

const createBody = {
  displayName: "Elira",
  name: "Clã Gángrel!",
  motto: "A noite lembra.",
  emblem: { icon: "lobo", color1: "#3f3f46", color2: "#1e3a5f" },
  leaderName: "Aldric",
  heirName: "Sera",
  castleName: "Parque do Norte",
  townsText: "Vilas do norte.",
  historyText: "Uma casa antiga.",
  specialty: "Defesa.",
  weakness: "Fome.",
  attributes: { riqueza: 1, recursos: 2, soldados: 5, controle: 2 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCampaign", () => {
  it("returns the narrative campaign summary without old content fields", async () => {
    const res = await getCampaign(deps, req());

    expect(res).toEqual({
      status: 200,
      body: {
        id: "cidade-noturna",
        title: "A Cidade",
        introduction: "Uma cidade que não sabe quem a governa depois que escurece. Cada jogador conduz um vampiro; o que ele escreve, em texto livre, vira a história da noite.",
      },
    });
  });
});

describe("getHouseExample", () => {
  it("returns the Gangrel example from shared content", async () => {
    const res = await getHouseExample(deps, req());

    expect(res).toEqual({ status: 200, body: EXEMPLO_DE_PERSONAGEM });
  });
});

describe("createAccountAndHouse", () => {
  it("creates a house with a provisional code hash and returns a player token", async () => {
    vi.mocked(housesDb.createAccountAndHouse).mockResolvedValue({ houseId: "cla-gangrel-abcd" });

    const res = await createAccountAndHouse(deps, req({ method: "POST", body: createBody }));

    expect(res.status).toBe(200);
    const body = res.body as any;
    expect(body.playerCode).toMatch(/^cla-gangrel-[A-Z0-9]{4}$/);
    expect(body.houseId).toBe("cla-gangrel-abcd");
    expect(body.displayName).toBe("Elira");
    expect(housesDb.createAccountAndHouse).toHaveBeenCalledWith(
      deps.doc,
      "vampirorpg-game",
      "cidade-noturna",
      expect.objectContaining({ ...createBody, codeHash: hashCode(body.playerCode) }),
    );
    const payload = verifyToken(body.playerToken, config.tokenSigningSecret) as any;
    expect(payload).toMatchObject({ type: "player", campaignId: "cidade-noturna", houseId: "cla-gangrel-abcd", displayName: "Elira" });
  });
});

describe("login", () => {
  it("returns a token for a valid code", async () => {
    const code = "cla-gangrel-4K7P";
    vi.mocked(playersDb.getPlayerByCodeHash).mockResolvedValue({ houseId: "cla-gangrel-abcd", displayName: "Elira", codeHash: hashCode(code) });

    const res = await login(deps, req({ method: "POST", body: { playerCode: code } }));

    expect(res.status).toBe(200);
    expect(playersDb.getPlayerByCodeHash).toHaveBeenCalledWith(deps.doc, "vampirorpg-game", hashCode(code));
    expect((res.body as any).houseId).toBe("cla-gangrel-abcd");
  });

  it("rejects an unknown code with INVALID_CODE", async () => {
    vi.mocked(playersDb.getPlayerByCodeHash).mockResolvedValue(null);

    await expect(login(deps, req({ method: "POST", body: { playerCode: "nope-0000" } }))).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CODE",
    });
  });
});

describe("getGallery", () => {
  const baseTurn = { privateInfo: {}, cards: [], createdAt: "2026-01-01T00:00:00.000Z" };
  it("returns only turns with at least one image, in ascending order", async () => {
    vi.mocked(turnsDb.listTurns).mockResolvedValue([
      { ...baseTurn, turnId: 1, status: "RESOLVED", publicEvent: "Evento 1", eventImageUrl: "u1", result: { publicResult: "Res 1", houseResults: {}, attributeDeltas: {}, discoveries: [] }, resultImageUrl: "r1" } as any,
      { ...baseTurn, turnId: 2, status: "OPEN", publicEvent: "Evento 2" } as any,
      { ...baseTurn, turnId: 3, status: "OPEN", publicEvent: "Evento 3", eventImageUrl: "u3" } as any,
    ]);
    const res = await getGallery(deps, req());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      entries: [
        { turnId: 1, publicEvent: "Evento 1", eventImageUrl: "u1", publicResult: "Res 1", resultImageUrl: "r1" },
        { turnId: 3, publicEvent: "Evento 3", eventImageUrl: "u3", publicResult: "", resultImageUrl: undefined },
      ],
    });
  });

  it("does not expose draft event images or locked result images", async () => {
    vi.mocked(turnsDb.listTurns).mockResolvedValue([
      { ...baseTurn, turnId: 1, status: "DRAFT", publicEvent: "Rascunho secreto", eventImageUrl: "draft-event" } as any,
      { ...baseTurn, turnId: 2, status: "LOCKED", publicEvent: "Evento aberto", eventImageUrl: "locked-event", resultImageUrl: "locked-result" } as any,
      { ...baseTurn, turnId: 3, status: "RESOLVED", publicEvent: "Evento resolvido", eventImageUrl: "resolved-event", result: { publicResult: "Resultado público", houseResults: {}, attributeDeltas: {}, discoveries: [] }, resultImageUrl: "resolved-result" } as any,
    ]);

    const res = await getGallery(deps, req());

    expect(res.body).toEqual({
      entries: [
        { turnId: 2, publicEvent: "Evento aberto", eventImageUrl: "locked-event", publicResult: "", resultImageUrl: undefined },
        { turnId: 3, publicEvent: "Evento resolvido", eventImageUrl: "resolved-event", publicResult: "Resultado público", resultImageUrl: "resolved-result" },
      ],
    });
  });
});

describe("createAccountAndHouse with images", () => {
  it("uploads each image and stores the urls", async () => {
    (housesDb.createAccountAndHouse as any).mockResolvedValue({ houseId: "casa-1" });
    const uploadHouseImage = vi.fn()
      .mockResolvedValueOnce("https://cdn/houses/casa-1/0.png")
      .mockResolvedValueOnce("https://cdn/houses/casa-1/1.png");
    const imageStore = makeImageStoreFake({ uploadHouseImage });
    const depsImg = { ...deps, imageStore, image: vi.fn() };
    const body = { ...createBody, images: ["data:image/png;base64,AAA", "data:image/png;base64,BBB"] };
    await createAccountAndHouse(depsImg as any, req({ method: "POST", path: "/api/create-account", body }) as any);
    expect(uploadHouseImage).toHaveBeenCalledTimes(2);
    expect(housesDb.setHouseImages).toHaveBeenCalledWith(
      expect.anything(), "vampirorpg-game", "cidade-noturna", "casa-1",
      ["https://cdn/houses/casa-1/0.png", "https://cdn/houses/casa-1/1.png"],
    );
  });

  it("skips images when imageStore is absent", async () => {
    (housesDb.createAccountAndHouse as any).mockResolvedValue({ houseId: "casa-2" });
    const body = { ...createBody, images: ["data:image/png;base64,AAA"] };
    await createAccountAndHouse(deps, req({ method: "POST", path: "/api/create-account", body }) as any);
    expect(housesDb.setHouseImages).not.toHaveBeenCalled();
  });
});

describe("generateHouseImage", () => {
  const genBody = { name: "Clã Gangrel", description: "Norte.", emblem: createBody.emblem };

  it("returns IMAGE_DISABLED when no image fn", async () => {
    await expect(generateHouseImage(deps, req({ method: "POST", body: genBody }) as any))
      .rejects.toMatchObject({ status: 503, code: "IMAGE_DISABLED" });
  });

  it("returns a data url on success", async () => {
    (rateLimitDb.hitRateLimit as any).mockResolvedValue(1);
    const image = vi.fn().mockResolvedValue(Buffer.from("img"));
    const d = { ...deps, image };
    const res = await generateHouseImage(d as any, req({ method: "POST", body: genBody, sourceIp: "1.2.3.4" }) as any);
    expect(res.status).toBe(200);
    expect((res.body as any).image).toMatch(/^data:image\/png;base64,/);
  });

  it("returns RATE_LIMITED after the limit", async () => {
    (rateLimitDb.hitRateLimit as any).mockResolvedValue(6);
    const d = { ...deps, image: vi.fn() };
    await expect(generateHouseImage(d as any, req({ method: "POST", body: genBody, sourceIp: "1.2.3.4" }) as any))
      .rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
  });
});

describe("getChronicle", () => {
  const baseTurn = { privateInfo: {}, cards: [], createdAt: "2026-01-01T00:00:00.000Z" };

  it("junta os turnos resolvidos em texto corrido", async () => {
    vi.mocked(turnsDb.listTurns).mockResolvedValue([
      { ...baseTurn, turnId: 1, status: "RESOLVED", publicEvent: "A Convocação",
        result: { publicResult: "As Casas responderam.", houseResults: {}, attributeDeltas: {}, discoveries: [] } } as any,
    ]);

    const res = await getChronicle(deps, req());

    expect(res.status).toBe(200);
    expect((res.body as any).chronicle).toContain("A Convocação");
    expect((res.body as any).chronicle).toContain("As Casas responderam.");
  });

  /**
   * A crônica alimenta uma página pública. Um vazamento aqui entrega ao jogador
   * o que o GM escreveu só para si.
   */
  it("nunca expõe informação privada do turno", async () => {
    vi.mocked(turnsDb.listTurns).mockResolvedValue([
      { ...baseTurn, turnId: 1, status: "RESOLVED", publicEvent: "A Convocação",
        privateInfo: { "cla-gangrel": "O traidor é o irmão dela." },
        result: { publicResult: "As Casas responderam.", houseResults: { "cla-gangrel": "Gangrel hesitou." }, attributeDeltas: {}, discoveries: [] } } as any,
    ]);

    const res = await getChronicle(deps, req());
    const chronicle = (res.body as any).chronicle as string;

    expect(chronicle).not.toContain("traidor");
    expect(chronicle).not.toContain("Gangrel hesitou");
  });
});
