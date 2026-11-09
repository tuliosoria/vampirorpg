import { describe, it, expect, vi, afterEach } from "vitest";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { adminLogin } from "./adminRoutes";
import { login, type Deps } from "./publicRoutes";
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

describe("security boundaries for public requests", () => {
  it("throttles repeated invalid admin logins before another credential check", async () => {
    const { deps } = fixture();
    for (let i = 0; i < 5; i++) {
      await expect(adminLogin(deps, request({ adminCode: "incorrect-code" }))).rejects.toMatchObject({ status: 401 });
    }
    await expect(adminLogin(deps, request({ adminCode: "correct-admin-code" }))).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
  });

  it("throttles repeated player logins even when each guessed code differs", async () => {
    const { deps } = fixture();
    for (let i = 0; i < 10; i++) {
      await expect(login(deps, request({ playerCode: "house-" + i }))).rejects.toMatchObject({ status: 401 });
    }
    await expect(login(deps, request({ playerCode: "house-next" }))).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
  });

  it("limits admin login attempts across rotating IP addresses", async () => {
    const { deps } = fixture();
    for (let i = 0; i < 60; i++) {
      await expect(adminLogin(deps, request({ adminCode: "incorrect-code" }, "192.0.2." + i))).rejects.toMatchObject({ status: 401 });
    }
    await expect(adminLogin(deps, request({ adminCode: "correct-admin-code" }, "198.51.100.1"))).rejects.toMatchObject({ status: 429 });
  });

  it("allows another login window instead of permanently locking the user out", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
    const { deps } = fixture();
    for (let i = 0; i < 5; i++) await adminLogin(deps, request({ adminCode: "incorrect-code" })).catch(() => undefined);
    await expect(adminLogin(deps, request({ adminCode: "correct-admin-code" }))).rejects.toMatchObject({ status: 429 });
    now.mockReturnValue(1_800_000_061_000);
    expect((await adminLogin(deps, request({ adminCode: "correct-admin-code" }))).status).toBe(200);
  });

});
