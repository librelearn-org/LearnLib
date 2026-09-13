import { describe, it, expect } from "bun:test";
import { Grade, Phase } from "../types";

describe("Enums", () => {
  it("has correct values for Grade enum", () => {
    expect(Grade.Incorrect).toBe(0);
    expect(Grade.Hard).toBe(1);
    expect(Grade.Good).toBe(2);
    expect(Grade.Easy).toBe(3);
  });

  it("has correct values for Phase enum", () => {
    expect(Phase.Learning).toBe(0);
    expect(Phase.Review).toBe(1);
  });
});
