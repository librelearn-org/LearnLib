import { BaseModule, GradeMaker, LearningMethod, ModuleType, QueueUpdater } from "./types";
import { CheckModule, Preprocessor } from "./checker/shared";
import { SimpleMethod } from "./methods/simple";
import { FsrsMethod } from "./methods/fsrs";
import { VerySimpleGradeMaker } from "./gradeMakers/verySimple";
import { SimpleQueueUpdater } from "./queueUpdaters/simple";
import { OptionalAnswerPartsModule } from "./checker/modules/optionalAnswerParts";
import { AlternativeAnswersModule } from "./checker/modules/alternativeAnswers";
import { CaseInsensitivePreprocessor } from "./checker/preprocessors/notCaseSensitive";
import { StripAccentsPreprocessor } from "./checker/preprocessors/stripAccents";
import { GreekPreprocessor } from "./checker/preprocessors/greek";
import { deepMerge } from "./configSystem";

export type Module = LearningMethod | QueueUpdater | GradeMaker | CheckModule | Preprocessor;
export type LearnlibModule = Module;

export interface GuiConfigSection {
  id: string;
  type?: ModuleType;
  name: string | any;
  description: string | any;
  aboutLink?: string;
  schema: Record<string, any>;
  config: Record<string, any>;
}

export class ModuleSystem {
  private modules: Map<string, Module> = new Map();

  constructor(registerDefaults: boolean = false) {
    if (registerDefaults) {
      this.registerDefaults();
    }
  }

  private getKey(id: string, type?: ModuleType): string {
    return type ? `${type}:${id}` : id;
  }

  public registerDefaults(): this {
    this.register(
      new SimpleMethod(),
      new FsrsMethod(),
      new VerySimpleGradeMaker(),
      new SimpleQueueUpdater(),
      new OptionalAnswerPartsModule(),
      new AlternativeAnswersModule(),
      new CaseInsensitivePreprocessor(),
      new StripAccentsPreprocessor(),
      new GreekPreprocessor()
    );
    return this;
  }

  public register(...modules: (Module | Module[])[]): this {
    for (const item of modules) {
      if (Array.isArray(item)) {
        for (const m of item) {
          this.registerSingle(m);
        }
      } else {
        this.registerSingle(item);
      }
    }
    return this;
  }

  private registerSingle(module: Module): void {
    if (!module || typeof module !== "object" || !module.id) {
      throw new Error("Module must have a valid 'id'");
    }
    const key = this.getKey(module.id, module.type);
    this.modules.set(key, module);
  }

  public unregister(id: string, type?: ModuleType): boolean {
    if (type) {
      return this.modules.delete(this.getKey(id, type));
    }
    let deleted = false;
    for (const [k, m] of Array.from(this.modules.entries())) {
      if (m.id === id) {
        this.modules.delete(k);
        deleted = true;
      }
    }
    return deleted;
  }

  public has(id: string, type?: ModuleType): boolean {
    if (type) {
      return this.modules.has(this.getKey(id, type));
    }
    for (const m of this.modules.values()) {
      if (m.id === id) return true;
    }
    return false;
  }

  public get(id: string, type?: ModuleType): Module | undefined {
    if (type) {
      return this.modules.get(this.getKey(id, type));
    }
    for (const m of this.modules.values()) {
      if (m.id === id) return m;
    }
    return undefined;
  }

  public getOrThrow<T extends Module = Module>(id: string, expectedType?: ModuleType): T {
    if (expectedType) {
      const mod = this.modules.get(this.getKey(id, expectedType));
      if (mod) {
        return mod as T;
      }
      for (const m of this.modules.values()) {
        if (m.id === id) {
          throw new Error(`Module with id '${id}' has type '${m.type}', expected '${expectedType}'`);
        }
      }
      throw new Error(`Module with id '${id}' of type '${expectedType}' not found in module tracker`);
    }

    const mod = this.get(id);
    if (!mod) {
      throw new Error(`Module with id '${id}' not found in module tracker`);
    }
    return mod as T;
  }

  public getAll(): Module[] {
    return Array.from(this.modules.values());
  }

  public list(): Module[] {
    return this.getAll();
  }

  public listIds(): string[] {
    const ids = new Set<string>();
    for (const m of this.modules.values()) {
      ids.add(m.id);
    }
    return Array.from(ids);
  }

  public getByType<T extends ModuleType>(type: T): Extract<Module, { type?: T }>[] {
    return Array.from(this.modules.values()).filter(
      (m) => m.type === type
    ) as Extract<Module, { type?: T }>[];
  }

  public getMethods(): LearningMethod[] {
    return this.getByType("method") as LearningMethod[];
  }

  public getMethod(id: string): LearningMethod | undefined {
    return this.get(id, "method") as LearningMethod | undefined;
  }

  public getMethodes(): LearningMethod[] {
    return this.getMethods();
  }

  public getQueueUpdaters(): QueueUpdater[] {
    return this.getByType("queueUpdater") as QueueUpdater[];
  }

  public getQueueUpdater(id: string): QueueUpdater | undefined {
    return this.get(id, "queueUpdater") as QueueUpdater | undefined;
  }

  public getWachtrijUpdaters(): QueueUpdater[] {
    return this.getQueueUpdaters();
  }

  public getWachtrijUpdater(id: string): QueueUpdater | undefined {
    return this.getQueueUpdater(id);
  }

  public getGradeMakers(): GradeMaker[] {
    return this.getByType("gradeMaker") as GradeMaker[];
  }

  public getGradeMaker(id: string): GradeMaker | undefined {
    return this.get(id, "gradeMaker") as GradeMaker | undefined;
  }

  public getCheckerModules(): CheckModule[] {
    return this.getByType("checker") as CheckModule[];
  }

  public getCheckerModule(id: string): CheckModule | undefined {
    return this.get(id, "checker") as CheckModule | undefined;
  }

  public getPreprocessors(): Preprocessor[] {
    return this.getByType("preprocessor") as Preprocessor[];
  }

  public getPreprocessor(id: string): Preprocessor | undefined {
    return this.get(id, "preprocessor") as Preprocessor | undefined;
  }

  public getGuiConfigList(): GuiConfigSection[] {
    return this.getAll().map((mod) => ({
      id: mod.id,
      type: mod.type,
      name: mod.name,
      description: mod.description,
      aboutLink: mod.aboutLink,
      schema: mod.schema ?? {},
      config: mod.config ?? {},
    }));
  }

  public getConfig<T = any>(id: string, type?: ModuleType): T | undefined {
    const mod = this.get(id, type);
    return mod?.config as T | undefined;
  }

  public setConfig<T = any>(id: string, config: Partial<T>, type?: ModuleType): this {
    if (type) {
      const mod = this.modules.get(this.getKey(id, type));
      if (mod) {
        mod.config = deepMerge(mod.config ?? {}, config);
      }
      return this;
    }
    for (const mod of this.modules.values()) {
      if (mod.id === id) {
        mod.config = deepMerge(mod.config ?? {}, config);
      }
    }
    return this;
  }

  public exportConfigJson(pretty: boolean = false): string {
    const dump: Record<string, any> = {};
    for (const mod of this.getAll()) {
      if (mod.config && Object.keys(mod.config).length > 0) {
        dump[mod.id] = mod.config;
      }
    }
    return pretty ? JSON.stringify(dump, null, 2) : JSON.stringify(dump);
  }

  public importConfigJson(json: string | Record<string, any>): this {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    if (parsed && typeof parsed === "object") {
      for (const [id, cfg] of Object.entries(parsed)) {
        this.setConfig(id, cfg as any);
      }
    }
    return this;
  }

  public clear(): void {
    this.modules.clear();
  }

  public reset(): this {
    this.clear();
    this.registerDefaults();
    return this;
  }
}

declare global {
  interface Window {
    LEARNLIB_MODULE_API?: ModuleSystem;
  }
}

export const globalModuleTracker = new ModuleSystem(true);
if (typeof window !== "undefined") {
  window.LEARNLIB_MODULE_API = globalModuleTracker;
}
export const moduleTracker = globalModuleTracker;
export { ModuleSystem as moduleSystem };
export type { BaseModule, ModuleType };
