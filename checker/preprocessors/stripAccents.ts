import { Preprocessor, CheckConfig } from "../shared";
import { extractDefaults, InferConfig } from "../../configSystem";

export const stripAccentsSchema = {
  enabled: {
    type: "boolean",
    default: false,
    label: {
      EN: "Strip Accents",
      NL: "Accenttekens verwijderen",
    },
    description: {
      EN: "Remove accents and diacritics from text (e.g. é -> e)",
      NL: "Verwijder accenten en diakritische tekens uit tekst (bijv. é -> e)",
    },
  },
} as const;

export type StripAccentsConfig = InferConfig<typeof stripAccentsSchema>;

export class StripAccentsPreprocessor implements Preprocessor<typeof stripAccentsSchema> {
  type = "preprocessor" as const;
  id = "stripAccents";
  name = {
    EN: "Strip Accents",
    NL: "Accenttekens verwijderen",
  };
  description = {
    EN: "Removes diacritics and accents from answers",
    NL: "Verwijdert accenten en diakritische tekens uit antwoorden",
  };

  schema = stripAccentsSchema;
  config = extractDefaults(stripAccentsSchema);

  preprocess(inputString: string, config?: CheckConfig): string {
    const shouldStrip = config?.stripAccents !== undefined
      ? config.stripAccents
      : this.config.enabled;

    if (shouldStrip) {
      return inputString.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return inputString;
  }
}

export { StripAccentsPreprocessor as stripAccentsPreprocessor };
