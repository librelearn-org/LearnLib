import { describe, it, expect, beforeEach } from "bun:test";
import {
  ModuleSystem,
  globalModuleTracker,
  moduleTracker,
  LearningMethod,
  QueueUpdater,
  GradeMaker,
  CheckModule,
  Preprocessor,
  Grade,
  CardState,
  Phase,
} from "../index";
import Learnlib from "../index";

describe("ModuleSystem", () => {
  let customTracker: ModuleSystem;

  beforeEach(() => {
    customTracker = new ModuleSystem(false);
  });

  it("registers and retrieves modules by id", () => {
    const dummyMethod: LearningMethod = {
      id: "custom-method",
      type: "method",
      name: { EN: "Custom Method", NL: "Aangepaste Methode" },
      description: { EN: "A test method", NL: "Een testmethode" },
      reviewCard: (k) => k,
      filterQueueItem: () => true,
    };

    customTracker.register(dummyMethod);
    expect(customTracker.has("custom-method")).toBe(true);
    expect(customTracker.get("custom-method")).toBe(dummyMethod);
    expect(customTracker.getMethod("custom-method")).toBe(dummyMethod);
  });

  it("registers multiple modules at once or as arrays", () => {
    const m1: LearningMethod = {
      id: "m1",
      type: "method",
      name: "M1",
      description: "desc 1",
      reviewCard: (k) => k,
      filterQueueItem: () => true,
    };
    const m2: GradeMaker = {
      id: "g1",
      type: "gradeMaker",
      name: "G1",
      description: "desc g1",
      grade: () => Grade.Good,
    };

    customTracker.register([m1, m2]);
    expect(customTracker.getAll().length).toBe(2);
    expect(customTracker.listIds()).toEqual(["m1", "g1"]);
  });

  it("unregisters modules", () => {
    const m1: LearningMethod = {
      id: "m1",
      type: "method",
      name: "M1",
      description: "desc 1",
      reviewCard: (k) => k,
      filterQueueItem: () => true,
    };

    customTracker.register(m1);
    expect(customTracker.has("m1")).toBe(true);
    expect(customTracker.unregister("m1")).toBe(true);
    expect(customTracker.has("m1")).toBe(false);
  });

  it("throws error when registering a module without id", () => {
    expect(() => customTracker.register({} as any)).toThrow("Module must have a valid 'id'");
  });

  it("getOrThrow returns module or throws when not found or type mismatch", () => {
    const m1: LearningMethod = {
      id: "m1",
      type: "method",
      name: "M1",
      description: "desc 1",
      reviewCard: (k) => k,
      filterQueueItem: () => true,
    };
    customTracker.register(m1);

    expect(customTracker.getOrThrow("m1")).toBe(m1);
    expect(customTracker.getOrThrow("m1", "method")).toBe(m1);
    expect(() => customTracker.getOrThrow("non-existent")).toThrow("Module with id 'non-existent' not found");
    expect(() => customTracker.getOrThrow("m1", "gradeMaker")).toThrow("has type 'method', expected 'gradeMaker'");
  });

  it("filters modules by type", () => {
    const method: LearningMethod = {
      id: "m1",
      type: "method",
      name: "M1",
      description: "desc",
      reviewCard: (k) => k,
      filterQueueItem: () => true,
    };
    const updater: QueueUpdater = {
      id: "u1",
      type: "queueUpdater",
      name: "U1",
      description: "desc",
      updateQueue: (s) => s,
    };
    const grader: GradeMaker = {
      id: "g1",
      type: "gradeMaker",
      name: "G1",
      description: "desc",
      grade: () => Grade.Good,
    };
    const checker: CheckModule = {
      id: "c1",
      configId: "c1",
      type: "checker",
      name: { EN: "C1" },
      description: { EN: "desc" },
      check: () => true,
    };
    const prep: Preprocessor = {
      id: "p1",
      configId: "p1",
      type: "preprocessor",
      name: { EN: "P1" },
      description: { EN: "desc" },
      preprocess: (s) => s,
    };

    customTracker.register(method, updater, grader, checker, prep);

    expect(customTracker.getMethods().length).toBe(1);
    expect(customTracker.getQueueUpdaters().length).toBe(1);
    expect(customTracker.getGradeMakers().length).toBe(1);
    expect(customTracker.getCheckerModules().length).toBe(1);
    expect(customTracker.getPreprocessors().length).toBe(1);
  });

  it("globalModuleTracker is pre-populated with built-in defaults", () => {
    expect(globalModuleTracker.has("simple")).toBe(true);
    expect(globalModuleTracker.has("fsrs")).toBe(true);
    expect(globalModuleTracker.has("basic")).toBe(true);
    expect(globalModuleTracker.has("optionalAnswerParts")).toBe(true);
    expect(globalModuleTracker.has("alternativeAnswers")).toBe(true);
    expect(globalModuleTracker.has("greekLetters")).toBe(true);

    expect(globalModuleTracker.getMethod("simple")).toBeDefined();
    expect(globalModuleTracker.getMethod("fsrs")).toBeDefined();
    expect(globalModuleTracker.getGradeMaker("basic")).toBeDefined();
    expect(globalModuleTracker.getQueueUpdater("simple")).toBeDefined();
  });

  it("Learnlib constructor resolves module IDs from globalModuleTracker", () => {
    const card: CardState = {
      id: "card-1",
      question: "What is 2+2?",
      answer: "4",
      phase: Phase.Learning,
      methodId: "simple",
      lastReviewed: new Date(),
      nextReview: new Date(),
      history: [],
      metadata: {},
    };

    const lib = new Learnlib([card], "simple", "basic", "simple");
    expect(lib.queue.length).toBe(1);
    expect(lib.current?.id).toBe("card-1");

    lib.answer("4");
    expect(lib.queue.length).toBe(0);
  });

  it("Learnlib constructor throws when string module ID is not found or has wrong type", () => {
    const card: CardState = {
      id: "card-1",
      question: "What is 2+2?",
      answer: "4",
      phase: Phase.Learning,
      methodId: "simple",
      lastReviewed: new Date(),
      nextReview: new Date(),
      history: [],
      metadata: {},
    };

    expect(() => new Learnlib([card], "non-existent-method", "basic", "simple")).toThrow("not found in module tracker");
    expect(() => new Learnlib([card], "basic", "basic", "simple")).toThrow("has type 'gradeMaker', expected 'method'");
  });
});
