import { defaultLearnConfig, type LearnConfig, type Lijst, type LijstItem } from "./types";
import { shuffle } from "./helpers"

export interface LearnLibState {
  lijst: Record<string, LijstItem>;
  wachtrij: string[];
  config: LearnConfig;
}

export default class learnLib {
  private lijst: Record<string, LijstItem> = {};
  private wachtrij: string[] = [];
  private config: LearnConfig = {};
  private subscriber: ((state: LearnLibState) => void) | null = null;


  constructor(lijst: Lijst, config?: LearnConfig) {
    lijst.forEach((value: LijstItem) => {
      if (!value.id) {
        value.id = crypto.randomUUID();
      };
      this.lijst[value.id] = value;
      this.wachtrij.push(value.id);
    });
    if (!config) {
      config = defaultLearnConfig;
    }
    this.config = config;
    shuffle(this.wachtrij);
  };


  // herstel de lijst en wachtrij naar de start
  public reshuffle() {
    console.log("reshuffling...");
    // we resten de wachtrij
    this.wachtrij = [];
    // we bouwen een nieuwe lijst randomly geshuffled
    const items = Object.values(this.lijst);
    shuffle(items);
    items.forEach((item) => {
      this.wachtrij.push(item.id!);
      // we resetten ook de round count en antwoord geschiedenis van elk item
      item.roundCount = 0;
      item.listSessionItemAnswerHistories = [];
    });
    this.notifyStateChange();
  };

  // voor als je een antwoord moet checken zonder dat dit invloed heeft op de wachtrij of antwoord geschiedenis. bijvoorbeeld voor het checken van het antwoord voor de periode dat de gebruiker een goed antwoord kan forceren.
  public checkAnswer(correctAnswerOG: string, userAnswerOG: string): boolean {
    // TODO: typo detectie? misschien niet hier maar ergens anders. coms zouden moeilijk zn
    let correctAnswer = correctAnswerOG.toLowerCase().trim();
    let answer = userAnswerOG.toLowerCase().trim();
    console.log("checking answer", { goedAntwoord: correctAnswer, antwoord: answer });
    let isCorrect: boolean = false;
    if (this.config.fuckFransen) {
      // dit is wrm antwoord schrijfbaar is 
      correctAnswer = correctAnswer
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      answer = answer
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }
    if (answer === correctAnswer) {
      return true;
    }
    if (this.config.staAlternatieveAntwoordenToe && correctAnswer.includes(" / ")) {
      // gebruik recursie.
      const mogelijkeAntwoorden = correctAnswer.split(" / ");
      console.log("checking alternative answers", mogelijkeAntwoorden);
      for (let mogelijkAntwoord of mogelijkeAntwoorden) {
        if (this.checkAnswer(mogelijkAntwoord, answer)) {
          isCorrect = true;
          console.log("checking alternative answers, is correct?", isCorrect);
          break;
        }
      }
    }
    // als we er hier nog niet uit zijn, dan checken we of het aan () ligt
    if (this.config.optioneleAntwoordDelen && correctAnswer.includes("(")) {
      // regex D:
      const antwoordZonderOptioneel = correctAnswer.replace(/\([^)]*\)/g, "").trim();
      const antwoordMetOptioneel = correctAnswer.replace(/\(([^)]*)\)/g, "$1").trim();
      if (answer === antwoordZonderOptioneel || answer === antwoordMetOptioneel) {
        isCorrect = true;
      }
      console.log("checking optional parts, is correct?", isCorrect);
    }
    if (!isCorrect && this.config.enkelWoordAlternatieveAntwoorden) {
      // eerst splitten naar woorden
      console.log("checking single word alternatives...");
      const antwoordWoorden = correctAnswer.split(" ");
      console.log("antwoord woorden", antwoordWoorden);
      // nu gaan we elk woord checken voor een `/`
      antwoordWoorden.forEach((woord, index) => {
        if (woord.includes("/")) {
          const mogelijkeWoorden = woord.split("/");
          mogelijkeWoorden.forEach((mogelijkWoord) => {
            // nu zijn we in alle opties van dit specifieke woord, we checken of een van deze opties in het goed antwoord zit
            let mogelijkAntwoord = [...antwoordWoorden];
            mogelijkAntwoord[index] = mogelijkWoord;
            const mogelijkAntwoordStr = mogelijkAntwoord.join(" ");
            this.checkAnswer(mogelijkAntwoordStr, answer) && (isCorrect = true);
            console.log("checking single word alternatives, is correct?", isCorrect);
          });
        }
      });
    }
    console.log("antwoord is", isCorrect ? "goed" : "fout");
    return isCorrect;
  }

  // voor als je zeker bent van dat je dit wil schrijven naar de antwoord geschiedenis en de wachtrij wil updaten. bijvoorbeeld voor een "submit answer" knop
  public answer(antwoord: string, forceCorrect?: boolean) {
    const currentItemId = this.wachtrij[0];
    const currentItem = this.lijst[currentItemId];
    if (!currentItem) {
      throw new Error("Er is geen current item in de antwoord functie. knap!");
    }
    let isCorrect = forceCorrect || false;
    if (!forceCorrect) {
      isCorrect = this.checkAnswer(currentItem.antwoord.toLowerCase().trim(), antwoord);
    }
    if (currentItem.listSessionItemAnswerHistories === undefined) {
      currentItem.listSessionItemAnswerHistories = [];
    }
    currentItem.listSessionItemAnswerHistories.push({
      antwoord,
      goed: isCorrect,
      round: currentItem.roundCount || 0,
    });
    // we verwijderen het item uit de wachtrij
    this.wachtrij.shift();
    // als het fout was, dan pushen we het item terug in de wachtrij
    if (!isCorrect) {
      this.wachtrij.push(currentItemId);
    }
    currentItem.roundCount = (currentItem.roundCount || 0) + 1;
    this.notifyStateChange();
  };

  public setSubscriber(updater: (state: LearnLibState) => void) {
    this.subscriber = updater;
    this.notifyStateChange();
  };

  // Internal method to notify state changes
  // fuck dit het is nu public voor makkelijker testen
  public notifyStateChange() {
    if (this.subscriber) {
      console.log("notifying state change...");
      console.log("state:", {
        lijst: this.lijst,
        wachtrij: this.wachtrij,
        config: this.config,
      });
      this.subscriber({
        lijst: this.lijst,
        wachtrij: this.wachtrij,
        config: this.config,
      });
    }
  };

  // Get current state
  public getState(): LearnLibState {
    return {
      lijst: this.lijst,
      wachtrij: this.wachtrij,
      config: this.config,
    };
  };
};
