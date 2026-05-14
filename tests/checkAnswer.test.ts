import LearnLib from '../index';
import { testlijst } from "./data"
import { it, expect, describe } from "bun:test";

it("should check basic answers correctly", () => {
    const learnLib = new LearnLib(testlijst);

    expect(learnLib.checkAnswer("test", "test")).toBe(true);
    expect(learnLib.checkAnswer("test", "auefhuiawh")).toBe(false);
})

describe("alternatives", () => {
    it("should check alternative answers correctly when staAlternatieveAntwoordenToe is true", () => {
        const learnLib = new LearnLib(testlijst, { staAlternatieveAntwoordenToe: true });

        expect(learnLib.checkAnswer("test / test2", "test")).toBe(true);
        expect(learnLib.checkAnswer("test / test2", "test2")).toBe(true);
        expect(learnLib.checkAnswer("test / test2", "test3")).toBe(false);
    })

    it("should check single word alternatives correctly when enkelWoordAlternatieveAntwoorden is true", () => {
        const learnLib = new LearnLib(testlijst, { enkelWoordAlternatieveAntwoorden: true });

        expect(learnLib.checkAnswer("test1/test2 test3", "test1 test3")).toBe(true);
        expect(learnLib.checkAnswer("test1/test2 test3", "test2 test3")).toBe(true);
        expect(learnLib.checkAnswer("test1/test2 test3", "test3 test1")).toBe(false);
    })
})


it("should check optional parts of answers correctly when optioneleAntwoordDelen is true", () => {
    const learnLib = new LearnLib(testlijst, { optioneleAntwoordDelen: true });

    expect(learnLib.checkAnswer("test (optioneel)", "test")).toBe(true);
    expect(learnLib.checkAnswer("t(es)t", "test")).toBe(true);
    expect(learnLib.checkAnswer("t(es)t", "tt")).toBe(true);
    expect(learnLib.checkAnswer("t(es)t", "tqt")).toBe(false);
    expect(learnLib.checkAnswer("test (optioneel)", "test (optioneel)")).toBe(true);
    expect(learnLib.checkAnswer("test (optioneel)", "test optioneel")).toBe(true);
    expect(learnLib.checkAnswer("test (optioneel)", "test optione")).toBe(false);
})

it("should check answers with accents correctly when fuckFransen is true", () => {
    const learnLib = new LearnLib(testlijst, { fuckFransen: true });

    expect(learnLib.checkAnswer("café", "cafe")).toBe(true);
    expect(learnLib.checkAnswer("café", "café")).toBe(true);
    expect(learnLib.checkAnswer("café", "cafè")).toBe(true);
})
