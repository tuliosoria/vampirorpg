import { describe, it, expect } from "vitest";
import { submissionSk } from "./keys";

describe("submissionSk", () => {
  it("formats TURN#nnn#SUB#houseId", () => {
    expect(submissionSk(1, "gangrel-a1b2")).toBe("TURN#001#SUB#gangrel-a1b2");
  });
});
