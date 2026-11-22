---
description: "Schedule reviews with Simple repetition or the Free Spaced Repetition Scheduler (FSRS)."
icon: brain
---

# Learning Methods

Learning methods (`type: "method"`) determine how a card's `lastReviewed`, `nextReview`, and `metadata` are updated after each answer, and declare their `capabilities` so UIs can adapt automatically.

{% columns %}
{% column %}
### Simple (`"simple"`)

Single-session flashcard learning supporting `Good` and `Incorrect` grades. Ideal for single-session cramming and quick vocabulary drills.
{% endcolumn %}

{% column %}
### FSRS (`"fsrs"`)

Implements the **Free Spaced Repetition Scheduler**, modeling memory stability ($S$), difficulty ($D$), and retrievability ($R$) to schedule optimal multi-day review intervals across all four grades.
{% endcolumn %}
{% endcolumns %}

---

## Method Capabilities

Every `LearningMethod` exposes a `capabilities` object describing how it behaves and which UI features it supports:

```typescript
capabilities: {
  type: "spaced" | "session";
  showNextLearnDate: boolean;
  supportedGrades: Grade[];
}
```

| Property | Type | Description |
|---|---|---|
| `type` | `"spaced" \| "session"` | `"session"` for single-session cramming, or `"spaced"` for long-term spaced repetition (e.g., showing *"Done for today"* instead of *"Session complete"*). |
| `showNextLearnDate` | `boolean` | Whether `session.previewTime()` can preview upcoming review dates for each supported grade. |
| `supportedGrades` | `Grade[]` | The `Grade` values supported by this method. Custom grading UIs should only display buttons for grades listed here. |

---

## `SimpleMethod` (`id: "simple"`)

`SimpleMethod` is the default learning method in `Learnlib`.

### Capabilities

- **`type`:** `"session"`
- **`showNextLearnDate`:** `false`
- **`supportedGrades`:** `[Grade.Good, Grade.Incorrect]`

### Behavior

- Updates `lastReviewed` and `nextReview` to `now` on every review.
- `Learnlib.answer()` automatically sets `card.phase` to `Phase.Learning` on `Grade.Incorrect` and `Phase.Review` on any passing grade.

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

### Capabilities

- **`type`:** `"spaced"`
- **`showNextLearnDate`:** `true`
- **`supportedGrades`:** `[Grade.Easy, Grade.Good, Grade.Hard, Grade.Incorrect]`

### Scheduling Behavior

- On `Grade.Incorrect`: schedules a short **10-minute** relearning step (`nextReview = now + 10 minutes`).
- On `Grade.Hard`, `Grade.Good`, or `Grade.Easy`: calculates the next review interval in days (minimum 1 day) from updated stability ($S$) and `targetRecall`.
- Supports `session.previewTime()` to preview the next review `Date` for every supported grade before the user submits.

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
