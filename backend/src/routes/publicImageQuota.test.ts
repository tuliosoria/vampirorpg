import { describe, it, expect, vi, afterEach } from "vitest";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { generateHouseImage, type Deps } from "./publicRoutes";
import { hashCode } from "../auth/codes";
import type { Config, HandlerRequest } from "../types/domain";

const config = {
  tableName: "security-test", campaignId: "test-campaign",
  adminCodeHash: hashCode("correct-admin-code"), tokenSigningSecret: "test-signing-secret",
  tokenTtlSeconds: 3600,
} as Config;

function fixture() {
  const counters = new Map<string, number>();
  const image = vi.fn(async () => Buffer.from("test-image"));
  const doc = {
    async send(command: { input: { Key?: { PK?: string; SK?: string } } }) {
      const key = command.input.Key;
      if (key?.PK?.startsWith("RATELIMIT#")) {
        const id = key.PK + "|" + key.SK;
        const count = (counters.get(id) ?? 0) + 1;
        counters.set(id, count);
        return { Attributes: { count } };
      }
      return {};
    },
  } as unknown as DynamoDBDocumentClient;
  return { deps: { doc, config, image } as Deps, image, counters };
}

function request(body: unknown, sourceIp = "192.0.2.1"): HandlerRequest {
  return { method: "POST", path: "/", headers: {}, body, pathParams: {}, sourceIp };
}

afterEach(() => vi.restoreAllMocks());

describe("security boundaries for paid public images", () => {
  it("keeps the public signup image quota global when IPs rotate", async () => {
    const { deps, image } = fixture();
    const body = { name: "Casa Norte", description: "Castelo no norte.", emblem: { icon: "lobo", color1: "#333333", color2: "#112244" } };
    for (let i = 0; i < 5; i++) expect((await generateHouseImage(deps, request(body, "192.0.2." + i))).status).toBe(200);
    await expect(generateHouseImage(deps, request(body, "198.51.100.1"))).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
    expect(image).toHaveBeenCalledTimes(5);
  });

  it("never calls the paid image provider when the limiter store fails", async () => {
    const { deps, image } = fixture();
    deps.doc = { send: async () => { throw new Error("database unavailable"); } } as unknown as DynamoDBDocumentClient;
    await expect(generateHouseImage(deps, request({ name: "Casa Norte", description: "Norte.", emblem: { icon: "lobo", color1: "#333333", color2: "#112244" } }))).rejects.toThrow();
    expect(image).not.toHaveBeenCalled();
  });
});

