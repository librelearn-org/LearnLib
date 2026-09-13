import { describe, it, expect } from "bun:test";
import Learnlib, { methods, gradeMakers, queueUpdaters } from "../index";
import { SimpleMethod } from "../methods/simple";
import { VerySimpleGradeMaker } from "../gradeMakers/verySimple";
import { SimpleQueueUpdater } from "../queueUpdaters/simple";
import { CardState, Grade, Phase, LearnlibState } from "../types";

describe("Learnlib main class", () => {
  function createDummyCard(id: string, question: string = "Question", answer: string = "Answer", methodId: string = "simple"): CardState {
    return {
      id,
      question,
      answer,
      phase: Phase.Learning,
      methodId,
      lastReviewed: new Date(),
      nextReview: new Date(),
      history: [],
      metadata: {},
    };
  }

  it("initializes correctly and upgrades cards missing methodId", () => {
    const partialCard: any = {
      id: "card-1",
      question: "What is the capital of France?",
      answer: "Paris",
    };

    const method = new SimpleMethod();
    const grader = new VerySimpleGradeMaker();
    const updater = new SimpleQueueUpdater();

    const lib = new Learnlib([partialCard], method, grader, updater);

    expect(lib.queue.length).toBe(1);
    expect(lib.current?.id).toBe("card-1");
    expect(lib.current?.methodId).toBe("simple");
  });

  it("supports options-based constructor", () => {
    const card = createDummyCard("c1", "Q", "A");
    const lib = new Learnlib({
      cards: [card],
      method: "simple",
      grader: "basic",
      queueUpdater: "simple",
      checkConfig: { stripAccents: true },
    });

    expect(lib.queue.length).toBe(1);
    expect(lib.current?.id).toBe("c1");
    expect(lib.checkConfig.stripAccents).toBe(true);
  });

  it("throws an error if card methodId does not match learning method", () => {
    const card = createDummyCard("1", "Question", "Answer", "wrong-method");
    const method = new SimpleMethod();
    const grader = new VerySimpleGradeMaker();
    const updater = new SimpleQueueUpdater();

    expect(() => new Learnlib([card], method, grader, updater)).toThrow("does not match active method");
  });

  it("processes correct answers via answer()", () => {
    const k1 = createDummyCard("1", "What is 1+1?", "2");
    const k2 = createDummyCard("2", "What is 2+2?", "4");

    const method = new SimpleMethod();
    const grader = new VerySimpleGradeMaker();
    const updater = new SimpleQueueUpdater();

    const lib = new Learnlib([k1, k2], method, grader, updater);
    const initialCurrentId = lib.current?.id;

    lib.answer(lib.current?.answer || "error");

    expect(lib.queue.length).toBe(1);
    expect(lib.current?.id).not.toBe(initialCurrentId);
  });

  it("processes wrong answers via answer()", () => {
    const k1 = createDummyCard("1", "What is 1+1?", "2");

    const method = new SimpleMethod();
    const grader = new VerySimpleGradeMaker();
    const updater = new SimpleQueueUpdater();

    const lib = new Learnlib([k1], method, grader, updater);

    lib.answer("wrong answer");

    expect(lib.queue.length).toBe(1);
    expect(lib.current?.id).toBe("1");
  });

  it("supports grade overwrite in answer()", () => {
    const k1 = createDummyCard("1", "What is 1+1?", "2");
    const method = new SimpleMethod();
    const grader = new VerySimpleGradeMaker();
    const updater = new SimpleQueueUpdater();

    const lib = new Learnlib([k1], method, grader, updater);

    lib.answer("2", Grade.Incorrect);
    expect(lib.queue.length).toBe(1);
  });

  it("reshuffle() reorganizes the queue and sets current", () => {
    const cards = [
      createDummyCard("1"),
      createDummyCard("2"),
      createDummyCard("3"),
    ];

    const lib = new Learnlib(cards, new SimpleMethod(), new VerySimpleGradeMaker(), new SimpleQueueUpdater());

    lib.reshuffle();
    expect(lib.queue.length).toBe(3);
    expect(lib.current).toBe(lib.queue[0]);
  });

  it("exports default arrays of methods, gradeMakers and queueUpdaters", () => {
    expect(Array.isArray(methods)).toBe(true);
    expect(methods.length).toBeGreaterThan(0);

    expect(Array.isArray(gradeMakers)).toBe(true);
    expect(gradeMakers.length).toBeGreaterThan(0);

    expect(Array.isArray(queueUpdaters)).toBe(true);
    expect(queueUpdaters.length).toBeGreaterThan(0);
  });

  it("respects CheckConfig passed to constructor", () => {
    const k1 = createDummyCard("1", "Éclair", "Éclair");
    const method = new SimpleMethod();
    const grader = new VerySimpleGradeMaker();
    const updater = new SimpleQueueUpdater();

    const lib = new Learnlib([k1], method, grader, updater, { stripAccents: true });

    lib.answer("eclair");
    expect(lib.queue.length).toBe(0);
  });

  it("supports checkConfigOverride in answer()", () => {
    const k1 = createDummyCard("1", "Answer", "a / b");
    const method = new SimpleMethod();
    const grader = new VerySimpleGradeMaker();
    const updater = new SimpleQueueUpdater();

    const lib = new Learnlib([k1], method, grader, updater);

    lib.answer("b", undefined, { alternativeAnswers: { allow: true, mode: "both" } });
    expect(lib.queue.length).toBe(0);
  });

  it("notifies subscribers when answer or reshuffle is called", () => {
    const k1 = createDummyCard("1", "Question", "Answer");
    const lib = new Learnlib([k1], new SimpleMethod(), new VerySimpleGradeMaker(), new SimpleQueueUpdater());

    const states: any[] = [];
    const initialState = lib.getSnapshot();
    expect(initialState.queueState.current?.id).toBe("1");
    expect(initialState.queueState.isDone).toBe(false);

    const unsubscribe = lib.subscribe((state) => {
      states.push(state);
    });

    lib.answer("Answer");
    expect(states.length).toBe(1);
    expect(states[0].queueState.isDone).toBe(true);

    unsubscribe();
    lib.reshuffle();
    expect(states.length).toBe(1);
  });

  it("tracks answer history in snapshot and class instance", () => {
    const k1 = createDummyCard("1", "Question 1", "Answer 1");
    const lib = new Learnlib([k1], new SimpleMethod(), new VerySimpleGradeMaker(), new SimpleQueueUpdater());

    expect(lib.history.length).toBe(0);
    lib.answer("Answer 1");

    expect(lib.history.length).toBe(1);
    expect(lib.history[0].cardId).toBe("1");
    expect(lib.history[0].answer).toBe("Answer 1");
    expect(lib.history[0].grade).toBe(Grade.Good);
    expect(lib.cards[0].history.length).toBe(1);
  });

  it("can be initialized from an existing LearnlibState", () => {
    const k1 = createDummyCard("1", "Question 1", "Answer 1");
    const k2 = createDummyCard("2", "Question 2", "Answer 2");
    const existingState: LearnlibState = {
      cards: [k1, k2],
      queue: [k1, k2],
      queueState: {
        current: k1,
        isDone: false,
        initialCount: 2,
        progress: 0,
      },
    };

    const lib = new Learnlib(existingState, new SimpleMethod(), new VerySimpleGradeMaker(), new SimpleQueueUpdater());
    expect(lib.current?.id).toBe("1");
    expect(lib.queue.length).toBe(2);
    expect(lib.cards.length).toBe(2);
  });

  it("can be reset", () => {
    const cards = [
      createDummyCard("1"),
      createDummyCard("2"),
      createDummyCard("3"),
    ];

    const lib = new Learnlib(cards, new SimpleMethod(), new VerySimpleGradeMaker(), new SimpleQueueUpdater());
    lib.answer("1", Grade.Good);
    expect(lib.queue.length).toBe(2);
    lib.reset();
    expect(lib.queue.length).toBe(3);
  });
});
