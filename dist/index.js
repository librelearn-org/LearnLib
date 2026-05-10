// types.ts
var defaultLearnConfig = {
  staAlternatieveAntwoordenToe: true,
  multikeuzeWisselAlternatieveAntwoordenAf: true,
  gebruikAlternatieveVragenAfwisselendWanneerBeschikbaar: true,
  fuckFransen: false,
  optioneleAntwoordDelen: true,
  enkelWoordAlternatieveAntwoorden: true
};

// helpers.ts
function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex]
    ];
  }
}

// index.ts
class learnLib {
  lijst = {};
  wachtrij = [];
  config = {};
  subscriber = null;
  constructor(lijst, config) {
    lijst.forEach((value) => {
      if (!value.id) {
        value.id = crypto.randomUUID();
      }
      this.lijst[value.id] = value;
      this.wachtrij.push(value.id);
    });
    if (!config) {
      config = defaultLearnConfig;
    }
    this.config = config;
    shuffle(this.wachtrij);
  }
  reshuffle() {
    console.log("reshuffling...");
    this.wachtrij = [];
    const items = Object.values(this.lijst);
    shuffle(items);
    items.forEach((item) => {
      this.wachtrij.push(item.id);
      item.roundCount = 0;
      item.listSessionItemAnswerHistories = [];
    });
    this.notifyStateChange();
  }
  checkAnswer(correctAnswerOG, userAnswerOG) {
    let correctAnswer = correctAnswerOG.toLowerCase().trim();
    let answer = userAnswerOG.toLowerCase().trim();
    console.log("checking answer", { goedAntwoord: correctAnswer, antwoord: answer });
    let isCorrect = false;
    if (this.config.fuckFransen) {
      correctAnswer = correctAnswer.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      answer = answer.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    if (answer === correctAnswer) {
      return true;
    }
    if (this.config.staAlternatieveAntwoordenToe && correctAnswer.includes(" / ")) {
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
    if (this.config.optioneleAntwoordDelen && correctAnswer.includes("(")) {
      const antwoordZonderOptioneel = correctAnswer.replace(/\([^)]*\)/g, "").trim();
      const antwoordMetOptioneel = correctAnswer.replace(/[()]/g, "").trim();
      if (answer === antwoordZonderOptioneel || answer === antwoordMetOptioneel) {
        isCorrect = true;
      }
      console.log("checking optional parts, is correct?", isCorrect);
    }
    if (!isCorrect && this.config.enkelWoordAlternatieveAntwoorden) {
      console.log("checking single word alternatives...");
      const antwoordWoorden = correctAnswer.split(" ");
      console.log("antwoord woorden", antwoordWoorden);
      antwoordWoorden.forEach((woord, index) => {
        if (woord.includes("/")) {
          const mogelijkeWoorden = woord.split("/");
          mogelijkeWoorden.forEach((mogelijkWoord) => {
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
  answer(antwoord, forceCorrect) {
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
      round: currentItem.roundCount || 0
    });
    this.wachtrij.shift();
    if (!isCorrect) {
      this.wachtrij.push(currentItemId);
    }
    currentItem.roundCount = (currentItem.roundCount || 0) + 1;
    this.notifyStateChange();
  }
  setSubscriber(updater) {
    this.subscriber = updater;
    this.notifyStateChange();
  }
  notifyStateChange() {
    if (this.subscriber) {
      console.log("notifying state change...");
      console.log("state:", {
        lijst: this.lijst,
        wachtrij: this.wachtrij,
        config: this.config
      });
      this.subscriber({
        lijst: this.lijst,
        wachtrij: this.wachtrij,
        config: this.config
      });
    }
  }
  getState() {
    return {
      lijst: this.lijst,
      wachtrij: this.wachtrij,
      config: this.config
    };
  }
}
export {
  learnLib as default
};
