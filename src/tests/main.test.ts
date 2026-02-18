import { expect, test, describe } from "bun:test";
import { learingTools } from "..";
import { testlijst } from "./data";
import { LijstItem } from "../types";
import assert from "node:assert";
describe("Basic usage", () => {
  test("reshuffel", () => {
    const lijst = new learingTools(testlijst, {})
    const lijstPreshuffel = { ...lijst.lijst };
    lijst.reshuffle()
    expect(lijst.lijst).not.toBe(lijstPreshuffel);
  });
  test("Custom ID voor lijstItem", () => {
    const lijst = new learingTools(testlijst, {});
    let customIddata: LijstItem | undefined
    testlijst.forEach((value)=>{
      if(value.id == 'customId'){
        customIddata = value;
      }
    })
    expect(customIddata, 'de test id item niet gevonden. is de data.ts veranderd?').not.toBeUndefined()
    assert(customIddata, 'al gevaalt maar fuck ts')
    expect(lijst.lijst['customId']).toBe(customIddata)
  })
});
