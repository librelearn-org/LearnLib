import { describe, it, expect } from "bun:test";
import { checkAnswer } from "../checker/base";
import { CheckConfig } from "../checker/shared";
import { WordChecker, wordChecker } from "../checker/compiled";

describe("checkAnswer", () => {
  describe("Default behavior (exact match)", () => {
    it("matches exact string ignoring case and surrounding whitespace", () => {
      expect(checkAnswer("Parijs", "parijs")).toBe(true);
      expect(checkAnswer("  Parijs  ", "parijs")).toBe(true);
      expect(checkAnswer("Parijs", "  PARIJS  ")).toBe(true);
    });

    it("returns false for incorrect answer", () => {
      expect(checkAnswer("Parijs", "Londen")).toBe(false);
      expect(checkAnswer("Parijs", "Parijs!")).toBe(false);
    });
  });

  describe("stripAccents option (diacritics removal)", () => {
    it("strips accents when stripAccents is true", () => {
      expect(checkAnswer("électricités", "electricites", { stripAccents: true })).toBe(true);
      expect(checkAnswer("déjà vu", "deja vu", { stripAccents: true })).toBe(true);
      expect(checkAnswer("garçon", "garcon", { stripAccents: true })).toBe(true);
    });

    it("fails without stripAccents option if accents mismatch", () => {
      expect(checkAnswer("électricités", "electricites")).toBe(false);
    });
  });

  describe("alternativeAnswers option (sentence level)", () => {
    it("matches any slash-separated option", () => {
      const config: CheckConfig = {
        alternativeAnswers: {
          allow: true,
          mode: "both",
        },
      };
      expect(checkAnswer("hond / kat / konijn", "hond", config)).toBe(true);
      expect(checkAnswer("hond / kat / konijn", "kat", config)).toBe(true);
      expect(checkAnswer("hond / kat / konijn", "konijn", config)).toBe(true);
      expect(checkAnswer("hond / kat / konijn", "cavia", config)).toBe(false);
    });
  });

  describe("allowOptionalAnswerParts option", () => {
    it("matches answer with or without optional parts in parentheses", () => {
      const config: CheckConfig = { allowOptionalAnswerParts: true };
      expect(checkAnswer("voetbal (spel)", "voetbal", config)).toBe(true);
      expect(checkAnswer("voetbal (spel)", "voetbal spel", config)).toBe(true);
      expect(checkAnswer("voetbal (spel)", "tennis", config)).toBe(false);
    });
  });

  describe("alternativeAnswers option (single word level)", () => {
    it("matches single-word slash alternatives in sentences", () => {
      const config: CheckConfig = {
        alternativeAnswers: {
          allow: true,
          mode: "onlySingleWord",
        },
      };
      expect(checkAnswer("hij/zij loopt", "hij loopt", config)).toBe(true);
      expect(checkAnswer("hij/zij loopt", "zij loopt", config)).toBe(true);
      expect(checkAnswer("hij/zij loopt", "het loopt", config)).toBe(false);
    });

    it("matches single-word slash alternatives without spaces in default both mode", () => {
      expect(checkAnswer("a/b", "a")).toBe(true);
      expect(checkAnswer("a/b", "b")).toBe(true);
      expect(checkAnswer("hond/kat", "hond")).toBe(true);
      expect(checkAnswer("hond/kat", "kat")).toBe(true);
      expect(checkAnswer("hond/kat", "vis")).toBe(false);
    });
  });

  describe("allowOptionalAnswerParts option", () => {
    it("matches answer with or without optional parts in parentheses", () => {
      const config: CheckConfig = { allowOptionalAnswerParts: true };
      expect(checkAnswer("voetbal (spel)", "voetbal", config)).toBe(true);
      expect(checkAnswer("voetbal (spel)", "voetbal spel", config)).toBe(true);
      expect(checkAnswer("voetbal (spel)", "tennis", config)).toBe(false);
    });

    it("handles multiple optional parts in a sentence", () => {
      const config: CheckConfig = { allowOptionalAnswerParts: true };
      expect(checkAnswer("(the) big (red) dog", "big dog", config)).toBe(true);
      expect(checkAnswer("(the) big (red) dog", "the big dog", config)).toBe(true);
      expect(checkAnswer("(the) big (red) dog", "big red dog", config)).toBe(true);
      expect(checkAnswer("(the) big (red) dog", "the big red dog", config)).toBe(true);
      expect(checkAnswer("(the) big (red) dog", "the small dog", config)).toBe(false);
    });
  });

  describe("greekLetters option (Greek transliteration)", () => {
    it("transliterates Greek letters to Latin alphabet", () => {
      expect(checkAnswer("λ", "l")).toBe(true);
      expect(checkAnswer("αθήνα", "athena")).toBe(true);
    });
  });

  describe("Combined options", () => {
    it("handles diacritics and alternatives combined", () => {
      const config: CheckConfig = {
        stripAccents: true,
        allowOptionalAnswerParts: true,
        alternativeAnswers: {
          allow: true,
          mode: "both",
        },
      };
      expect(checkAnswer("électricités / (le) café", "electricites", config)).toBe(true);
      expect(checkAnswer("électricités / (le) café", "le cafe", config)).toBe(true);
      expect(checkAnswer("électricités / (le) café", "cafe", config)).toBe(true);
    });
  });
});

describe("WordChecker (compiled async check)", () => {
  it("compiles in background and validates answers", async () => {
    const checker = new WordChecker("voetbal (spel)", { allowOptionalAnswerParts: true });
    checker.compile();

    expect(await checker.check("voetbal")).toBe(true);
    expect(await checker.check("voetbal spel")).toBe(true);
    expect(await checker.check("tennis")).toBe(false);
  });

  it("matches exact base word without modules", async () => {
    const checker = new WordChecker("Parijs");
    checker.compile();

    expect(await checker.check("parijs")).toBe(true);
    expect(await checker.check("  Parijs  ")).toBe(true);
    expect(await checker.check("Londen")).toBe(false);
  });
});
