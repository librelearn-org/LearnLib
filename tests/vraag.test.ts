import LearnLib from '../index';
import { testlijst } from "./data"
import { it, expect, mock, describe } from "bun:test";



it("we should convert greek letters to latin if config is set", () => {
    const learnlib = new LearnLib([
        {
            vraag: "κατ",
            antwoord: "kat"
        }
    ]);
    learnlib.config.griekseLettersLatijnsKans = 100; // for testing, we want to convert all Greek letters to Latin
    learnlib.notifyStateChange(); // trigger state change to apply config

    const state = learnlib.getState();
    console.log(state)
    expect(state.currentItem?.vraag).toBe("kat");
})

it("possible alternative questions should be alternated when config is set", () => {
    const learnlib = new LearnLib([
        {
            vraag: "vraag1/vraag2/vraag3",
            antwoord: "antwoord"
        }
    ]);
    learnlib.config.gebruikAlternatieveVragenAfwisselendWanneerBeschikbaar = true;
    
    const seenVragen = new Set<string>();
    for (let i = 0; i < 100; i++) {
        learnlib.notifyStateChange(); // trigger state change to apply config
        const state = learnlib.getState();
        if (state.currentItem) {
            seenVragen.add(state.currentItem.vraag);
        }
    }
    expect(seenVragen.size).toBe(3); // we should have seen all three alternative questions
})