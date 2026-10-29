---
description: "Check user answers with optional parts, unordered lists, alternatives, or pre-compiled sets."
icon: check-double
---

# Answer Checker

LearnLib includes a standalone, extensible answer-checking engine that supports rich answer syntax out of the box. You can invoke it automatically via `session.answer()`, call `checkAnswer()` directly, or pre-compile all valid variants with `WordChecker`.

## Direct vs. Compiled Checking

{% tabs %}
{% tab title="checkAnswer (On-demand)" %}
Use `checkAnswer` for one-off answer checks. It runs active preprocessors once and recursively expands syntax variants with memoization:

```typescript
import { checkAnswer, goodDefaults } from "@siemsiem/learnlib";

const isRight = checkAnswer(
  "(to) walk / (to) stroll",
  "stroll",
  goodDefaults
); // true
```
{% endtab %}

{% tab title="WordChecker (Pre-compiled)" %}
Use `WordChecker` when checking many user inputs against the same target answer or pre-computing variants ahead of time (`O(1)` lookup via `Set.has` after compilation):

```typescript
import { WordChecker, goodDefaults } from "@siemsiem/learnlib";

const checker = new WordChecker("[red, blue] (color)", goodDefaults);

// Compile synchronously or asynchronously via microtask
checker.compileSync();
console.log(checker.checkSync("blue red")); // true

// Or async:
checker.compile();
console.log(await checker.check("red blue color")); // true
```
{% endtab %}
{% endtabs %}

{% hint style="warning" %}
Calling `checker.checkSync()` before calling `compileSync()` (or awaiting `compile()`) throws `Error("You forgot to compile")`.
{% endhint %}

---

## `CheckConfig` & `goodDefaults`

Pass a `CheckConfig` object to `Learnlib`, `checkAnswer`, or `WordChecker` to override module settings per check:

```typescript
import { type CheckConfig, goodDefaults } from "@siemsiem/learnlib";

// Built-in goodDefaults:
const defaults: Required<CheckConfig> = {
  caseSensitive: false,
  stripAccents: false,
  greekLetters: true,
  removeArticles: false,
  allowOptionalAnswerParts: true,
  allowUnorderedAnswerParts: true,
  alternativeAnswers: {
    allow: true,
    mode: "both",
  },
};
```

---

## Built-in Checker Modules (`type: "checker"`)

Checker modules expand a single answer string into multiple valid variants. Because they compose recursively, you can combine `()`, `[]`, and `/` in the same answer.

### 1. `OptionalAnswerPartsModule` (`id: "optionalAnswerParts"`)

Makes any text inside parentheses `(...)` optional — matching both with the parenthesized words included (without the parentheses) and with them omitted entirely.

- **Example answer:** `"(to) walk (quickly)"`
- **Accepted inputs:** `"walk"`, `"to walk"`, `"walk quickly"`, `"to walk quickly"`
- **Schema (`optionalAnswerPartsSchema`):**
  - `allow` (`boolean`, default: `true`)
- **`CheckConfig` override:** `allowOptionalAnswerParts?: boolean`

### 2. `UnorderedAnswerPartsModule` (`id: "unorderedAnswerParts"`)

Allows comma-separated items inside square brackets `[a, b, c]` to be entered in any permutation, separated by spaces.

- **Example answer:** `"[salt, pepper]"`
- **Accepted inputs:** `"salt pepper"`, `"pepper salt"`
- **Schema (`unorderedAnswerPartsSchema`):**
  - `allow` (`boolean`, default: `true`)
  - `maxItems` (`number`, default: `5`, min: `2`, max: `7`) — guards against factorial ($n!$) explosion on large lists. Lists exceeding `maxItems` only match in their original order.
- **`CheckConfig` override:** `allowUnorderedAnswerParts?: boolean`

### 3. `AlternativeAnswersModule` (`id: "alternativeAnswers"`)

Allows alternative words or full sentences separated by `/`.

- **Modes (`mode`):**
  - `"both"` (default): Splits full-sentence alternatives on `" / "` (with spaces) and single-word alternatives on `"/"` (without spaces).
  - `"onlySingleWord"`: Only splits individual words containing `"/"` (e.g. `"he/she walks"` -> `"he walks"` or `"she walks"`).
  - `"onlySentence"`: Splits the entire answer on `"/"` (e.g. `"hello / hi"` -> `"hello"` or `"hi"`).
- **Schema (`alternativeAnswersSchema`):**
  - `allow` (`boolean`, default: `true`)
  - `mode` (`"both" | "onlySingleWord" | "onlySentence"`, default: `"both"`)
- **`CheckConfig` override:** `alternativeAnswers?: { allow?: boolean; mode?: "onlySingleWord" | "both" | "onlySentence" }`
