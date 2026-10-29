---
description: "Complete API reference for the Learnlib session controller class."
icon: brackets-curly
---

# Learnlib Class

`Learnlib` (also the default export of `@siemsiem/learnlib`) is the main session controller that manages card state, active review queues, module configurations, and state subscriptions.

## Constructor

You can initialize `Learnlib` with either a `LearnlibOptions` object (recommended) or positional parameters:

```typescript
new Learnlib(options: LearnlibOptions)
new Learnlib(
  cardsOrState: CardState[] | LearnlibState,
  method?: LearningMethod | string,       // default: "simple"
  grader?: GradeMaker | string,           // default: "basic"
  queueUpdater?: QueueUpdater | string,   // default: "simple"
  checkConfig?: CheckConfig,              // default: {}
  initialConfigs?: Record<string, any> | string
)
```

### `LearnlibOptions`

| Property | Type | Default | Description |
|---|---|---|---|
| `cards` | `CardState[] \| LearnlibState` | *Required* | Array of cards or a previously exported `LearnlibState` snapshot |
| `method` | `LearningMethod \| string` | `"simple"` | Active learning method instance or registered module ID |
| `grader` | `GradeMaker \| string` | `"basic"` | Active grade maker instance or registered module ID |
| `queueUpdater` | `QueueUpdater \| string` | `"simple"` | Active queue updater instance or registered module ID |
| `checkConfig` | `CheckConfig` | `{}` | Answer checker overrides for this session |
| `configs` | `Record<string, any>` | `undefined` | Initial module configs passed to `importConfigJson()` |

---

## Instance Properties

| Property | Type | Dutch Alias | Description |
|---|---|---|---|
| `cards` | `CardState[]` | `lijst` | All cards in the deck, updated in place as reviews occur |
| `queue` | `CardState[]` | `wachtrij` | Remaining cards in the active review queue |
| `current` | `CardState \| null` | — | Card currently at the front of the queue (`queue[0] ?? null`) |
| `history` | `CardSnapshot[]` | — | Chronological log of all review snapshots in this session |
| `initialCount` | `number` | — | Initial queue length used to calculate `queueState.progress` |
| `method` | `LearningMethod` | `methode` | Active learning method module |
| `grader` | `GradeMaker` | — | Active grade maker module |
| `queueUpdater` | `QueueUpdater` | `wachtrijUpdater` | Active queue updater module |
| `checkConfig` | `CheckConfig` | — | Active answer-checking configuration |

---

## Methods

### `answer(uAnswer, gradeOverwrite?, checkConfigOverride?)`

Checks `uAnswer` against `this.current.answer`, grades the attempt, records a `CardSnapshot` in `history`, calls `method.reviewCard()`, updates the queue via `queueUpdater.updateQueue()`, resets the response timer, and notifies subscribers.

```typescript
session.answer(
  uAnswer: string,
  gradeOverwrite?: Grade,
  checkConfigOverride?: CheckConfig
): void
```

- **Dutch alias:** `session.antwoord(uAnswer, gradeOverwrite, checkConfigOverride)`

### `subscribe(listener)` & `getSnapshot()`

Subscribe to reactive state changes or synchronously read the latest `LearnlibState` snapshot:

```typescript
const unsubscribe: () => void = session.subscribe((state: LearnlibState) => {
  console.log(state.queueState.progress);
});

const currentSnapshot: LearnlibState = session.getSnapshot();
```

### `reshuffle()` & `reset()`

- `session.reshuffle()`: Randomly shuffles the remaining `queue`, sets `current` to `queue[0] ?? null`, resets the response timer, and notifies subscribers.
- `session.reset()`: Restores `queue` to contain all cards from `this.cards`, then calls `reshuffle()`.

### Configuration Methods

- `session.setConfig(moduleId: string, config: any, type?: ModuleType): this`
- `session.getConfig(moduleId: string, type?: ModuleType): any`
- `session.exportConfigJson(pretty?: boolean): string` (alias: `getConfigJson`)
- `session.importConfigJson(json: string | Record<string, any>): this`
