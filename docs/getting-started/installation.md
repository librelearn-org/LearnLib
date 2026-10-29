---
description: "Install LearnLib and set up your first flashcard session in minutes."
icon: bolt
---

# Installation & Quickstart

Get started with <code class="expression">space.vars.package_name</code> in your TypeScript or JavaScript project.

## Installation

Install the package using your preferred package manager:

{% tabs %}
{% tab title="Bun" %}
```bash
bun add @siemsiem/learnlib
```
{% endtab %}

{% tab title="pnpm" %}
```bash
pnpm add @siemsiem/learnlib
```
{% endtab %}

{% tab title="npm" %}
```bash
npm install @siemsiem/learnlib
```
{% endtab %}
{% endtabs %}

## Quickstart Guide

Follow these steps to create a deck, subscribe to state updates, and submit answers.

{% stepper %}
{% step %}
## Define your cards

Pass an array of card objects. `Learnlib` automatically upgrades partial card objects via `upgradeTools.upgradeCard`, so you only need `id`, `question`, and `answer` to get started:

{% code title="cards.ts" %}
```typescript
import { upgradeTools, type CardState } from "@siemsiem/learnlib";

export const initialCards: CardState[] = [
  upgradeTools.upgradeCard({
    id: "card-1",
    question: "What is the capital of the Netherlands?",
    answer: "(the) Amsterdam",
  }),
  upgradeTools.upgradeCard({
    id: "card-2",
    question: "Name the primary colors of light",
    answer: "[red, green, blue]",
  }),
];
```
{% endcode %}
{% endstep %}

{% step %}
## Initialize a `Learnlib` session

Create a `Learnlib` instance using the options object (or positional arguments). By default, it uses the `"simple"` learning method, `"basic"` grade maker, and `"simple"` queue updater:

{% code title="session.ts" %}
```typescript
import { Learnlib, goodDefaults } from "@siemsiem/learnlib";
import { initialCards } from "./cards";

export const session = new Learnlib({
  cards: initialCards,
  method: "simple",      // or "fsrs" for long-term spaced repetition
  grader: "basic",
  queueUpdater: "simple",
  checkConfig: goodDefaults,
});
```
{% endcode %}
{% endstep %}

{% step %}
## Subscribe to state changes & answer cards

Use `getSnapshot()` to read the current state and `subscribe()` to listen for updates after each answer:

{% code title="index.ts" %}
```typescript
import { session } from "./session";

const unsubscribe = session.subscribe((state) => {
  console.log(`Progress: ${Math.round(state.queueState.progress * 100)}%`);
  if (state.queueState.isDone) {
    console.log("Session complete!");
  } else {
    console.log("Next question:", state.queueState.current?.question);
  }
});

// Inspect the first question
console.log("Current question:", session.current?.question);

// Submit a user answer
session.answer("amsterdam");
```
{% endcode %}
{% endstep %}
{% endstepper %}

{% hint style="success" %}
Because `session.subscribe` and `session.getSnapshot` follow the standard external store contract, you can pass them directly to React's `useSyncExternalStore(session.subscribe, session.getSnapshot)`.
{% endhint %}
