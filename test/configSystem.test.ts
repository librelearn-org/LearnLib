import { describe, it, expect } from "bun:test";
import {
  extractDefaults,
  deepMerge,
  InferConfig,
  ModuleSchema,
} from "../configSystem";
import {
  globalModuleTracker,
  ModuleSystem,
  FsrsMethod,
  AlternativeAnswersModule,
  OptionalAnswerPartsModule,
  LearningMethod,
  Grade,
  CardState,
  Phase,
} from "../index";

describe("Typesafe Dynamic Config System", () => {
  const sampleSchema = {
    enabled: {
      type: "boolean",
      default: true,
      label: { EN: "Enabled", NL: "Ingeschakeld" },
      description: { EN: "Enable feature", NL: "Functie inschakelen" },
    },
    threshold: {
      type: "number",
      default: 10,
      min: 0,
      max: 100,
      step: 1,
      label: { EN: "Threshold", NL: "Drempelwaarde" },
    },
    mode: {
      type: "select",
      options: ["fast", "balanced", "thorough"] as const,
      default: "balanced" as const,
      label: { EN: "Operating Mode", NL: "Werkingsmodus" },
    },
    title: {
      type: "string",
      default: "Default Title",
    },
  } as const;

  type SampleConfig = InferConfig<typeof sampleSchema>;

  it("extracts default values directly from schema", () => {
    const defaults = extractDefaults(sampleSchema);
    expect(defaults).toEqual({
      enabled: true,
      threshold: 10,
      mode: "balanced",
      title: "Default Title",
    });
  });

  it("supports deepMerge for partial config updates", () => {
    const original = extractDefaults(sampleSchema);
    const updated = deepMerge(original, { threshold: 42, mode: "fast" });

    expect(updated.threshold).toBe(42);
    expect(updated.mode).toBe("fast");
    expect(updated.enabled).toBe(true);
    expect(updated.title).toBe("Default Title");
  });

  it("provides dynamic GUI config list with schemas, defaults, and translations", () => {
    const ms = new ModuleSystem(true);
    const guiSections = ms.getGuiConfigList();

    expect(Array.isArray(guiSections)).toBe(true);
    expect(guiSections.length).toBeGreaterThan(0);

    const fsrsSection = guiSections.find((s) => s.id === "fsrs");
    expect(fsrsSection).toBeDefined();
    expect(fsrsSection?.schema.targetRecall).toBeDefined();
    expect(fsrsSection?.schema.targetRecall.default).toBe(0.9);
    expect(fsrsSection?.config.targetRecall).toBe(0.9);
    expect(fsrsSection?.schema.targetRecall.label.NL).toBe("Doelherinneringspercentage");
  });

  it("allows setting and getting module configs dynamically", () => {
    const ms = new ModuleSystem(true);
    ms.setConfig("fsrs", { targetRecall: 0.85 });

    const config = ms.getConfig("fsrs");
    expect(config.targetRecall).toBe(0.85);

    const fsrsMod = ms.getMethod("fsrs") as FsrsMethod;
    expect(fsrsMod.config.targetRecall).toBe(0.85);
  });

  it("supports exportConfigJson and importConfigJson", () => {
    const ms = new ModuleSystem(true);
    ms.setConfig("fsrs", { targetRecall: 0.95 });

    const exportedJson = ms.exportConfigJson();
    expect(exportedJson.includes('"targetRecall":0.95') || exportedJson.includes('"targetRecall": 0.95')).toBe(true);

    const newMs = new ModuleSystem(true);
    newMs.importConfigJson(exportedJson);
    expect(newMs.getConfig("fsrs")?.targetRecall).toBe(0.95);
  });

  it("FSRS reviewCard uses module config directly without param drilling", () => {
    const fsrsMethod = new FsrsMethod();
    expect(fsrsMethod.config.targetRecall).toBe(0.9);

    const card: CardState = {
      id: "card-1",
      question: "Question",
      answer: "Answer",
      phase: Phase.Learning,
      methodId: "fsrs",
      lastReviewed: new Date(1000000000000),
      nextReview: new Date(1000000000000),
      history: [],
      metadata: { stability: 2.0, difficulty: 3.0 },
    };

    const now = new Date(1000000000000 + 10 * 24 * 60 * 60 * 1000);
    const resDefault = fsrsMethod.reviewCard({ ...card }, Grade.Good, now);

    // Modify config directly on the module instance
    fsrsMethod.config.targetRecall = 0.98;
    const resStrict = fsrsMethod.reviewCard({ ...card }, Grade.Good, now);

    // Higher target recall means earlier review date
    expect(resStrict.nextReview.getTime()).toBeLessThan(resDefault.nextReview.getTime());
  });

  it("configures preprocessors dynamically through global config system", () => {
    const ms = new ModuleSystem(true);
    const stripAccentsMod = ms.getPreprocessor("stripAccents");
    expect(stripAccentsMod).toBeDefined();
    expect(stripAccentsMod?.schema?.enabled?.default).toBe(false);

    // Enable stripAccents preprocessor dynamically
    ms.setConfig("stripAccents", { enabled: true });
    expect(ms.getConfig("stripAccents")?.enabled).toBe(true);

    const processed = stripAccentsMod?.preprocess("électricités");
    expect(processed).toBe("electricites");
  });

  it("guards against prototype pollution in deepMerge", () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "normal": "value"}');
    const merged = deepMerge({ safe: "test" }, malicious);

    expect(merged.normal).toBe("value");
    expect(merged.safe).toBe("test");
    expect((Object.prototype as any).polluted).toBeUndefined();
  });
});
