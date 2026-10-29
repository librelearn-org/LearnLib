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
}
```

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

`upgradeTools` normalizes partial or legacy (Dutch-named) card objects into valid `CardState` instances with initialized `Date` fields and `history` arrays:

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

<details>
<summary>Dutch Backwards-Compatibility Exports</summary>

For compatibility with earlier versions of LearnLib, the following Dutch type and value aliases are exported:

- **Types:** `KaartStaat` (`CardState`), `KaartSnapshot` (`CardSnapshot`), `KaartWachtrij` (`CardQueue`), `LeerMethode` (`LearningMethod`), `WachtrijUpdater` (`QueueUpdater`), `Fase` (`Phase`)
- **Modules & Collections:** `simpleMethode` (`SimpleMethod`), `simpleWachtrij` (`SimpleQueueUpdater`), `methodes` (`methods`), `wachtrijUpdaters` (`queueUpdaters`)
- **State Snapshot Fields:** `lijst` (`cards`), `wachtrij` (`queue`), `wachtrijState` (`queueState` with `isKlaar` alias for `isDone`)
</details>
