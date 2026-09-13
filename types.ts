import type { ModuleSchema, InferConfig } from "./configSystem";
import type { CheckConfig } from "./checker/shared";

export enum Grade {
  Incorrect = 0,
  Hard = 1,
  Good = 2,
  Easy = 3,
}

export enum Phase {
  Learning = 0,
  Review = 1,
}

export type multiLangString = {
  EN: string;
  NL?: string;
} | {
  NL: string;
  EN?: string;
};

export interface CardSnapshot {
  cardId: string;
  date: Date;
  answer: string;
  grade: Grade;
}

export interface CardState {
  id: string;
  question: string;
  answer: string;
  phase: Phase;
  methodId: string;
  lastReviewed: Date;
  nextReview: Date;
  history: CardSnapshot[];
  metadata: Record<string, any>;
}

export type CardQueue = CardState[];

export type ModuleType = "method" | "queueUpdater" | "gradeMaker" | "checker" | "preprocessor";

export interface BaseModule<TSchema extends ModuleSchema = any> {
  id: string;
  type?: ModuleType;
  name: string | multiLangString;
  description: string | multiLangString;
  aboutLink?: string;
  schema?: TSchema;
  config?: InferConfig<TSchema>;
}

export interface LearningMethod<TSchema extends ModuleSchema = any> extends BaseModule<TSchema> {
  type?: "method";
  reviewCard(card: CardState, grade: Grade, now?: Date, state?: LearnlibState): CardState;
  filterQueueItem(item: CardState): boolean;
}

export interface QueueUpdater<TSchema extends ModuleSchema = any> extends BaseModule<TSchema> {
  type?: "queueUpdater";
  updateQueue(state: LearnlibState, card: CardState, grade: Grade): LearnlibState;
}

export interface GradeMaker<TSchema extends ModuleSchema = any> extends BaseModule<TSchema> {
  type?: "gradeMaker";
  grade(correct: boolean, start: Date, now: Date, overwrite?: Grade): Grade;
}

export interface LearnlibState {
  cards: CardState[];
  queue: CardState[];
  queueState: {
    current: CardState | null;
    isDone: boolean;
    initialCount: number;
    progress: number;
  };
}

export interface LearnlibOptions {
  cards: CardState[] | LearnlibState;
  method?: LearningMethod | string;
  grader?: GradeMaker | string;
  queueUpdater?: QueueUpdater | string;
  checkConfig?: CheckConfig;
  configs?: Record<string, any>;
}

export type { ModuleSchema, InferConfig, SchemaField } from "./configSystem";
