import { describe, it, expect } from "bun:test";
import { SimpleQueueUpdater } from "../queueUpdaters/simple";
import { Grade, CardState, LearnlibState, Phase } from "../types";

describe("SimpleQueueUpdater", () => {
  const updater = new SimpleQueueUpdater();

  const createDummyState = (queue: CardState[]): LearnlibState => ({
    cards: queue,
    queue,
    queueState: {
      current: queue[0] ?? null,
      isDone: queue.length === 0,
      initialCount: queue.length,
      progress: 0,
    },
  });

  it("has metadata properties set with translations", () => {
    expect(updater.name).toEqual({
      EN: "Simple Queue",
      NL: "Eenvoudige Wachtrij",
    });
    expect(updater.id).toBe("simple");
  });

  it("removes card from queue when grade is not Grade.Incorrect", () => {
    const k1: CardState = { id: "1", question: "v1", answer: "a1", phase: Phase.Learning, methodId: "simple", lastReviewed: new Date(), nextReview: new Date(), history: [], metadata: {} };
    const k2: CardState = { id: "2", question: "v2", answer: "a2", phase: Phase.Learning, methodId: "simple", lastReviewed: new Date(), nextReview: new Date(), history: [], metadata: {} };
    const state = createDummyState([k1, k2]);

    const updated = updater.updateQueue(state, k1, Grade.Good);
    expect(updated.queue.find((k) => k.id === "1")).toBeUndefined();
    expect(updated.queue.length).toBe(1);
  });

  it("re-inserts card at random position when grade is Grade.Incorrect", () => {
    const k1: CardState = { id: "1", question: "v1", answer: "a1", phase: Phase.Learning, methodId: "simple", lastReviewed: new Date(), nextReview: new Date(), history: [], metadata: {} };
    const k2: CardState = { id: "2", question: "v2", answer: "a2", phase: Phase.Learning, methodId: "simple", lastReviewed: new Date(), nextReview: new Date(), history: [], metadata: {} };
    const state = createDummyState([k1, k2]);

    const updated = updater.updateQueue(state, k1, Grade.Incorrect);
    expect(updated.queue.some((k) => k.id === "1")).toBe(true);
    expect(updated.queue.length).toBe(2);
  });
});
