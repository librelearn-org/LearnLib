import { multiLangString } from "./types";

export type SchemaField =
  | { type: "boolean"; default: boolean; label?: string | multiLangString; description?: string | multiLangString }
  | { type: "number"; default: number; min?: number; max?: number; step?: number; label?: string | multiLangString; description?: string | multiLangString }
  | { type: "string"; default: string; maxLength?: number; pattern?: string; label?: string | multiLangString; description?: string | multiLangString }
  | { type: "select"; options: readonly string[]; default: string; label?: string | multiLangString; description?: string | multiLangString }
  | { type: "array"; items: "string" | "number" | "boolean"; default?: any[]; label?: string | multiLangString; description?: string | multiLangString };

export type ModuleSchema = Record<string, SchemaField>;

/**
 * Automatically derives the static TypeScript type from the runtime schema definition.
 */
export type InferConfig<S extends ModuleSchema> = {
  [K in keyof S]:
    S[K] extends { type: "boolean" } ? boolean :
    S[K] extends { type: "number" } ? number :
    S[K] extends { type: "string" } ? string :
    S[K] extends { type: "select"; options: readonly (infer O)[] } ? O :
    S[K] extends { type: "array"; items: "number" } ? number[] :
    S[K] extends { type: "array"; items: "boolean" } ? boolean[] :
    S[K] extends { type: "array" } ? string[] :
    never;
};

/**
 * Extracts default values from a module schema.
 */
export function extractDefaults<S extends ModuleSchema>(schema: S): InferConfig<S> {
  const res: any = {};
  for (const [key, field] of Object.entries(schema)) {
    res[key] = (field as any).default !== undefined ? (field as any).default : undefined;
  }
  return res as InferConfig<S>;
}

/**
 * Helper to deep merge partial config updates into an existing config object.
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T> | Record<string, any>): T {
  if (!source || typeof source !== "object") return target;
  const result: any = { ...(target ?? {}) };
  for (const key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    const val = (source as any)[key];
    if (val !== undefined) {
      if (typeof val === "object" && val !== null && !Array.isArray(val) && typeof result[key] === "object" && result[key] !== null && !Array.isArray(result[key])) {
        result[key] = deepMerge(result[key], val);
      } else {
        result[key] = val;
      }
    }
  }
  return result as T;
}
