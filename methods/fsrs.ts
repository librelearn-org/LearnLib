import { CardState, Grade, LearningMethod } from "../types";
import { extractDefaults, InferConfig } from "../configSystem";

const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925,
  1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];

export type days = number;

const F: number = 19.0 / 81.0;
const C: number = -0.5;

export function initialDifficulty(g: Grade): number {
  const gNum = g as number; // 0..3
  const d = W[4] - Math.exp(W[5] * gNum) + 1.0;
  return Math.min(Math.max(d, 1.0), 10.0);
}

export function initialStability(g: Grade): number {
  return W[g as number]; // W[0..3]
}

function deltaD(g: Grade): number {
  const gNum = g as number; // 0..3
  return -W[6] * (gNum - 2.0);
}

function dp(d: number, g: Grade): number {
  return d + deltaD(g) * ((10.0 - d) / 9.0);
}

export function calculateDifficulty(d: number, g: Grade): number {
  const defaultD0 = initialDifficulty(Grade.Good);
  const next = W[7] * defaultD0 + (1.0 - W[7]) * dp(d, g);
  return Math.min(Math.max(next, 1.0), 10.0);
}

export function calculateRetrievability(t: days, s: number): number {
  return Math.pow(1.0 + F * (t / s), C);
}

export function calculateNextReview(r_d: number, s: number): days {
  return (s / F) * (Math.pow(r_d, 1.0 / C) - 1.0);
}

export function stabilityOnGood(d: number, s: number, r: number, g: Grade): number {
  const t_d = 11.0 - d;
  const t_s = Math.pow(s, -W[9]);
  const t_r = Math.exp(W[10] * (1.0 - r)) - 1.0;
  const h = g === Grade.Hard ? W[15] : 1.0;
  const b = g === Grade.Easy ? W[16] : 1.0;
  const c = Math.exp(W[8]);
  const alpha = 1.0 + t_d * t_s * t_r * h * b * c;
  return s * alpha;
}

export function stabilityOnFailure(d: number, s: number, r: number): number {
  const d_f = Math.pow(d, -W[12]);
  const s_f = Math.pow(s + 1.0, W[13]) - 1.0;
  const r_f = Math.exp(W[14] * (1.0 - r));
  const c_f = W[11];
  const s_new = d_f * s_f * r_f * c_f;
  return Math.max(0.1, Math.min(s_new, s));
}

export function calculateStability(d: number, s: number, r: number, g: Grade): number {
  if (g === Grade.Incorrect) {
    return stabilityOnFailure(d, s, r);
  }
  return stabilityOnGood(d, s, r, g);
}

export const fsrsSchema = {
  targetRecall: {
    type: "number",
    default: 0.9,
    min: 0.7,
    max: 0.99,
    step: 0.01,
    label: {
      EN: "Target Recall Rate",
      NL: "Doelherinneringspercentage",
    },
    description: {
      EN: "Target retention probability at the next scheduled review (0.7 to 0.99)",
      NL: "Doelkans om een kaart te onthouden bij de volgende geplande herhaling (0.7 tot 0.99)",
    },
  },
} as const;

export type FsrsConfig = InferConfig<typeof fsrsSchema>;

export class FsrsMethod implements LearningMethod<typeof fsrsSchema> {
  type = "method" as const;
  id = "fsrs";
  name = {
    EN: "FSRS (Long-term retention)",
    NL: "FSRS (Langetermijngeheugen)",
  };
  description = {
    EN: "Free Spaced Repetition Scheduler for optimized long-term memory",
    NL: "FSRS-algoritme voor geoptimaliseerd langetermijngeheugen",
  };

  schema = fsrsSchema;
  config = extractDefaults(fsrsSchema);

  filterQueueItem(item: CardState): boolean {
    return true;
  }

  reviewCard(card: CardState, g: Grade, now: Date = new Date()): CardState {
    const targetR = this.config.targetRecall ?? 0.9;
    const metadata = card.metadata ?? {};
    const isFirstTime = metadata.stability === undefined && metadata.stabielheid === undefined;

    let nextS: number;
    let nextD: number;

    if (isFirstTime) {
      nextS = initialStability(g);
      nextD = initialDifficulty(g);
    } else {
      const previousS: number = metadata.stability ?? metadata.stabielheid;
      const previousD: number = metadata.difficulty ?? metadata.moeilijkheid;
      const lastDate = card.lastReviewed ?? now;
      const elapsedDays = Math.max(
        0,
        Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      const r = calculateRetrievability(elapsedDays, previousS);
      nextS = calculateStability(previousD, previousS, r, g);
      nextD = calculateDifficulty(previousD, g);
    }

    const interval = Math.max(Math.round(calculateNextReview(targetR, nextS)), 1.0);
    const nextDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    return {
      ...card,
      lastReviewed: now,
      nextReview: nextDate,
      metadata: {
        ...metadata,
        stability: nextS,
        stabielheid: nextS,
        difficulty: nextD,
        moeilijkheid: nextD,
      },
    };
  }
}

export { FsrsMethod as fsrsMethod, FsrsMethod as fsrs };
