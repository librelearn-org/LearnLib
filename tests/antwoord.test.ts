import LearnLib from '../index';
import { testlijst } from "./data"
import { it, expect, mock, describe } from "bun:test";

describe("antwoord function", () => {

    it("antwoord function should check answer and update state correctly", () => {
        const learnLib = new LearnLib([
            {
                vraag: "vraag1",
                antwoord: "antwoord1"
            },
            {
                vraag: "vraag2",
                antwoord: "antwoord2"
            }
        ]);
        learnLib.notifyStateChange(); // trigger state change to initialize currentItem
        const initialState = learnLib.getState();
        const mocksubscriber = mock((state) => {
            expect(state).toHaveProperty("lijst");
            expect(state).toHaveProperty("wachtrij");
            expect(state).toHaveProperty("config");
            expect(state).toHaveProperty("currentItem");
            expect(state).toHaveProperty("last");
        });
        learnLib.setSubscriber(mocksubscriber);
        // Check correct answer
        if (initialState.currentItem!.vraag == "vraag1") {
            learnLib.answer("antwoord1");
        } else {
            learnLib.answer("antwoord2");
        }

        const stateAfterCorrectAnswer = learnLib.getState();
        expect(stateAfterCorrectAnswer.currentItem).toBeDefined();
        console.log(stateAfterCorrectAnswer.wachtrij);
        expect(stateAfterCorrectAnswer.wachtrij.length).toBe(1); // one item should be removed from the queue
        expect(mocksubscriber).toHaveBeenCalledTimes(2);

    })


    it("antwoord function should check answer and update state correctly", () => {
        const learnLib = new LearnLib([
            {
                vraag: "vraag1",
                antwoord: "antwoord1"
            },
            {
                vraag: "vraag2",
                antwoord: "antwoord2"
            }
        ]);
        const initialState = learnLib.getState();
        const mocksubscriber = mock((state) => {
            expect(state).toHaveProperty("lijst");
            expect(state).toHaveProperty("wachtrij");
            expect(state).toHaveProperty("config");
            expect(state).toHaveProperty("currentItem");
            expect(state).toHaveProperty("last");
        });
        learnLib.setSubscriber(mocksubscriber);
        // Check correct answer

        learnLib.answer("fout antwoord");

        const stateAfterCorrectAnswer = learnLib.getState();
        console.log(stateAfterCorrectAnswer);
        expect(stateAfterCorrectAnswer.currentItem).toBeDefined();
        expect(stateAfterCorrectAnswer.currentItem!.vraag).not.toBe(initialState.currentItem!.vraag); // the same item should be added back to the queue, so we should see a different item now
        expect(stateAfterCorrectAnswer.wachtrij.length).toBe(2);
        expect(mocksubscriber).toHaveBeenCalledTimes(2);
    })
})