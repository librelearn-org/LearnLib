---
description: "Define strongly-typed module schemas and persist user configurations as JSON."
icon: gear
---

# Schema & Configuration

LearnLib includes a declarative schema system (`configSystem.ts`) that derives static TypeScript types (`InferConfig<S>`), extracts runtime default values (`extractDefaults`), and supports JSON serialization for saving user preferences.

## Schema Field Types

A `ModuleSchema` is a record mapping configuration keys to `SchemaField` definitions:

| Field `type` | Required Properties | Optional Properties | Inferred TypeScript Type |
|---|---|---|---|
| `"boolean"` | `default: boolean` | `label`, `description` | `boolean` |
| `"number"` | `default: number` | `min`, `max`, `step`, `label`, `description` | `number` |
| `"string"` | `default: string` | `maxLength`, `pattern`, `label`, `description` | `string` |
| `"select"` | `options: readonly string[]`, `default: string` | `label`, `description` | Union of `options` literal types |
| `"array"` | `items: "string" \| "number" \| "boolean"` | `default`, `label`, `description` | `string[] \| number[] \| boolean[]` |

### Defining a Schema with `InferConfig`

Always declare schemas with `as const` so TypeScript preserves literal types for `"select"` options:

```typescript
import { extractDefaults, type InferConfig } from "@siemsiem/learnlib";

export const myModuleSchema = {
  strictMode: {
    type: "boolean",
    default: false,
    label: { EN: "Strict Mode", NL: "Strikte modus" },
  },
  penaltyFactor: {
    type: "number",
    default: 1.5,
    min: 1.0,
    max: 5.0,
    step: 0.5,
  },
  matchingStyle: {
    type: "select",
    options: ["exact", "fuzzy", "prefix"] as const,
    default: "exact" as const,
  },
} as const;

// Inferred as:
// { strictMode: boolean; penaltyFactor: number; matchingStyle: "exact" | "fuzzy" | "prefix" }
export type MyModuleConfig = InferConfig<typeof myModuleSchema>;

const defaultConfig = extractDefaults(myModuleSchema);
```

---

## Reading, Updating, and Persisting Configs

You can update module configurations either on a `Learnlib` session instance or globally on `globalModuleTracker`. Partial updates are merged safely using `deepMerge`.

```typescript
// Update a single module's configuration
session.setConfig("fsrs", { targetRecall: 0.95 }, "method");
session.setConfig("unorderedAnswerParts", { maxItems: 6 });

// Read current configuration
const fsrsConfig = session.getConfig("fsrs", "method");

// Export all module configurations to a JSON string (e.g., to save in localStorage)
const savedJson = session.exportConfigJson(true);

// Restore configurations from a JSON string or object
session.importConfigJson(savedJson);
```
