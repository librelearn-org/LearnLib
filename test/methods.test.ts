import { describe, it, expect } from "bun:test";
import { SimpleMethod } from "../methods/simple";
import { FsrsMethod, fsrsSchema } from "../methods/fsrs";
import { Grade, CardState, Phase } from "../types";

describe("SimpleMethod", () => {
  const method = new SimpleMethod();

  it("has metadata properties set with translations", () => {
    expect(method.name).toEqual({
      EN: "Simple",
      NL: "Eenvoudig",
    });
    expect(method.id).toBe("simple");
  });

  it("reviewCard sets nextReview to now on Grade.Incorrect without setting learned", () => {
    const card: CardState = {
      id: "1",
      question: "Question",
      answer: "Answer",
      phase: Phase.Learning,
      methodId: "simple",
      lastReviewed: new Date(0),
      nextReview: new Date(0),
      history: [],
      metadata: {},
    };
    const now = new Date();
    const updated = method.reviewCard({ ...card }, Grade.Incorrect, now);

    expect(updated.nextReview.getTime()).toBe(now.getTime());
    expect(updated.metadata["learned"]).toBeUndefined();
  });

  it("reviewCard sets learned=true in metadata for passing grades", () => {
    const card: CardState = {
      id: "1",
      question: "Question",
      answer: "Answer",
      phase: Phase.Learning,
      methodId: "simple",
      lastReviewed: new Date(0),
      nextReview: new Date(0),
      history: [],
      metadata: {},
    };
    const now = new Date();
    const updated = method.reviewCard({ ...card }, Grade.Good, now);

    expect(updated.nextReview.getTime()).toBe(now.getTime());
    expect(updated.metadata["learned"]).toBe(true);
  });

  it("filterQueueItem filters items based on learned metadata", () => {
    const cardLearned: CardState = {
      id: "1",
      question: "Question",
      answer: "Answer",
      phase: Phase.Learning,
      methodId: "simple",
      lastReviewed: new Date(),
      nextReview: new Date(),
      history: [],
      metadata: { learned: true },
    };
    const cardNotLearned: CardState = {
      id: "2",
      question: "Question 2",
      answer: "Answer 2",
      phase: Phase.Learning,
      methodId: "simple",
      lastReviewed: new Date(),
      nextReview: new Date(),
      history: [],
      metadata: {},
    };

    expect(method.filterQueueItem(cardLearned)).toBe(true);
    expect(method.filterQueueItem(cardNotLearned)).toBe(false);
  });
});

describe("FsrsMethod", () => {
  it("initializes with fsrsSchema and default targetRecall", () => {
    const fsrs = new FsrsMethod();
    expect(fsrs.schema).toBe(fsrsSchema);
    expect(fsrs.config.targetRecall).toBe(0.9);
  });
});
