---
description: "Convert answer outcomes into grades and manage card ordering in the session queue."
icon: list-ol
---

# Graders & Queue Updaters

After the answer checker determines whether an answer is correct, LearnLib uses a **GradeMaker** to assign a `Grade` and a **QueueUpdater** to advance or reorder the session queue.

## `VerySimpleGradeMaker` (`id: "basic"`)

The default grade maker (`type: "gradeMaker"`) converts a boolean correctness result directly into `Grade.Good` or `Grade.Incorrect`, ignoring response duration unless a manual `overwrite` grade is passed.

```typescript
import { Grade, VerySimpleGradeMaker } from "@siemsiem/learnlib";

const grader = new VerySimpleGradeMaker();
grader.grade(true, startTime, endTime);                   // Grade.Good (2)
grader.grade(false, startTime, endTime);                  // Grade.Incorrect (0)
grader.grade(true, startTime, endTime, Grade.Easy);       // Grade.Easy (3)
```

{% hint style="info" %}
`VerySimpleGradeMaker` only emits `Grade.Good` (`2`) or `Grade.Incorrect` (`0`) automatically. When using `FsrsMethod`, you can pass a manual `gradeOverwrite` (`Grade.Hard` or `Grade.Easy`) to `session.answer(userAnswer, Grade.Easy)` or implement a custom timing-based `GradeMaker`.
{% endhint %}

---

## `SimpleQueueUpdater` (`id: "simple"`)

The default queue updater (`type: "queueUpdater"`) manages the active session queue (`state.queue`) after each review:

- **On `Grade.Incorrect`:** Removes the current card from the front of the queue and reinserts it at a random index within the remaining queue so the learner will be tested on it again before the session ends.
- **On `Grade.Hard`, `Grade.Good`, or `Grade.Easy`:** Removes the card from the active queue (`queue.filter(k => k.id !== card.id)`), advancing `queueState.progress` toward `1`.

```typescript
import { SimpleQueueUpdater } from "@siemsiem/learnlib";

// Exported aliases:
// SimpleQueueUpdater, simpleQueueUpdater, simpleWachtrij
```
