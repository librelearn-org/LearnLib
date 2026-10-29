---
description: "Build custom learning methods, answer checkers, preprocessors, graders, and queue updaters."
icon: puzzle-piece
---

# Creating a Module

If you want to extend LearnLib without modifying its core codebase, you can create and register your own module.

## Choosing the Right Module Type

Select the module interface that matches the stage of the review lifecycle you want to customize:

| Module Type (`type`) | Interface | When to Use |
|---|---|---|
| `"method"` | `LearningMethod` | Add a new spaced repetition or scheduling algorithm (e.g., Leitner boxes, SM-2) |
| `"checker"` | `CheckModule` | Add new syntax rules to expected answers (e.g., `a | b` or synonym expansion) |
| `"preprocessor"` | `Preprocessor` | Normalize both expected and user answers before checking (e.g., punctuation stripping) |
| `"gradeMaker"` | `GradeMaker` | Compute `Grade` (`0..3`) based on correctness and response speed (`start` -> `now`) |
| `"queueUpdater"` | `QueueUpdater` | Control how cards are removed, repeated, or reordered in `state.queue` |

---

## Step-by-Step: Implementing Each Module Type

{% tabs %}
{% tab title="Checker Module" %}
A `CheckModule` inspects `answer` and passes transformed candidate strings to `callback(variant)`. If `callback(variant)` returns `true`, the checker should immediately return `true`.

```typescript
import {
  type CheckModule,
  type CheckConfig,
  type LowestCheckFunction,
  extractDefaults,
  globalModuleTracker,
} from "@siemsiem/learnlib";

export const pipeAlternativeSchema = {
  allow: {
    type: "boolean",
    default: true,
    label: { EN: "Allow pipe alternatives", NL: "Sta '|' alternatieven toe" },
  },
} as const;

export class PipeAlternativeModule implements CheckModule<typeof pipeAlternativeSchema> {
  type = "checker" as const;
  id = "pipeAlternative";
  name = { EN: "Pipe Alternatives", NL: "Pipe-alternatieven" };
  description = {
    EN: "Allow alternative answers separated by '|'",
    NL: "Sta alternatieve antwoorden gescheiden door '|' toe",
  };
  schema = pipeAlternativeSchema;
  config = extractDefaults(pipeAlternativeSchema);

  check(answer: string, callback: LowestCheckFunction, _config?: CheckConfig): boolean {
    if (!this.config.allow || !answer.includes("|")) {
      return false;
    }
    for (const part of answer.split("|")) {
      const trimmed = part.trim();
      if (trimmed && trimmed !== answer && callback(trimmed)) {
        return true;
      }
    }
    return false;
  }
}

globalModuleTracker.register(new PipeAlternativeModule());
```
{% endtab %}

{% tab title="Preprocessor" %}
A `Preprocessor` transforms a single string (`preprocess(inputString, config)`) before variant expansion begins.

```typescript
import { type Preprocessor, type CheckConfig, globalModuleTracker } from "@siemsiem/learnlib";

export class StripPunctuationPreprocessor implements Preprocessor {
  type = "preprocessor" as const;
  id = "stripPunctuation";
  name = { EN: "Strip Punctuation", NL: "Interpunctie negeren" };
  description = {
    EN: "Removes punctuation marks from answers",
    NL: "Verwijdert leestekens uit antwoorden",
  };

  preprocess(inputString: string, _config?: CheckConfig): string {
    return inputString.replace(/[.,!?;:]/g, "").replace(/\s+/g, " ").trim();
  }
}

globalModuleTracker.register(new StripPunctuationPreprocessor());
```
{% endtab %}

{% tab title="Learning Method" %}
A `LearningMethod` updates `lastReviewed`, `nextReview`, and `metadata` on a `CardState` when `reviewCard` is called.

```typescript
import {
  type LearningMethod,
  type CardState,
  Grade,
  globalModuleTracker,
} from "@siemsiem/learnlib";

export class LeitnerMethod implements LearningMethod {
  type = "method" as const;
  id = "leitner";
  name = { EN: "Leitner Box System", NL: "Leitner-systeem" };
  description = {
    EN: "Doubles the review interval for each box promotion",
    NL: "Verdubbelt het herhalingsinterval bij elke promotie",
  };

  reviewCard(card: CardState, grade: Grade, now: Date = new Date()): CardState {
    const prevBox = Number(card.metadata?.box ?? 1);
    const nextBox = grade === Grade.Incorrect ? 1 : Math.min(prevBox + 1, 5);
    const intervalDays = Math.pow(2, nextBox - 1);

    return {
      ...card,
      lastReviewed: now,
      nextReview: new Date(now.getTime() + intervalDays * 86_400_000),
      metadata: { ...card.metadata, box: nextBox },
    };
  }

  filterQueueItem(item: CardState): boolean {
    return (item.metadata?.box ?? 1) >= 5;
  }
}

globalModuleTracker.register(new LeitnerMethod());
```
{% endtab %}

{% tab title="GradeMaker" %}
A `GradeMaker` uses `correct`, `start`, and `now` to compute a `Grade` (`Incorrect`, `Hard`, `Good`, or `Easy`).

```typescript
import { type GradeMaker, Grade, globalModuleTracker } from "@siemsiem/learnlib";

export class SpeedGradeMaker implements GradeMaker {
  type = "gradeMaker" as const;
  id = "speed";
  name = { EN: "Speed Grader", NL: "Snelheidsbeoordelaar" };
  description = {
    EN: "Grades answers based on response time",
    NL: "Beoordeelt antwoorden op basis van reactietijd",
  };

  grade(correct: boolean, start: Date, now: Date, overwrite?: Grade): Grade {
    if (overwrite !== undefined) return overwrite;
    if (!correct) return Grade.Incorrect;

    const elapsedMs = now.getTime() - start.getTime();
    if (elapsedMs < 3000) return Grade.Easy;
    if (elapsedMs < 8000) return Grade.Good;
    return Grade.Hard;
  }
}

globalModuleTracker.register(new SpeedGradeMaker());
```
{% endtab %}

{% tab title="QueueUpdater" %}
A `QueueUpdater` returns an updated `LearnlibState` with the modified `queue` array after each review.

```typescript
import {
  type QueueUpdater,
  type LearnlibState,
  type CardState,
  Grade,
  globalModuleTracker,
} from "@siemsiem/learnlib";

export class MoveFailedToEndQueueUpdater implements QueueUpdater {
  type = "queueUpdater" as const;
  id = "moveToEnd";
  name = { EN: "Move Failed to End", NL: "Foute kaarten achteraan" };
  description = {
    EN: "Appends failed cards to the end of the queue",
    NL: "Plaatst foute kaarten achteraan in de wachtrij",
  };

  updateQueue(state: LearnlibState, card: CardState, grade: Grade): LearnlibState {
    const remaining = state.queue.filter((c) => c.id !== card.id);
    if (grade === Grade.Incorrect) {
      remaining.push(card);
    }
    return { ...state, queue: remaining };
  }
}

globalModuleTracker.register(new MoveFailedToEndQueueUpdater());
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Once registered in `globalModuleTracker`, you can reference your custom module by its `id` string when constructing `new Learnlib({ cards, method: "leitner", grader: "speed", queueUpdater: "moveToEnd" })`.
{% endhint %}
