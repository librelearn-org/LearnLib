---
description: "Normalize expected answers and user inputs before checking variants."
icon: filter
---

# Preprocessors

Preprocessors (`type: "preprocessor"`) run **once** on both the expected answer and the user's answer before checker modules expand any variants.

| Module Class | ID | Default | `CheckConfig` Override | Purpose |
|---|---|---|---|---|
| `CaseInsensitivePreprocessor` | `"caseSensitive"` | `enabled: true` (case-insensitive) | `caseSensitive?: boolean` | Converts strings to lowercase when case sensitivity is disabled |
| `StripAccentsPreprocessor` | `"stripAccents"` | `enabled: false` | `stripAccents?: boolean` | Removes diacritics and accents via Unicode `NFD` normalization |
| `GreekPreprocessor` | `"greekLetters"` | `enabled: true` | `greekLetters?: boolean` | Transliterates Greek letters to Latin equivalents |
| `RemoveArticlesPreprocessor` | `"removeArticles"` | `enabled: false` | `removeArticles?: boolean` | Strips leading articles (`de`, `het`, `the`, `le`, `der`, etc.) |

---

## `CaseInsensitivePreprocessor` (`id: "caseSensitive"`)

Converts input text to lowercase when case sensitivity is disabled.

{% hint style="info" %}
Note the inversion between the module schema's `enabled` field (`true` means case-insensitivity is enabled) and `CheckConfig.caseSensitive` (`false` means case-insensitive).
{% endhint %}

- **Aliases:** `caseInsensitivePreprocessor`, `CaseSensitivePreprocessor`, `notCaseSensitive`
- **Schema (`caseSensitiveSchema`):** `enabled: boolean` (default: `true`)

---

## `StripAccentsPreprocessor` (`id: "stripAccents"`)

Decomposes accented characters using `inputString.normalize("NFD")` and strips combining diacritical marks (`[\u0300-\u036f]`), turning `"café"` into `"cafe"`.

- **Aliases:** `stripAccentsPreprocessor`
- **Schema (`stripAccentsSchema`):** `enabled: boolean` (default: `false`)

---

## `GreekPreprocessor` (`id: "greekLetters"`)

Transliterates Greek characters (including accented/tonos and dialytika variants) into their Latin alphabet equivalents so learners can type answers on a standard Latin keyboard.

- **Examples:** `α -> a`, `θ -> th`, `λ -> l`, `φ -> ph`, `χ -> ch`, `ψ -> ps`, `ω -> o`
- **Aliases:** `greekPreprocessor`, `greek`
- **Schema (`greekSchema`):** `enabled: boolean` (default: `true`)

---

## `RemoveArticlesPreprocessor` (`id: "removeArticles"`)

Strips leading definite and indefinite articles in Dutch, English, French, and German from the start of an answer or immediately following `/`, `[`, or `,`.

- **Default articles (`DEFAULT_ARTICLES`):**
  `de`, `het`, `een`, `the`, `a`, `an`, `le`, `la`, `les`, `un`, `une`, `des`, `der`, `die`, `das`, `ein`, `eine`
- **Schema (`removeArticlesSchema`):**
  - `enabled` (`boolean`, default: `false`)
  - `articles` (`string[]`, default: `DEFAULT_ARTICLES`)

```typescript
import { globalModuleTracker } from "@siemsiem/learnlib";

// Enable article removal and customize the article list:
globalModuleTracker.setConfig("removeArticles", {
  enabled: true,
  articles: ["de", "het", "een", "el", "la", "los", "las"],
});
```
