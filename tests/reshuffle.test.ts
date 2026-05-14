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

it("should reset round count and answer history on reshuffle", () => {
    const learnLib = new LearnLib(testlijst);

    // we geven elk item een round count en antwoord geschiedenis
    Object.values(learnLib.getState().lijst).forEach((item) => {
        item.roundCount = 5;
        item.listSessionItemAnswerHistories = [
            {
                round: 0,
                goed: true,
                antwoord: "test"
            },
            {
                round: 2,
                goed: true,
                antwoord: "test"
            }
        ];
    });

    learnLib.reshuffle();

    // we checken of elk item een round count van 0 heeft en een lege antwoord geschiedenis
    Object.values(learnLib.getState().lijst).forEach((item) => {
        expect(item.roundCount).toBe(0);
        expect(item.listSessionItemAnswerHistories).toEqual([]);
    });
})