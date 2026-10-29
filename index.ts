import {
  Grade,
  Phase,
  CardSnapshot,
  CardState,
  CardQueue,
  LearningMethod,
  QueueUpdater,
  GradeMaker,
  LearnlibState,
  LearnlibOptions,
  multiLangString,
  ModuleType,
} from "./types";
import { checkAnswer, normalize } from "./checker/base";
import { CheckConfig, CheckModule, Preprocessor, goodDefaults, LowestCheckFunction } from "./checker/shared";
import { WordChecker, wordChecker } from "./checker/compiled";
import { SimpleQueueUpdater, simpleQueueUpdater, simpleWachtrij } from "./queueUpdaters/simple";
import { VerySimpleGradeMaker, verySimpleGradeMaker, verySimple } from "./gradeMakers/verySimple";
import { SimpleMethod, simpleMethod, simpleMethode } from "./methods/simple";
import { FsrsMethod, fsrsMethod, fsrs, fsrsSchema } from "./methods/fsrs";
import { OptionalAnswerPartsModule, optionalAnswerPartsModule, optionalAnswerPartsSchema } from "./checker/modules/optionalAnswerParts";
import { UnorderedAnswerPartsModule, unorderedAnswerPartsModule, unorderedAnswerPartsSchema } from "./checker/modules/unorderedAnswerParts";
import { AlternativeAnswersModule, alternativeAnswersModule, alternativeAnswersSchema } from "./checker/modules/alternativeAnswers";
import { GreekPreprocessor, greekPreprocessor, greek } from "./checker/preprocessors/greek";
import { upgradeTools } from "./upgradeTools";
import { globalModuleTracker, moduleTracker, ModuleSystem, moduleSystem, Module, LearnlibModule, GuiConfigSection } from "./moduleSystem";
import { extractDefaults, deepMerge, ModuleSchema, InferConfig, SchemaField } from "./configSystem";

export class Learnlib {
  public method: LearningMethod;
  public grader: GradeMaker;
  public queueUpdater: QueueUpdater;
  public cards: CardState[] = [];
  public queue: CardState[] = [];
  public current: CardState | null = null;
  public history: CardSnapshot[] = [];
  public checkConfig: CheckConfig;
  public initialCount: number = 0;

  private cStart: Date;
  private listeners: Set<(state: LearnlibState) => void> = new Set();
  private cachedSnapshot!: LearnlibState;

  // Backwards compatibility aliases
  public get methode(): LearningMethod {
    return this.method;
  }
  public get lijst(): CardState[] {
    return this.cards;
  }
  public set lijst(val: CardState[]) {
    this.cards = val;
  }
  public get wachtrij(): CardState[] {
    return this.queue;
  }
  public set wachtrij(val: CardState[]) {
    this.queue = val;
  }
  public get wachtrijUpdater(): QueueUpdater {
    return this.queueUpdater;
  }

  constructor(
    optionsOrCards: LearnlibOptions | CardState[] | LearnlibState,
    method?: LearningMethod | string,
    grader?: GradeMaker | string,
    queueUpdater?: QueueUpdater | string,
    checkConfig: CheckConfig = {},
    initialConfigs?: Record<string, any> | string
  ) {
    let resolvedCards: CardState[] | LearnlibState;
    let resolvedMethod: LearningMethod | string = method ?? "simple";
    let resolvedGrader: GradeMaker | string = grader ?? "basic";
    let resolvedQueueUpdater: QueueUpdater | string = queueUpdater ?? "simple";
    let resolvedCheckConfig: CheckConfig = checkConfig;
    let resolvedConfigs: Record<string, any> | string | undefined = initialConfigs;

    if (optionsOrCards && typeof optionsOrCards === "object" && !Array.isArray(optionsOrCards) && "cards" in optionsOrCards && !(optionsOrCards as any).queueState && !(optionsOrCards as any).wachtrijState) {
      const opts = optionsOrCards as LearnlibOptions;
      resolvedCards = opts.cards;
      if (opts.method) resolvedMethod = opts.method;
      if (opts.grader) resolvedGrader = opts.grader;
      if (opts.queueUpdater) resolvedQueueUpdater = opts.queueUpdater;
      if (opts.checkConfig) resolvedCheckConfig = opts.checkConfig;
      if (opts.configs) resolvedConfigs = opts.configs;
    } else {
      resolvedCards = optionsOrCards as CardState[] | LearnlibState;
    }

    this.method = typeof resolvedMethod === "string"
      ? globalModuleTracker.getOrThrow<LearningMethod>(resolvedMethod, "method")
      : resolvedMethod;

    this.grader = typeof resolvedGrader === "string"
      ? globalModuleTracker.getOrThrow<GradeMaker>(resolvedGrader, "gradeMaker")
      : resolvedGrader;

    this.queueUpdater = typeof resolvedQueueUpdater === "string"
      ? globalModuleTracker.getOrThrow<QueueUpdater>(resolvedQueueUpdater, "queueUpdater")
      : resolvedQueueUpdater;

    this.checkConfig = resolvedCheckConfig;
    this.cStart = new Date();

    if (resolvedConfigs) {
      this.importConfigJson(resolvedConfigs);
    }

    if (Array.isArray(resolvedCards)) {
      this.history = [];
      this.cards = resolvedCards.map((k) => upgradeTools.upgradeCard(k));
      this.queue = this.shuffleArray(this.cards);
      this.current = this.queue[0] ?? null;
      this.initialCount = this.queue.length;
    } else {
      const stateObj = resolvedCards as any;
      this.history = stateObj.history ?? [];
      const rawCards = stateObj.cards ?? stateObj.lijst ?? stateObj.queue ?? stateObj.wachtrij ?? [];
      const rawQueue = stateObj.queue ?? stateObj.wachtrij ?? [];
      this.cards = rawCards.map((k: any) => upgradeTools.upgradeCard(k));
      this.queue = rawQueue.map((k: any) => upgradeTools.upgradeCard(k));

      const queueState = stateObj.queueState ?? stateObj.wachtrijState;
      this.initialCount = queueState?.initialCount ?? stateObj.initialCount ?? this.queue.length;

      if (queueState?.current !== undefined) {
        this.current = queueState.current;
      } else if (stateObj.current !== undefined) {
        this.current = stateObj.current;
      } else {
        this.queue = this.shuffleArray(this.queue);
        this.current = this.queue[0] ?? null;
      }
    }

    if (this.current) {
      if (!this.current.methodId) {
        this.queue = this.queue.map((v) => {
          v.methodId = this.method.id;
          return upgradeTools.upgradeCard(v);
        });
        this.cards = this.cards.map((v) => {
          if (!v.methodId) v.methodId = this.method.id;
          return upgradeTools.upgradeCard(v);
        });
        this.current = this.queue[0] ?? null;
      }
      if (this.current && this.current.methodId !== this.method.id) {
        throw new Error(`Card methodId '${this.current.methodId}' does not match active method '${this.method.id}'`);
      }
    }

    this.updateSnapshot();
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public subscribe = (listener: (state: LearnlibState) => void): () => void => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private updateSnapshot(): LearnlibState {
    const isDone = this.queue.length === 0;
    const progress = this.initialCount > 0 ? (this.initialCount - this.queue.length) / this.initialCount : 0;
    const current = isDone ? null : (this.current ?? null);

    const snapshot: any = {
      cards: [...this.cards],
      queue: [...this.queue],
      queueState: {
        current,
        isDone,
        initialCount: this.initialCount,
        progress,
      },
      // Backward-compat aliases
      lijst: [...this.cards],
      wachtrij: [...this.queue],
      wachtrijState: {
        current,
        isKlaar: isDone,
        initialCount: this.initialCount,
        progress,
      },
    };
    this.cachedSnapshot = snapshot;
    return this.cachedSnapshot;
  }

  public getSnapshot = (): LearnlibState => {
    return this.cachedSnapshot;
  };

  private notify() {
    this.updateSnapshot();
    for (const listener of this.listeners) {
      listener(this.cachedSnapshot);
    }
  }

  public reshuffle() {
    this.queue = this.shuffleArray(this.queue);
    this.current = this.queue[0] ?? null;
    this.cStart = new Date();
    this.notify();
  }

  public reset() {
    this.queue = [...this.cards];
    this.reshuffle();
  }

  public setConfig(moduleId: string, config: any, type?: ModuleType): this {
    if ((!type || type === "method") && this.method.id === moduleId) {
      this.method.config = deepMerge(this.method.config ?? {}, config);
    }
    if ((!type || type === "gradeMaker") && this.grader.id === moduleId) {
      this.grader.config = deepMerge(this.grader.config ?? {}, config);
    }
    if ((!type || type === "queueUpdater") && this.queueUpdater.id === moduleId) {
      this.queueUpdater.config = deepMerge(this.queueUpdater.config ?? {}, config);
    }
    globalModuleTracker.setConfig(moduleId, config, type);
    return this;
  }

  public getConfig(moduleId: string, type?: ModuleType): any {
    if ((!type || type === "method") && this.method.id === moduleId) return this.method.config;
    if ((!type || type === "gradeMaker") && this.grader.id === moduleId) return this.grader.config;
    if ((!type || type === "queueUpdater") && this.queueUpdater.id === moduleId) return this.queueUpdater.config;
    return globalModuleTracker.getConfig(moduleId, type);
  }

  public exportConfigJson(pretty: boolean = false): string {
    return globalModuleTracker.exportConfigJson(pretty);
  }

  public getConfigJson(pretty: boolean = false): string {
    return this.exportConfigJson(pretty);
  }

  public importConfigJson(json: string | Record<string, any>): this {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    if (parsed && typeof parsed === "object") {
      for (const [id, cfg] of Object.entries(parsed)) {
        this.setConfig(id, cfg);
      }
    }
    return this;
  }

  public answer(uAnswer: string, gradeOverwrite?: Grade, checkConfigOverride?: CheckConfig) {
    if (!this.current) {
      return;
    }
    const endTime = new Date();
    const isCorrect = checkAnswer(
      this.current.answer,
      uAnswer,
      checkConfigOverride ?? this.checkConfig
    );

    const grade = gradeOverwrite ?? this.grader.grade(isCorrect, this.cStart, endTime);
    const snapshot: CardSnapshot = {
      date: endTime,
      cardId: this.current.id,
      answer: uAnswer,
      grade: grade,
    };
    this.history.push(snapshot);
    this.current.history = [...(this.current.history ?? []), snapshot];

    this.updateSnapshot();
    this.current = this.method.reviewCard(this.current, grade, endTime, { ...this.cachedSnapshot });
    this.queue[0] = this.current;
    this.cards = this.cards.map((k) => (k.id === this.current?.id ? this.current! : k));

    this.updateSnapshot();
    const newState = this.queueUpdater.updateQueue({ ...this.cachedSnapshot }, this.current, grade);
    this.queue = newState.queue;
    this.current = this.queue[0] ?? null;
    this.cStart = new Date();
    this.notify();
  }

  public antwoord(uAnswer: string, gradeOverwrite?: Grade, checkConfigOverride?: CheckConfig) {
    this.answer(uAnswer, gradeOverwrite, checkConfigOverride);
  }
}

export default Learnlib;

export { Grade, Phase } from "./types";
export type {
  CardState,
  CardSnapshot,
  CardQueue,
  LearningMethod,
  QueueUpdater,
  GradeMaker,
  LearnlibState,
  LearnlibOptions,
  multiLangString,
  BaseModule,
  ModuleType,
  CardState as KaartStaat,
  CardSnapshot as KaartSnapshot,
  CardQueue as KaartWachtrij,
  LearningMethod as LeerMethode,
  QueueUpdater as WachtrijUpdater,
  Phase as Fase,
} from "./types";

export { checkAnswer, normalize } from "./checker/base";
export { WordChecker, wordChecker } from "./checker/compiled";
export { goodDefaults } from "./checker/shared";
export type { CheckConfig, CheckModule, Preprocessor, LowestCheckFunction } from "./checker/shared";

export { SimpleMethod, simpleMethod, SimpleMethod as simpleMethode } from "./methods/simple";
export { FsrsMethod, fsrsMethod, FsrsMethod as fsrs, fsrsSchema } from "./methods/fsrs";
export { VerySimpleGradeMaker, verySimpleGradeMaker, VerySimpleGradeMaker as verySimple } from "./gradeMakers/verySimple";
export { SimpleQueueUpdater, simpleQueueUpdater, SimpleQueueUpdater as simpleWachtrij } from "./queueUpdaters/simple";
export { OptionalAnswerPartsModule, optionalAnswerPartsModule, optionalAnswerPartsSchema } from "./checker/modules/optionalAnswerParts";
export { UnorderedAnswerPartsModule, unorderedAnswerPartsModule, unorderedAnswerPartsSchema } from "./checker/modules/unorderedAnswerParts";
export { AlternativeAnswersModule, alternativeAnswersModule, alternativeAnswersSchema } from "./checker/modules/alternativeAnswers";
export { CaseInsensitivePreprocessor, caseInsensitivePreprocessor, CaseSensitivePreprocessor, notCaseSensitive, caseSensitiveSchema } from "./checker/preprocessors/notCaseSensitive";
export { StripAccentsPreprocessor, stripAccentsPreprocessor, stripAccentsSchema } from "./checker/preprocessors/stripAccents";
export { GreekPreprocessor, greekPreprocessor, GreekPreprocessor as greek, greekSchema } from "./checker/preprocessors/greek";
export { RemoveArticlesPreprocessor, removeArticlesPreprocessor, removeArticlesSchema, DEFAULT_ARTICLES } from "./checker/preprocessors/removeArticles";

export { ModuleSystem, moduleSystem, globalModuleTracker, moduleTracker } from "./moduleSystem";
export type { Module, LearnlibModule, GuiConfigSection } from "./moduleSystem";

export { extractDefaults, deepMerge } from "./configSystem";
export type { ModuleSchema, InferConfig, SchemaField } from "./configSystem";

export { upgradeTools } from "./upgradeTools";

export const methods: LearningMethod[] = [
  new SimpleMethod(),
  new FsrsMethod(),
];
export const methodes = methods;

export const queueUpdaters: QueueUpdater[] = [
  new SimpleQueueUpdater(),
];
export const wachtrijUpdaters = queueUpdaters;

export const gradeMakers: GradeMaker[] = [
  new VerySimpleGradeMaker(),
];
