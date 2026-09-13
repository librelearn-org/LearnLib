import { Preprocessor, CheckConfig } from "../shared";
import { extractDefaults, InferConfig } from "../../configSystem";

export const greekSchema = {
  enabled: {
    type: "boolean",
    default: true,
    label: {
      EN: "Convert Greek Letters",
      NL: "Griekse letters omzetten",
    },
    description: {
      EN: "Converts Greek letters to Latin alphabet equivalents (e.g., λ -> l)",
      NL: "Zet Griekse letters om naar het Latijnse alfabet (bijv. λ -> l)",
    },
  },
} as const;

export type GreekConfig = InferConfig<typeof greekSchema>;

const GREEK_TO_LATIN: Record<string, string> = {
  // Lowercase
  "α": "a", "β": "b", "γ": "g", "δ": "d", "ε": "e", "ζ": "z", "η": "e", "θ": "th",
  "ι": "i", "κ": "k", "λ": "l", "μ": "m", "ν": "n", "ξ": "x", "ο": "o", "π": "p",
  "ρ": "r", "σ": "s", "ς": "s", "τ": "t", "υ": "u", "φ": "ph", "χ": "ch", "ψ": "ps", "ω": "o",
  // Accented / tonos / dialytika lowercase
  "ά": "a", "έ": "e", "ή": "e", "ί": "i", "ό": "o", "ύ": "u", "ώ": "o",
  "ϊ": "i", "ϋ": "u", "ΐ": "i", "ΰ": "u",
  // Uppercase
  "Α": "A", "Β": "B", "Γ": "G", "Δ": "D", "Ε": "E", "Ζ": "Z", "Η": "E", "Θ": "TH",
  "Ι": "I", "Κ": "K", "Λ": "L", "Μ": "M", "Ν": "N", "Ξ": "X", "Ο": "O", "Π": "P",
  "Ρ": "R", "Σ": "S", "Τ": "T", "Υ": "U", "Φ": "PH", "Χ": "CH", "Ψ": "PS", "Ω": "O",
  // Accented uppercase
  "Ά": "A", "Έ": "E", "Ή": "E", "Ί": "I", "Ό": "O", "Ύ": "U", "Ώ": "O",
  "Ϊ": "I", "Ϋ": "U",
};

const RE_GREEK = /[\u0370-\u03FF\u1F00-\u1FFF]/g;

export class GreekPreprocessor implements Preprocessor<typeof greekSchema> {
  type = "preprocessor" as const;
  id = "greekLetters";
  name = {
    EN: "Greek Letters to Latin",
    NL: "Griekse letters naar normale letters",
  };
  description = {
    EN: "Converts Greek letters to Latin alphabet (e.g., λ -> l)",
    NL: "Zet Griekse letters om naar het Latijnse alfabet (bijv. λ -> l)",
  };

  schema = greekSchema;
  config = extractDefaults(greekSchema);

  preprocess(inputString: string, config?: CheckConfig): string {
    const isEnabled = config?.greekLetters !== undefined
      ? config.greekLetters
      : this.config.enabled;

    if (!isEnabled) {
      return inputString;
    }
    return inputString.replace(RE_GREEK, (ch) => GREEK_TO_LATIN[ch] ?? ch);
  }
}

export { GreekPreprocessor as greek, GreekPreprocessor as greekPreprocessor };
