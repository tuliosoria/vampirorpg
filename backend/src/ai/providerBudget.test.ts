import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createAiBudget } from "./budget";
import { makeChatFn } from "./openai";
import { makeImageFn, makeImageEditFn } from "./images";

const calls = vi.hoisted(() => ({ chat: vi.fn(), generate: vi.fn(), edit: vi.fn() }));
vi.mock("openai", () => ({ default: class {
  chat = { completions: { create: calls.chat } };
  images = { generate: calls.generate, edit: calls.edit };
}, toFile: async (bytes: Buffer) => bytes }));
const opts = { model: "image", size: "1024x1024", quality: "low" };
function setup() {
  const send = vi.fn().mockResolvedValue({});
  const budget = createAiBudget({ doc: { send } as unknown as DynamoDBDocumentClient, tableName: "table", scope: "scope", monthlyMicros: 100,
    policy: { chat: { chat: { reserveMicros: 10, maxInputBytes: 100, maxOutputTokens: 20 } },
      images: [{ ...opts, reserveMicros: 20, maxPromptBytes: 100, maxReferences: 2, maxReferenceBytes: 1000 }] } });
  return { send, budget };
}
beforeEach(() => {
  vi.clearAllMocks();
  calls.chat.mockResolvedValue({ choices: [{ message: { content: "ok" } }] });
  calls.generate.mockResolvedValue({ data: [{ b64_json: "aGk=" }] });
  calls.edit.mockResolvedValue({ data: [{ b64_json: "aGk=" }] });
});
describe("provider budget boundary", () => {
  it("awaits persistent reservation and passes the approved output limit to chat", async () => {
    const { send, budget } = setup();
    calls.chat.mockImplementationOnce(async (request) => {
      expect(send).toHaveBeenCalledTimes(1); expect(request.max_tokens).toBe(20);
      return { choices: [{ message: { content: "ok" } }] };
    });
    expect(await makeChatFn("key", "chat", budget)("s", "u", false)).toBe("ok");
  });
  it.each(["chat", "generate", "edit"])("never calls %s when ledger fails", async kind => {
    const { send, budget } = setup(); send.mockRejectedValueOnce(new Error("unavailable"));
    const request = kind === "chat" ? makeChatFn("key", "chat", budget)("s", "u", false)
      : kind === "generate" ? makeImageFn("key", 100, opts, budget)("prompt")
      : makeImageEditFn("key", 100, opts, budget)("prompt", [Buffer.from("ref")]);
    await expect(request).rejects.toMatchObject({ code: "AI_BUDGET_UNAVAILABLE" });
    expect(calls.chat).not.toHaveBeenCalled(); expect(calls.generate).not.toHaveBeenCalled(); expect(calls.edit).not.toHaveBeenCalled();
  });
  it.each(["generate", "edit"] as const)("reserves before %s without refunding a provider timeout", async kind => {
    const { send, budget } = setup();
    calls[kind].mockImplementationOnce(async () => { expect(send).toHaveBeenCalledTimes(1); throw new Error("timeout"); });
    const request = kind === "generate" ? makeImageFn("key", 100, opts, budget)("prompt")
      : makeImageEditFn("key", 100, opts, budget)("prompt", [Buffer.from("ref")]);
    await expect(request).rejects.toMatchObject({ code: "AI_ERROR" });
    expect(send).toHaveBeenCalledTimes(1);
  });
});
