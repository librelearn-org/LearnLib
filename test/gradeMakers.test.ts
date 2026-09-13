import { describe, it, expect } from "bun:test";
import { VerySimpleGradeMaker, verySimple } from "../gradeMakers/verySimple";
import { Grade } from "../types";

describe("VerySimpleGradeMaker", () => {
  const gm = new VerySimpleGradeMaker();

  it("has metadata properties set with translations", () => {
    expect(gm.name).toEqual({
      EN: "Very Simple Grader",
      NL: "Zeer Eenvoudige Beoordelaar",
    });
    expect(gm.id).toBe("basic");
    expect(typeof gm.description).toBe("object");
  });

  it("returns Grade.Good when answer is correct", () => {
    const start = new Date();
    const now = new Date();
    expect(gm.grade(true, start, now)).toBe(Grade.Good);
  });

  it("returns Grade.Incorrect when answer is incorrect", () => {
    const start = new Date();
    const now = new Date();
    expect(gm.grade(false, start, now)).toBe(Grade.Incorrect);
  });

  it("respects grade overwrite when provided", () => {
    const start = new Date();
    const now = new Date();
    expect(gm.grade(false, start, now, Grade.Easy)).toBe(Grade.Easy);
    expect(gm.grade(true, start, now, Grade.Hard)).toBe(Grade.Hard);
  });
});
