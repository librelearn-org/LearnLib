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

### Manual Grade Overwrite (`gradeOverwrite`) & Previewing Next Review Times

Sometimes you want to bypass or override the automatic grader — for example:
- Implementing an **"I was right / Override typo"** button after a failed check.
- Building **self-graded flashcards** (flip card -> pick a grade).
- Providing `Grade.Hard` or `Grade.Easy` ratings to `FsrsMethod` when using `VerySimpleGradeMaker`.

When building a custom grading UI, read `session.method.capabilities.supportedGrades` so you only render the grades supported by the active learning method (`SimpleMethod` supports `[Grade.Good, Grade.Incorrect]`, while `FsrsMethod` supports all four grades). If `session.method.capabilities.showNextLearnDate` is `true`, you can also call `session.previewTime()` to display the next scheduled review date for each grade:

```typescript
import { Grade } from "@siemsiem/learnlib";

// Only render buttons for grades supported by the active learning method
const supportedGrades = session.method.capabilities.supportedGrades;

// Optional: preview next review dates when supported (e.g., FsrsMethod)
const previews = session.method.capabilities.showNextLearnDate
  ? session.previewTime()
  : undefined;

// Submit a manual grade
session.answer(userInput, Grade.Easy);
```

### Introducing New Words (`Phase.NotIntroduced` & `markIntroduced()`)

LearnLib has built-in support for introducing new cards before testing them — no custom card `metadata` required.

1. Mark cards as `Phase.NotIntroduced` (either manually or using [`upgradeTools.scheduleIntroductions()`](../api-reference/types-and-utilities.md#introduction-planning) / `upgradeTools.scheduleIntroductionsSimple()`).
2. In your UI, check `current.phase === Phase.NotIntroduced` to show an introduction screen (displaying both `current.question` and `current.answer`).
3. When the learner clicks **Continue**, call `session.markIntroduced()`. This changes the card's `phase` to `Phase.Learning`, moves it further back in the queue (via `queueUpdater.introductionQueueMutator`), and advances to the next card.

```typescript
import { Learnlib, Phase, upgradeTools } from "@siemsiem/learnlib";

// Schedule cards for introduction (5 per day)
const plannedCards = upgradeTools.scheduleIntroductionsSimple(rawCards, {
  countPerDay: 5,
});

// Filter to cards due today and start a session
const session = new Learnlib({ cards: plannedCards, method: "fsrs" });

if (session.current?.phase === Phase.NotIntroduced) {
  // Show question + answer to the user, then mark as introduced:
  session.markIntroduced();
}
```

{% hint style="warning" %}
Calling `session.answer()` on a card whose `phase` is `Phase.NotIntroduced` logs a warning and returns without modifying state. Always call `session.markIntroduced()` first.
{% endhint %}

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

`session.subscribe` and `session.getSnapshot` are arrow-function properties bound to the `Learnlib` instance. `getSnapshot()` returns a cached `LearnlibState` reference that only changes when state mutates (`answer()`, `markIntroduced()`, `reshuffle()`, or `reset()`), making it directly compatible with React's `useSyncExternalStore`.

{% tabs %}
{% tab title="React" %}
```tsx
import { useSyncExternalStore, useState } from "react";
import { Learnlib, Grade, Phase } from "@siemsiem/learnlib";

export function FlashcardTrainer({ session }: { session: Learnlib }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [input, setInput] = useState("");

  const { current, isDone, progress } = state.queueState;
  const { capabilities } = session.method;

  if (isDone || !current) {
    return (
      <div>
        <h2>{capabilities.type === "spaced" ? "Done for today!" : "Session Complete!"}</h2>
        <button onClick={() => session.reset()}>Study Again</button>
      </div>
    );
  }

  if (current.phase === Phase.NotIntroduced) {
    return (
      <div>
        <h3>{current.question}</h3>
        <p>{current.answer}</p>
        <button onClick={() => session.markIntroduced()}>Got it</button>
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
      {capabilities.supportedGrades.includes(Grade.Easy) && (
        <button onClick={() => session.answer(current.answer, Grade.Easy)}>
          Mark as Easy
        </button>
      )}
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

Copies all cards from `session.cards` back into `session.queue` and calls `reshuffle()`. Note that card `metadata` (such as FSRS stability) and `history` remain on the cards unless you clear them explicitly.
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
