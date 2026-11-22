---
description: "TypeScript interfaces, enums, migration helpers, and backwards-compatible Dutch aliases."
icon: code
---

# Types & Utilities

All core types, enums, and migration utilities are exported directly from the root `@siemsiem/learnlib` entrypoint.

## Enums

### `Grade`

Represents the quality of a learner's response:

```typescript
export enum Grade {
  Incorrect = 0,
  Hard = 1,
  Good = 2,
  Easy = 3,
}
```

### `Phase` (alias: `Fase`)

Indicates the learning stage of a card:

```typescript
export enum Phase {
  Learning = 0,
  Review = 1,
  NotIntroduced = 2,
}
```

- `Phase.Learning` (`0`): Card is currently being learned or relearned after an incorrect answer.
- `Phase.Review` (`1`): Card has been answered correctly and is in review.
- `Phase.NotIntroduced` (`2`): Card has not been introduced to the learner yet; call `session.markIntroduced()` before answering it.

---

## State & Card Interfaces

### `CardState` (alias: `KaartStaat`)

```typescript
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
```

### `CardSnapshot` (alias: `KaartSnapshot`)

```typescript
export interface CardSnapshot {
  cardId: string;
  date: Date;
  answer: string;
  grade: Grade;
}
```

### `LearnlibState`

Returned by `session.getSnapshot()` and emitted to `session.subscribe()` listeners:

```typescript
export interface LearnlibState {
  cards: CardState[];
  queue: CardState[];
  queueState: {
    current: CardState | null;
    isDone: boolean;
    initialCount: number;
    progress: number; // 0..1
  };
}
```

---

## `upgradeTools`

`upgradeTools` provides helpers for normalizing partial or legacy (Dutch-named) card objects into valid `CardState` instances and for scheduling word introductions across a study plan.

### Card Normalization

```typescript
import { upgradeTools } from "@siemsiem/learnlib";

const card = upgradeTools.upgradeCard({
  id: "1",
  vraag: "Wat betekent 'ubiquitous'?", // Legacy Dutch field automatically mapped to `question`
  antwoord: "alomtegenwoordig",        // Legacy Dutch field automatically mapped to `answer`
});
```

- `upgradeTools.upgradeCard(card)` — normalizes a partial or legacy card object into a full `CardState`.
- `upgradeTools.upgradeList(card)` — alias for `upgradeCard(card)`.

### Introduction Planning

Schedule a deck of cards to be gradually introduced over time. Both helpers return a new `CardState[]` array with every card's `phase` set to `Phase.NotIntroduced` and `nextReview` set to its scheduled introduction date:

```typescript
import { upgradeTools } from "@siemsiem/learnlib";

// Spread cards evenly over a 14-day study window with a 3-day cooldown before the deadline
const plannedByDeadline = upgradeTools.scheduleIntroductions(cards, {
  days: 14,
  cooldown: 3,
  startDate: new Date(), // optional, defaults to now
});

// Or introduce a fixed number of new cards per day
const plannedByRate = upgradeTools.scheduleIntroductionsSimple(cards, {
  countPerDay: 10,
  startDate: new Date(), // optional, defaults to now
});
```

- `upgradeTools.scheduleIntroductions(cards, options)` — spreads `cards` across `Math.max(1, Math.ceil(options.days - options.cooldown))` learning days (at least 1 card per day) and delegates to `scheduleIntroductionsSimple()`.
  - `options.days` (`number`): Total number of days available before the target date/exam.
  - `options.cooldown` (`number`): Number of review-only days at the end with no new introductions.
  - `options.startDate` (`Date`, optional): Start date for scheduling (defaults to `new Date()`).
- `upgradeTools.scheduleIntroductionsSimple(cards, options)` — marks all cards as `Phase.NotIntroduced` and schedules `countPerDay` cards per day starting from `startDate` (defaults to `new Date()`).
  - `options.countPerDay` (`number`): Number of cards to introduce per day.
  - `options.startDate` (`Date`, optional): Start date for scheduling (defaults to `new Date()`).

<details>
<summary>Dutch Backwards-Compatibility Exports</summary>

For compatibility with earlier versions of LearnLib, the following Dutch type and value aliases are exported:

- **Types:** `KaartStaat` (`CardState`), `KaartSnapshot` (`CardSnapshot`), `KaartWachtrij` (`CardQueue`), `LeerMethode` (`LearningMethod`), `WachtrijUpdater` (`QueueUpdater`), `Fase` (`Phase`)
- **Modules & Collections:** `simpleMethode` (`SimpleMethod`), `simpleWachtrij` (`SimpleQueueUpdater`), `methodes` (`methods`), `wachtrijUpdaters` (`queueUpdaters`)
- **State Snapshot Fields:** `lijst` (`cards`), `wachtrij` (`queue`), `wachtrijState` (`queueState` with `isKlaar` alias for `isDone`)
</details>
