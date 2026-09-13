import { describe, it, expect } from "bun:test";
import Learnlib from "../index";
import { VerySimpleGradeMaker } from "../gradeMakers/verySimple";
import { SimpleMethod } from "../methods/simple";
import { SimpleQueueUpdater } from "../queueUpdaters/simple";
import { Grade, Phase, CardState, LearnlibState } from "../types";

describe("GradeMakers, Methods, Queue and Learnlib", () => {
  it("VerySimpleGradeMaker respects overwrite and default behavior", () => {
    const gm = new VerySimpleGradeMaker();
    const now = new Date();
    expect(gm.grade(true, now, now)).toBe(Grade.Good);
    expect(gm.grade(false, now, now)).toBe(Grade.Incorrect);
    expect(gm.grade(false, now, now, Grade.Easy)).toBe(Grade.Easy);
  });

  it("SimpleMethod reviewCard toggles metadata and sets nextReview", () => {
    const m = new SimpleMethod();
    const card: CardState = {
      id: "k1",
      question: "v",
      answer: "a",
      phase: Phase.Learning,
      methodId: "simple",
      lastReviewed: new Date(0),
      nextReview: new Date(0),
      history: [],
      metadata: {},
    };
    const now = new Date();
    const updated = m.reviewCard({ ...card }, Grade.Good, now);
    expect(updated.nextReview.getTime()).toBe(now.getTime());
    expect(updated.metadata["learned"]).toBe(true);

    const updatedFail = m.reviewCard({ ...card }, Grade.Incorrect, now);
    expect(updatedFail.nextReview.getTime()).toBe(now.getTime());
  });

  it("SimpleMethod filterQueueItem returns according to metadata.learned", () => {
    const m = new SimpleMethod();
    const item: any = { metadata: { learned: true } };
    expect(m.filterQueueItem(item)).toBe(true);
    item.metadata.learned = false;
    expect(m.filterQueueItem(item)).toBe(false);
  });

  it("SimpleQueueUpdater updateQueue removes or inserts based on grade", () => {
    const updater = new SimpleQueueUpdater();
    const card: any = { id: "k1" };
    const dummyState = (queue: any[]): LearnlibState => ({
      cards: queue,
      queue,
      queueState: {
        current: queue[0] ?? null,
        isDone: queue.length === 0,
        initialCount: queue.length,
        progress: 0,
      },
    });

    // non-error grade should remove card
    let state = dummyState([{ id: "k1" }, { id: "k2" }]);
    let res = updater.updateQueue(state, card, Grade.Good);
    expect(res.queue.find((k) => k.id === "k1")).toBe(undefined);

    // error grade should insert card at deterministic position
    const realMathRandom = Math.random;
    Math.random = () => 0.5; // deterministic
    state = dummyState([{ id: "k2" }]);
    res = updater.updateQueue(state, card, Grade.Incorrect);
    expect(res.queue.some((k) => k.id === "k1")).toBe(true);
    Math.random = realMathRandom;
  });

  it("Learnlib constructor validates methodId and answer updates state and calls updater", () => {
    const card: CardState = {
      id: "1",
      question: "q",
      answer: "a",
      phase: Phase.Learning,
      methodId: "simple",
      lastReviewed: new Date(0),
      nextReview: new Date(0),
      history: [],
      metadata: {},
    };

    const method = {
      id: "simple",
      reviewCard: (k: any, g: Grade, now: Date) => {
        k.metadata.learned = true;
        k.lastReviewed = now;
        return k;
      },
      filterQueueItem: () => true,
    } as any;

    let updaterCalled = false;
    const queueUpdater = {
      id: "simple",
      updateQueue: (state: any, k: any, g: Grade) => {
        updaterCalled = true;
        return state;
      },
    } as any;

    const grader = { id: "basic", grade: () => Grade.Good } as any;

    const lib = new Learnlib([card], method, grader, queueUpdater);
    lib.answer("a");
    expect(updaterCalled).toBe(true);

    // constructor throws when method mismatch
    const badCard = { ...card, methodId: "other" };
    expect(() => new Learnlib([badCard], method, grader, queueUpdater)).toThrow();
  });
});
