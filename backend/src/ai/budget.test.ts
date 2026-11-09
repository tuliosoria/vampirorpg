import { describe, expect, it, vi } from "vitest";
import type { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createAiBudget, budgetFromEnvironment, type BudgetPolicy } from "./budget";

const policy: BudgetPolicy = {
  chat: { "reviewed-model": { reserveMicros: 30, maxInputBytes: 100, maxOutputTokens: 20 } },
  images: [{ model: "reviewed-image", size: "1024x1024", quality: "low", inputFidelity: "high",
    reserveMicros: 40, maxPromptBytes: 100, maxReferenceBytes: 1000, maxReferences: 2 }],
};
const imageOpts = { model: "reviewed-image", size: "1024x1024", quality: "low", inputFidelity: "high" };

// Only the external DynamoDB boundary is replaced. Its conditional update is
// evaluated atomically so independent clients compete for the same allowance.
function ledger() {
  const items = new Map<string, number>();
  const send = vi.fn(async (command: UpdateCommand) => {
    const i = command.input;
    expect(i.ConditionExpression).toBe("attribute_not_exists(#reserved) OR #reserved <= :remaining");
    expect(i.UpdateExpression).toBe("ADD #reserved :amount");
    expect(i.ExpressionAttributeNames).toEqual({ "#reserved": "reservedMicros" });
    const k = JSON.stringify(i.Key);
    const old = items.get(k) ?? 0;
    const v = i.ExpressionAttributeValues!;
    if (old > v[":remaining"]) throw Object.assign(new Error("full"), { name: "ConditionalCheckFailedException" });
    items.set(k, old + v[":amount"]);
    return {};
  });
  return { items, send, doc: { send } as unknown as DynamoDBDocumentClient };
}
function guard(db = ledger(), now = () => new Date("2026-11-09T12:00:00Z")) {
  return { db, budget: createAiBudget({ doc: db.doc, tableName: "table", scope: "shared", monthlyMicros: 100, policy, now }) };
}

describe("optional global AI reservation", () => {
  it("is disabled without an explicit enabled flag and never defaults a monetary cap", () => {
    expect(budgetFromEnvironment({})).toBeUndefined();
    expect(budgetFromEnvironment({ AI_BUDGET_ENABLED: "false", AI_BUDGET_MONTHLY_MICROS: "25" })).toBeUndefined();
  });
  it.each(["", "0", "-1", "1.5", "NaN", "9007199254740992"])("rejects enabled invalid cap %s", cap => {
    expect(() => budgetFromEnvironment({ AI_BUDGET_ENABLED: "true", AI_BUDGET_MONTHLY_MICROS: cap })).toThrow();
  });
  it("does not silently disable a misspelled activation flag", () => {
    expect(() => budgetFromEnvironment({ AI_BUDGET_ENABLED: "tru" })).toThrow();
  });
  it("rejects absent policy and storage when activation is requested", () => {
    expect(() => budgetFromEnvironment({ AI_BUDGET_ENABLED: "true", AI_BUDGET_MONTHLY_MICROS: "100" })).toThrow();
  });
  it("reserves across independent instances before allowing concurrent work", async () => {
    const db = ledger(); const a = guard(db).budget; const b = guard(db).budget;
    const outcomes = await Promise.allSettled(Array.from({ length: 10 }, (_, n) => (n % 2 ? a : b).beforeChat("reviewed-model", "sys", "user", 10)));
    expect(outcomes.filter(x => x.status === "fulfilled")).toHaveLength(3);
    expect([...db.items.values()]).toEqual([90]);
    expect(outcomes.filter(x => x.status === "rejected").every(x => x.reason.code === "AI_BUDGET_EXCEEDED")).toBe(true);
  });
  it("bounds previously unlimited output only when explicitly enabled", async () => {
    const { budget } = guard();
    expect(await budget.beforeChat("reviewed-model", "", "", undefined)).toBe(20);
    expect(await budget.beforeChat("reviewed-model", "", "", 12)).toBe(12);
    await expect(budget.beforeChat("reviewed-model", "", "", 21)).rejects.toMatchObject({ code: "AI_BUDGET_POLICY" });
  });
  it("rejects unknown models and oversized input before reserving", async () => {
    const { budget, db } = guard();
    await expect(budget.beforeChat("unpriced", "", "", 1)).rejects.toMatchObject({ code: "AI_BUDGET_POLICY" });
    await expect(budget.beforeChat("reviewed-model", "a".repeat(51), "b".repeat(50), 1)).rejects.toMatchObject({ code: "AI_BUDGET_POLICY" });
    expect(db.send).not.toHaveBeenCalled();
  });
  it("fails closed when the ledger is unavailable without leaking internal errors", async () => {
    const db = ledger(); db.send.mockRejectedValueOnce(new Error("internal sensitive diagnostic"));
    await expect(guard(db).budget.beforeChat("reviewed-model", "", "", 1)).rejects.toMatchObject({ code: "AI_BUDGET_UNAVAILABLE" });
  });
  it("places all image generation and edits in the same monthly reservation", async () => {
    const { budget, db } = guard();
    await budget.beforeImage(imageOpts, "prompt", []);
    await budget.beforeImage(imageOpts, "prompt", [Buffer.alloc(100)]);
    await expect(budget.beforeChat("reviewed-model", "", "", 1)).rejects.toMatchObject({ code: "AI_BUDGET_EXCEEDED" });
    expect([...db.items.values()]).toEqual([80]);
  });
  it("rejects unreviewed image parameters, prompt or reference sizes", async () => {
    const { budget, db } = guard();
    await expect(budget.beforeImage({ ...imageOpts, quality: "high" }, "", [])).rejects.toMatchObject({ code: "AI_BUDGET_POLICY" });
    await expect(budget.beforeImage(imageOpts, "x".repeat(101), [])).rejects.toMatchObject({ code: "AI_BUDGET_POLICY" });
    await expect(budget.beforeImage(imageOpts, "", [Buffer.alloc(1001)])).rejects.toMatchObject({ code: "AI_BUDGET_POLICY" });
    await expect(budget.beforeImage(imageOpts, "", Array(3).fill(Buffer.alloc(1)))).rejects.toMatchObject({ code: "AI_BUDGET_POLICY" });
    expect(db.send).not.toHaveBeenCalled();
  });
  it("uses UTC calendar months without relying on TTL deletion", async () => {
    let now = new Date("2026-11-30T23:59:59Z"); const { budget, db } = guard(ledger(), () => now);
    await budget.beforeImage(imageOpts, "", []);
    now = new Date("2026-12-01T00:00:00Z"); await budget.beforeImage(imageOpts, "", []);
    expect([...db.items.values()]).toEqual([40, 40]);
    expect(db.send.mock.calls[0][0].input.Key?.SK).toBe("MONTH#2026-11");
    expect(db.send.mock.calls[1][0].input.Key?.SK).toBe("MONTH#2026-12");
  });
  it("rejects malformed policy amounts rather than allowing a free request", () => {
    expect(() => createAiBudget({ doc: ledger().doc, tableName: "table", scope: "scope", monthlyMicros: 100,
      policy: { ...policy, chat: { "bad": { reserveMicros: 0, maxInputBytes: 1, maxOutputTokens: 1 } } } })).toThrow();
  });
});
