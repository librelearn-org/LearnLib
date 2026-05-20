import LearnLib from '../index';
import { testlijst } from "./data"
import { it, expect, mock } from "bun:test";

it("we kunnen subscriben en callen", () => {
    const learnLib = new LearnLib(testlijst);
    const callback = mock((state) => {
        expect(state).toHaveProperty("lijst");
        expect(state).toHaveProperty("wachtrij");
        expect(state).toHaveProperty("config");
        expect(state).toHaveProperty("currentItem");
        expect(state).toHaveProperty("last");

    });

    learnLib.setSubscriber(callback);

    learnLib.notifyStateChange()

    expect(callback).toHaveBeenCalledTimes(2);
})

it("we horen over een reshuffle", () => {
    const learnLib = new LearnLib(testlijst);
    const callback = mock((state) => {
        expect(state).toHaveProperty("lijst");
        expect(state).toHaveProperty("wachtrij");
        expect(state).toHaveProperty("config");
        expect(state).toHaveProperty("currentItem");
        expect(state).toHaveProperty("last");
    });

    learnLib.setSubscriber(callback);
    learnLib.reshuffle();


    expect(callback).toHaveBeenCalledTimes(2);
})