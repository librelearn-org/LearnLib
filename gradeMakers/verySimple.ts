import { Grade, GradeMaker } from "../types";

export class VerySimpleGradeMaker implements GradeMaker {
  type = "gradeMaker" as const;
  id = "basic";
  name = {
    EN: "Very Simple Grader",
    NL: "Zeer Eenvoudige Beoordelaar",
  };
  description = {
    EN: "Always Good or Incorrect. Not optimal for FSRS",
    NL: "Altijd Goed of Fout. Niet optimaal voor FSRS",
  };

  grade(correct: boolean, start: Date, now: Date, overwrite?: Grade): Grade {
    if (overwrite !== undefined) {
      return overwrite;
    }
    return correct ? Grade.Good : Grade.Incorrect;
  }
}

export { VerySimpleGradeMaker as verySimple, VerySimpleGradeMaker as verySimpleGradeMaker };
