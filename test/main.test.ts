import { describe, it, expect } from "bun:test";
import { checkAnswer } from "../checker/base";

describe("checkAnswer", () => {
  it("returns true for exact match (case-insensitive, trimmed)", () => {
    expect(checkAnswer("Hello", "hello")).toBe(true);
    expect(checkAnswer(" Hello ", "hello")).toBe(true);
  });

  it("handles diacritics when stripAccents is true", () => {
    expect(checkAnswer("éclair", "eclair", { stripAccents: true })).toBe(true);
    expect(checkAnswer("à la carte", "a la carte", { stripAccents: true })).toBe(true);
  });

  it("accepts alternative answers with alternativeAnswers", () => {
    expect(checkAnswer("a / b", "b", { alternativeAnswers: { allow: true, mode: "both" } })).toBe(true);
    expect(checkAnswer("a / b", "a", { alternativeAnswers: { allow: true, mode: "both" } })).toBe(true);
  });

  it("matches optional parts when allowOptionalAnswerParts is true", () => {
    expect(checkAnswer("voetbal (spel)", "voetbal", { allowOptionalAnswerParts: true })).toBe(true);
    expect(checkAnswer("voetbal (spel)", "voetbal spel", { allowOptionalAnswerParts: true })).toBe(true);
  });

  it("handles single-word alternative answers", () => {
    expect(checkAnswer("kleur rood/blauw", "kleur rood", { alternativeAnswers: { allow: true, mode: "onlySingleWord" } })).toBe(true);
    expect(checkAnswer("kleur rood/blauw", "kleur blauw", { alternativeAnswers: { allow: true, mode: "onlySingleWord" } })).toBe(true);
  });

  it("returns false for wrong answer", () => {
    expect(checkAnswer("ja", "nee")).toBe(false);
  });
});
