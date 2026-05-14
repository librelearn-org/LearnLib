import LearnLib from '../index';
import { testlijst } from "./data"
import { it, expect } from "bun:test";

// TODO: deze heeft een random kans om te falen, plz fix ik in de toekomst.
it("should reshuffle an array", () => {
    const learnLib = new LearnLib(testlijst);

    const originalOrder = learnLib.getState().wachtrij
    learnLib.reshuffle();
    const newOrder = learnLib.getState().wachtrij

    expect(Object.keys(originalOrder)).toHaveLength(Object.keys(newOrder).length);
    expect(Object.keys(originalOrder)).toEqual(expect.arrayContaining(Object.keys(newOrder)));

    expect(originalOrder).not.toEqual(newOrder);
})