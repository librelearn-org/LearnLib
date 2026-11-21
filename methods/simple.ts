import { CardState, Grade, LearningMethod } from "../types";

export class SimpleMethod implements LearningMethod {
  type = "method" as const;
  id = "simple";
  name = {
    EN: "Simple",
    NL: "Eenvoudig",
  };
  description = {
    EN: "Simple flashcard learning with standard repetition",
    NL: "Eenvoudig leren met standaard herhaling",
  };
  capabilities = {
    type: "session" as const,
    showNextLearnDate: false,
    supportedGrades: [Grade.Good, Grade.Incorrect]
  };

  reviewCard(card: CardState, grade: Grade, now: Date = new Date()): CardState {
    const metadata = { ...(card.metadata ?? {}) };
    if (grade === Grade.Incorrect) {
      return {
        ...card,
        lastReviewed: now,
        nextReview: now,
        metadata,
      };
    }
    return {
      ...card,
      lastReviewed: now,
      nextReview: now,
      metadata,
    };
  }
}

export { SimpleMethod as simpleMethod, SimpleMethod as simpleMethode };
