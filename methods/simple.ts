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
    metadata["learned"] = true;
    metadata["geleerd"] = true;
    return {
      ...card,
      lastReviewed: now,
      nextReview: now,
      metadata,
    };
  }

  filterQueueItem(item: CardState): boolean {
    const metadata = item?.metadata ?? {};
    return Boolean(metadata["learned"] || metadata["geleerd"]);
  }
}

export { SimpleMethod as simpleMethod, SimpleMethod as simpleMethode };
