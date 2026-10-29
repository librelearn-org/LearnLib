---
description: "Practical patterns for initializing sessions, grading answers, persisting state, and connecting Learnlib to UI frameworks."
icon: play
---

# Using the Learnlib Class

The `Learnlib` class is the heart of the library. It holds your deck (`cards`), manages the active study queue (`queue`), tracks response timing, coordinates all modules during `answer()`, and broadcasts immutable state snapshots to subscribers.

---

## 1. Initializing a Session

You can construct a `Learnlib` instance in three ways depending on your setup:

{% tabs %}
{% tab title="Options Object (Recommended)" %}
Pass a `LearnlibOptions` object to configure your cards, active modules, checker rules, and per-module settings in one place:

```typescript
import { Learnlib, goodDefaults } from "@siemsiem/learnlib";

const session = new Learnlib({
  cards: [
    { id: "1", question: "Capital of Japan?", answer: "Tokyo" },
    { id: "2", question: "Largest ocean?", answer: "(the) Pacific (Ocean)" },
  ],
  method: "fsrs",
  grader: "basic",
  queueUpdater: "simple",
  checkConfig: {
    ...goodDefaults,
    stripAccents: true,
  },
  configs: {
    fsrs: { targetRecall: 0.92 },
  },
});
```
{% endtab %}

{% tab title="Positional Arguments" %}
Pass arguments positionally if you prefer a compact call or want to inject custom module instances directly:

```typescript
import {
  Learnlib,
  FsrsMethod,
  VerySimpleGradeMaker,
  SimpleQueueUpdater,
} from "@siemsiem/learnlib";

const session = new Learnlib(
  cards,
  new FsrsMethod(),
  new VerySimpleGradeMaker(),
  new SimpleQueueUpdater(),
  { stripAccents: true },
  { fsrs: { targetRecall: 0.9 } }
);
```
{% endtab %}

{% tab title="Minimal (All Defaults)" %}
Pass just an array of cards to use the default `"simple"` method, `"basic"` grader, and `"simple"` queue updater:

```typescript
import Learnlib from "@siemsiem/learnlib";

const session = new Learnlib([
  { id: "1", question: "2 + 2", answer: "4" } as any,
]);
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
When you pass an array of cards, `Learnlib` automatically runs `upgradeTools.upgradeCard()` on every item, shuffles the initial `queue`, sets `current` to `queue[0]`, and stamps `card.methodId = this.method.id` on any card that does not yet have a `methodId`.
{% endhint %}

---

## 2. Answering Cards & Overriding Grades

During a study session, read `session.current` (or `session.getSnapshot().queueState.current`) to display the prompt, and call `session.answer()` when the user submits a response.

### Standard Answer Check

```typescript
// Checks user input against session.current.answer using active preprocessors & checkers
session.answer(userInput);
```

### Manual Grade Overwrite (`gradeOverwrite`)

Sometimes you want to bypass or override the automatic grader — for example:
- Implementing an **"I was right / Override typo"** button after a failed check.
- Building **self-graded flashcards** (flip card -> click *Again*, *Hard*, *Good*, or *Easy*).
- Providing `Grade.Hard` or `Grade.Easy` ratings to `FsrsMethod` when using `VerySimpleGradeMaker`.

```typescript
import { Grade } from "@siemsiem/learnlib";

// Force Grade.Easy regardless of whether the typed string matched
session.answer(userInput, Grade.Easy);

// Force Grade.Incorrect even if the answer text matched
session.answer(userInput, Grade.Incorrect);
```

### Per-Question Checker Override (`checkConfigOverride`)

If a specific card requires stricter or looser checking rules than the session default (for example, a case-sensitive chemical symbol or programming token), pass a `CheckConfig` as the third argument:

```typescript
// Enforce case sensitivity for this answer only
session.answer(userInput, undefined, {
  ...session.checkConfig,
  caseSensitive: true,
});
```

---

## 3. Saving & Restoring Session State

Because `new Learnlib()` accepts an existing `LearnlibState` snapshot as its `cards` input, you can persist an in-progress session to `localStorage` or a database and resume it later without losing progress or reshuffling the remaining queue.

{% stepper %}
{% step %}
## Serialize the current state

Save `session.getSnapshot()` (and optionally `session.exportConfigJson()`) whenever state updates:

```typescript
session.subscribe((state) => {
  localStorage.setItem("learnlib_state", JSON.stringify(state));
  localStorage.setItem("learnlib_configs", session.exportConfigJson());
});
```
{% endstep %}

{% step %}
## Restore the session from saved state

Pass the parsed `LearnlibState` object back into `new Learnlib()`. `Learnlib` detects `queueState`, upgrades serialized date strings back into `Date` instances via `upgradeTools.upgradeCard()`, and preserves `initialCount`, `queue` order, and `current`:

```typescript
import { Learnlib } from "@siemsiem/learnlib";

const rawState = localStorage.getItem("learnlib_state");
const rawConfigs = localStorage.getItem("learnlib_configs");

const restoredSession = new Learnlib({
  cards: rawState ? JSON.parse(rawState) : initialCards,
  method: "fsrs",
  configs: rawConfigs ? JSON.parse(rawConfigs) : undefined,
});

console.log(restoredSession.getSnapshot().queueState.progress);
```
{% endstep %}
{% endstepper %}

---

## 4. UI Framework Integration

`session.subscribe` and `session.getSnapshot` are arrow-function properties bound to the `Learnlib` instance. `getSnapshot()` returns a cached `LearnlibState` reference that only changes when state mutates (`answer()`, `reshuffle()`, or `reset()`), making it directly compatible with React's `useSyncExternalStore`.

{% tabs %}
{% tab title="React" %}
```tsx
import { useSyncExternalStore, useState } from "react";
import { Learnlib, Grade } from "@siemsiem/learnlib";

export function FlashcardTrainer({ session }: { session: Learnlib }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [input, setInput] = useState("");

  const { current, isDone, progress } = state.queueState;

  if (isDone || !current) {
    return (
      <div>
        <h2>Session Complete!</h2>
        <button onClick={() => session.reset()}>Study Again</button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    session.answer(input);
    setInput("");
  };

  return (
    <div>
      <progress value={progress} max={1} />
      <h3>{current.question}</h3>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
        />
        <button type="submit">Check</button>
      </form>
      <button onClick={() => session.answer(current.answer, Grade.Easy)}>
        Mark as Easy
      </button>
    </div>
  );
}
```
{% endtab %}

{% tab title="Svelte" %}
```typescript
import { readable } from "svelte/store";
import type { Learnlib, LearnlibState } from "@siemsiem/learnlib";

export function createLearnlibStore(session: Learnlib) {
  const state = readable<LearnlibState>(session.getSnapshot(), (set) => {
    return session.subscribe(set);
  });

  return {
    subscribe: state.subscribe,
    answer: (input: string) => session.answer(input),
    reshuffle: () => session.reshuffle(),
    reset: () => session.reset(),
  };
}
```
{% endtab %}

{% tab title="Vanilla TypeScript" %}
```typescript
import { Learnlib } from "@siemsiem/learnlib";

const session = new Learnlib({ cards });

function render(state = session.getSnapshot()) {
  const { current, isDone, progress } = state.queueState;
  document.querySelector("#progress")!.textContent = `${Math.round(progress * 100)}%`;

  if (isDone || !current) {
    document.querySelector("#question")!.textContent = "All done!";
    return;
  }
  document.querySelector("#question")!.textContent = current.question;
}

session.subscribe(render);
render();
```
{% endtab %}
{% endtabs %}

---

## 5. Managing the Queue, History & Switching Methods

### `reshuffle()` vs. `reset()`

{% columns %}
{% column %}
### `session.reshuffle()`

Shuffles only the cards **currently remaining** in `session.queue`, updates `session.current` to the new front card, resets the response timer, and notifies subscribers. Already-completed cards are not re-added.
{% endcolumn %}

{% column %}
### `session.reset()`

Copies all cards from `session.cards` back into `session.queue` and calls `reshuffle()`. Note that card `metadata` (such as FSRS stability or `learned: true`) and `history` remain on the cards unless you clear them explicitly.
{% endcolumn %}
{% endcolumns %}

### Inspecting Review History

LearnLib records a `CardSnapshot` on every call to `session.answer()` in two places:

1. **`session.history`**: Every review performed during the current session in chronological order.
2. **`card.history`**: Every review performed on that specific card across sessions.

```typescript
const lastAttempt = session.history.at(-1);
if (lastAttempt) {
  console.log({
    cardId: lastAttempt.cardId,
    typedAnswer: lastAttempt.answer,
    grade: lastAttempt.grade, // Grade.Incorrect (0) .. Grade.Easy (3)
    reviewedAt: lastAttempt.date,
  });
}
```

### Switching Learning Methods on Existing Cards

To prevent accidentally corrupting scheduling metadata, `Learnlib` verifies that `card.methodId === this.method.id` on startup and throws an error if they differ:

```text
Error: Card methodId 'simple' does not match active method 'fsrs'
```

If a user switches a deck from `"simple"` to `"fsrs"`, migrate the cards' `methodId` before instantiating `Learnlib`:

```typescript
const migratedCards = existingCards.map((card) => ({
  ...card,
  methodId: "fsrs",
}));

const session = new Learnlib({
  cards: migratedCards,
  method: "fsrs",
});
```
