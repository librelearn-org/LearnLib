import { BaseModule } from "../types";
import { ModuleSchema } from "../configSystem";

export interface CheckConfig {
  caseSensitive?: boolean;
  stripAccents?: boolean;
  greekLetters?: boolean;
  allowOptionalAnswerParts?: boolean;
  alternativeAnswers?: {
    allow?: boolean;
    mode?: "onlySingleWord" | "both" | "onlySentence";
  };
}

export const goodDefaults: Required<CheckConfig> = {
  caseSensitive: false,
  stripAccents: false,
  greekLetters: true,
  allowOptionalAnswerParts: true,
  alternativeAnswers: {
    allow: true,
    mode: "both",
  },
};

export type LowestCheckFunction = (correctAnswerVariant: string) => boolean;

export interface CheckModule<TSchema extends ModuleSchema = any> extends BaseModule<TSchema> {
  type?: "checker";
  check(answer: string, callback: LowestCheckFunction, config?: CheckConfig): boolean;
}

export interface Preprocessor<TSchema extends ModuleSchema = any> extends BaseModule<TSchema> {
  type?: "preprocessor";
  preprocess(inputString: string, config?: CheckConfig): string;
}

export type Preprocessors = Preprocessor;
