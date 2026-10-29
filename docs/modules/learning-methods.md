---
description: "Schedule reviews with Simple repetition or the Free Spaced Repetition Scheduler (FSRS)."
icon: brain
---

# Learning Methods

Learning methods (`type: "method"`) determine how a card's `lastReviewed`, `nextReview`, and `metadata` are updated after each answer.

{% columns %}
{% column %}
### Simple (`"simple"`)

Marks a card as learned (`metadata.learned = true`) as soon as it is graded `Hard`, `Good`, or `Easy`. Ideal for single-session cramming and quick vocabulary drills.
{% endcolumn %}

{% column %}
### FSRS (`"fsrs"`)

Implements the **Free Spaced Repetition Scheduler**, modeling memory stability ($S$), difficulty ($D$), and retrievability ($R$) to schedule optimal multi-day review intervals.
{% endcolumn %}
{% endcolumns %}

---

## `SimpleMethod` (`id: "simple"`)

`SimpleMethod` is the default learning method in `Learnlib`.

- On `Grade.Incorrect`: keeps the card unlearned and sets `lastReviewed` and `nextReview` to `now`.
- On `Grade.Hard`, `Grade.Good`, or `Grade.Easy`: sets `metadata.learned = true` (and `metadata.geleerd = true` for Dutch backwards compatibility).
- `filterQueueItem(item)` returns `true` once `metadata.learned` is truthy.

```typescript
import { Learnlib, SimpleMethod } from "@siemsiem/learnlib";

const session = new Learnlib({
  cards,
  method: "simple", // or new SimpleMethod()
});
```

---

## `FsrsMethod` (`id: "fsrs"`)

`FsrsMethod` schedules long-term reviews using the 19-weight FSRS v4/v5 equations.

### Configuration Schema (`fsrsSchema`)

| Option | Type | Default | Range / Step | Description |
|---|---|---|---|---|
| `targetRecall` | `number` | `0.9` | `0.7` – `0.99` (step `0.01`) | Target retention probability at the next scheduled review |

```typescript
import { Learnlib } from "@siemsiem/learnlib";

const session = new Learnlib({
  cards,
  method: "fsrs",
  configs: {
    fsrs: {
      targetRecall: 0.92,
    },
  },
});
```

### Metadata Stored on Cards

After `reviewCard()` runs, `FsrsMethod` writes the following properties to `card.metadata`:

- `stability` (and alias `stabielheid`): Memory stability in days ($S$).
- `difficulty` (and alias `moeilijkheid`): Item difficulty bounded to $[1.0, 10.0]$ ($D$).

<details>
<summary>Exported FSRS Helper Functions</summary>

If you need direct access to the underlying FSRS math utilities from `./methods/fsrs`, the following functions are available:

- `initialDifficulty(g: Grade): number`
- `initialStability(g: Grade): number`
- `calculateDifficulty(d: number, g: Grade): number`
- `calculateRetrievability(t: days, s: number): number`
- `calculateNextReview(r_d: number, s: number): days`
- `calculateStability(d: number, s: number, r: number, g: Grade): number`
</details>
