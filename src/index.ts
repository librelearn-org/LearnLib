import { assert } from "node:assert" 
import { LearnConfig, Lijst, LijstItem } from "./types";
import { shuffle } from "./helpers"

export class learingTools {
  // init dingen die we later nodig gaan hebben.
  readonly lijst: Record<string, LijstItem> = {};
  private wachtrij: string[] = [];
  readonly config: LearnConfig = {};

  constructor(lijst: Lijst, config: LearnConfig) {
    lijst.forEach((value: LijstItem) => {
      if (!value.id) {
        value.id = crypto.randomUUID();
      };
      this.lijst[value.id] = value;
      this.wachtrij.push(value.id);
    });
    this.config = config;
    shuffle(this.wachtrij);
  };

  // herstel de lijst en wachtrij naar de start
  public reshuffle() {
    // we resten de wachtrij
    this.wachtrij = [];
    // nu verwijderen we de goed/fout data en bouwen we een nieuwe wachtrij.
    for (let lijstItemIndex in Object.keys(this.lijst)) {
      let lijstItem = Object.values(this.lijst)[lijstItemIndex];
      lijstItem.goedFoutLijst = [];
      assert(lijstItem.id, 'Er is een object zonder een id in de reshuffel functie gekomen. knap!')
      this.wachtrij.push(lijstItem.id!)
    };
  };
};
