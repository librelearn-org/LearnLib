---
description: "Discover, register, and manage modules through ModuleSystem and globalModuleTracker."
icon: sliders
---

# Module System & Registry

LearnLib maintains a central `ModuleSystem` instance called `globalModuleTracker` (also exported as `moduleTracker` and attached to `window.LEARNLIB_MODULE_API` in browser environments).

When `globalModuleTracker` is initialized, it registers all 11 built-in default modules across all five module types.

## Looking Up Modules

You can query registered modules by ID, by `ModuleType`, or through type-specific helper methods:

```typescript
import { globalModuleTracker } from "@siemsiem/learnlib";

// List all registered modules or IDs
const allModules = globalModuleTracker.getAll();
const allIds = globalModuleTracker.listIds();

// Fetch by specific category
const methods = globalModuleTracker.getMethods();
const checkers = globalModuleTracker.getCheckerModules();
const preprocessors = globalModuleTracker.getPreprocessors();
const graders = globalModuleTracker.getGradeMakers();
const queueUpdaters = globalModuleTracker.getQueueUpdaters();

// Retrieve a single module (or throw if missing / wrong type)
const fsrs = globalModuleTracker.getOrThrow("fsrs", "method");
```

{% hint style="info" %}
Modules are keyed internally by `${type}:${id}` when `type` is defined, allowing modules of different types (such as `"method"` `"simple"` and `"queueUpdater"` `"simple"`) to coexist without ID collisions.
{% endhint %}

## Registering & Unregistering Modules

```typescript
import { globalModuleTracker, ModuleSystem } from "@siemsiem/learnlib";

// Register one or more custom modules into the global tracker
globalModuleTracker.register(myCustomMethod, [myChecker1, myChecker2]);

// Remove a module by ID (and optional type)
globalModuleTracker.unregister("simple", "method");

// Reset the tracker back to the 11 built-in defaults
globalModuleTracker.reset();

// Or create an isolated registry without defaults
const isolatedRegistry = new ModuleSystem(false);
```

## Generating a Settings UI (`getGuiConfigList`)

Every module exposes bilingual (`EN` / `NL`) metadata, its `schema`, and its current `config`. Calling `getGuiConfigList()` returns an array of `GuiConfigSection` objects that you can map directly to a settings form in your UI:

```typescript
const sections = globalModuleTracker.getGuiConfigList();
/*
[
  {
    id: "fsrs",
    type: "method",
    name: { EN: "FSRS (Long-term retention)", NL: "FSRS (Langetermijngeheugen)" },
    description: { EN: "Free Spaced Repetition Scheduler...", NL: "..." },
    schema: { targetRecall: { type: "number", default: 0.9, min: 0.7, max: 0.99, step: 0.01, ... } },
    config: { targetRecall: 0.9 }
  },
  ...
]
*/
```
