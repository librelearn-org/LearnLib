import { CheckConfig, CheckModule, Preprocessor, goodDefaults, LowestCheckFunction } from "./shared";
import { normalize, preprocess } from "./base";
import { globalModuleTracker } from "../moduleSystem";

export class WordChecker {
  private options: Set<string> = new Set<string>();
  private word: string;
  private config: CheckConfig;
  private modules: CheckModule[];
  private preprocessors: Preprocessor[];
  private promise: Promise<void> | undefined;
  private ready: boolean = false;
  public logging: boolean = false;

  private log(...data: any[]) {
    if (this.logging) {
      console.log("[checker]", ...data);
    }
  }

  constructor(
    word: string,
    config: CheckConfig = goodDefaults,
    customModules?: CheckModule[],
    customPreprocessors?: Preprocessor[]
  ) {
    this.config = { ...goodDefaults, ...config };
    this.modules = customModules ?? globalModuleTracker.getCheckerModules();
    this.preprocessors = customPreprocessors ?? globalModuleTracker.getPreprocessors();
    // Preprocess root word ONCE before compilation loop
    this.word = preprocess(word, this.preprocessors, this.config);
    this.options.add(this.word);
  }

  async check(userAnswer: string): Promise<boolean> {
    if (this.ready === false) {
      await this.promise;
      if (this.ready === false) {
        throw new Error("You forgot to compile");
      }
    }
    return this.checkSync(userAnswer);
  }

  checkSync(userAnswer: string): boolean {
    if (this.ready === false) {
      throw new Error("You forgot to compile");
    }
    const processedUser = preprocess(userAnswer, this.preprocessors, this.config);
    return this.options.has(processedUser);
  }

  private executeCompile() {
    const queue: string[] = [this.word];
    const visited = new Set<string>();

    const checkVariant: LowestCheckFunction = (variant: string): boolean => {
      const trimmed = variant.trim();
      this.options.add(trimmed);
      if (!visited.has(variant)) {
        queue.push(variant);
      }
      return false;
    };

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      for (let i = 0; i < this.modules.length; i++) {
        this.modules[i].check(current, checkVariant, this.config);
      }
    }

    this.ready = true;
    this.log(this.options);
  }

  compileSync() {
    this.executeCompile();
  }

  compile() {
    this.promise = new Promise<void>((resolve) => {
      queueMicrotask(() => {
        this.executeCompile();
        resolve();
      });
    });
  }
}

export { WordChecker as wordChecker };
