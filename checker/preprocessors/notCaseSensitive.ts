import { Preprocessor, CheckConfig } from "../shared";
import { extractDefaults, InferConfig } from "../../configSystem";

export const caseSensitiveSchema = {
  enabled: {
    type: "boolean",
    default: true,
    label: {
      EN: "Case Insensitive",
      NL: "Niet hoofdlettergevoelig",
    },
    description: {
      EN: "Ignore uppercase/lowercase differences by converting to lowercase",
      NL: "Negeer verschillen tussen hoofdletters en kleine letters door tekst om te zetten naar kleine letters",
    },
  },
} as const;

export type CaseSensitiveConfig = InferConfig<typeof caseSensitiveSchema>;

export class CaseInsensitivePreprocessor implements Preprocessor<typeof caseSensitiveSchema> {
  type = "preprocessor" as const;
  id = "caseSensitive";
  name = {
    EN: "Case Insensitive",
    NL: "Niet hoofdlettergevoelig",
  };
  description = {
    EN: "Converts text to lowercase when case sensitivity is disabled",
    NL: "Zet tekst om naar kleine letters wanneer hoofdlettergevoeligheid is uitgeschakeld",
  };

  schema = caseSensitiveSchema;
  config = extractDefaults(caseSensitiveSchema);

  preprocess(inputString: string, config?: CheckConfig): string {
    const isCaseInsensitive = config?.caseSensitive !== undefined
      ? !config.caseSensitive
      : this.config.enabled;

    if (isCaseInsensitive) {
      return inputString.toLowerCase();
    }
    return inputString;
  }
}

export {
  CaseInsensitivePreprocessor as caseInsensitivePreprocessor,
  CaseInsensitivePreprocessor as CaseSensitivePreprocessor,
  CaseInsensitivePreprocessor as notCaseSensitive,
};
