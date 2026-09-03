import { describe, it, expect } from "vitest";
import { generatePlayerCode, hashCode } from "./codes";

describe("codes", () => {
  it("generates a code prefixed by the house id with >=4 random chars", () => {
    const code = generatePlayerCode("gangrel");
    expect(code).toMatch(/^gangrel-[A-Z0-9]{4}$/);
  });

  it("generates different codes across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generatePlayerCode("gangrel")));
    expect(codes.size).toBeGreaterThan(1);
  });

  it("hashes deterministically to 64 hex chars", () => {
    const h1 = hashCode("gangrel-4K7P");
    const h2 = hashCode("gangrel-4K7P");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different codes", () => {
    expect(hashCode("gangrel-4K7P")).not.toBe(hashCode("gangrel-4K7Q"));
  });
});
