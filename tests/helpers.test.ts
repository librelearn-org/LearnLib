import { shuffle } from "../helpers";
import { describe, it, expect } from "bun:test";

// TODO: deze kan random falen.
it("should shuffle an array", () => {
    const array = [1, 2, 3, 4, 5];
    shuffle(array);
    expect(array).toHaveLength(5);
    expect(array).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]));
    // we kunnen niet testen of het echt geshuffled is omdat het random is, maar we kunnen wel testen dat het niet in dezelfde volgorde is als het origineel
    expect(array).not.toEqual([1, 2, 3, 4, 5]);
});