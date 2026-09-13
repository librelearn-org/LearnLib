import { describe, it, expect } from "bun:test";
import { upgradeTools } from "../upgradeTools";
import { Phase } from "../types";

describe("upgradeTools", () => {
  it("fills missing fields with default values", () => {
    const input = {};
    const upgraded = upgradeTools.upgradeCard(input);

    expect(upgraded.id).toBe("");
    expect(upgraded.question).toBe("");
    expect(upgraded.answer).toBe("");
    expect(upgraded.methodId).toBe("");
    expect(upgraded.phase).toBe(Phase.Learning);
    expect(upgraded.lastReviewed instanceof Date).toBe(true);
    expect(upgraded.nextReview instanceof Date).toBe(true);
    expect(upgraded.metadata).toEqual({});
  });

  it("preserves provided fields and converts date strings to Date instances", () => {
    const now = new Date();
    const input = {
      id: "card-123",
      question: "What is 2+2?",
      answer: "4",
      methodId: "simple",
      phase: Phase.Review,
      lastReviewed: now.toISOString(),
      nextReview: now.toISOString(),
      metadata: { learnedCount: 5 },
    };

    const upgraded = upgradeTools.upgradeCard(input as any);

    expect(upgraded.id).toBe("card-123");
    expect(upgraded.question).toBe("What is 2+2?");
    expect(upgraded.answer).toBe("4");
    expect(upgraded.methodId).toBe("simple");
    expect(upgraded.phase).toBe(Phase.Review);
    expect(upgraded.lastReviewed.getTime()).toBe(now.getTime());
    expect(upgraded.nextReview.getTime()).toBe(now.getTime());
    expect(upgraded.metadata).toEqual({ learnedCount: 5 });
  });

  it("migrates legacy Dutch fields automatically", () => {
    const input = {
      id: "card-old",
      vraag: "Vraag?",
      antwoord: "Antwoord!",
      fase: 1,
      methodeId: "simple",
      metaData: { test: true },
    };

    const upgraded = upgradeTools.upgradeCard(input as any);

    expect(upgraded.question).toBe("Vraag?");
    expect(upgraded.answer).toBe("Antwoord!");
    expect(upgraded.phase).toBe(Phase.Review);
    expect(upgraded.methodId).toBe("simple");
    expect(upgraded.metadata).toEqual({ test: true });
  });
});
