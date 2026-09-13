import { CheckConfig, CheckModule, LowestCheckFunction } from "../shared";
import { extractDefaults, InferConfig } from "../../configSystem";

export const alternativeAnswersSchema = {
  allow: {
    type: "boolean",
    default: true,
    label: {
      EN: "Allow alternative answers",
      NL: "Alternatieve antwoorden toestaan",
    },
    description: {
      EN: "Allow alternative answers separated by '/'",
      NL: "Sta alternatieve antwoorden toe gescheiden door '/'",
    },
  },
  mode: {
    type: "select",
    options: ["both", "onlySingleWord", "onlySentence"] as const,
    default: "both" as const,
    label: {
      EN: "Mode",
      NL: "Modus",
    },
    description: {
      EN: "Whether to allow alternatives per word, sentence, or both",
      NL: "Of alternatieven per woord, per zin, of beide zijn toegestaan",
    },
  },
} as const;

export type AlternativeAnswersConfig = InferConfig<typeof alternativeAnswersSchema>;

export class AlternativeAnswersModule implements CheckModule<typeof alternativeAnswersSchema> {
  type = "checker" as const;
  id = "alternativeAnswers";
  name = {
    EN: "Alternative Answers",
    NL: "Alternatieve Antwoorden",
  };
  description = {
    EN: "Allow alternative answers with '/'",
    NL: "Sta alternatieve antwoorden toe met '/'",
  };
  schema = alternativeAnswersSchema;
  config = extractDefaults(alternativeAnswersSchema);

  check(answer: string, callback: LowestCheckFunction, config?: CheckConfig): boolean {
    const isAllowed = config?.alternativeAnswers?.allow ?? this.config.allow;
    if (!isAllowed) {
      return false;
    }
    if (answer.indexOf("/") === -1) {
      return false;
    }
    const mode = config?.alternativeAnswers?.mode ?? this.config.mode;
    switch (mode) {
      case "onlySentence":
        return this.checkSentence(answer, callback, "/");
      case "onlySingleWord":
        return this.checkSingleWord(answer, callback);
      default:
        return this.checkSentence(answer, callback, " / ") || this.checkSingleWord(answer, callback);
    }
  }

  private checkSentence(answer: string, callback: LowestCheckFunction, splitBy: string): boolean {
    if (!answer.includes(splitBy)) return false;
    const parts = answer.split(splitBy);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part && part !== answer && callback(part)) {
        return true;
      }
    }
    return false;
  }

  private checkSingleWord(answer: string, callback: LowestCheckFunction): boolean {
    const words = answer.split(" ");
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.indexOf("/") !== -1) {
        const options = word.split("/");
        for (let j = 0; j < options.length; j++) {
          const opt = options[j].trim();
          const variantWords = [...words];
          variantWords[i] = opt;
          const variant = variantWords.join(" ").trim();
          if (variant && variant !== answer && callback(variant)) {
            return true;
          }
        }
        break;
      }
    }
    return false;
  }
}

export { AlternativeAnswersModule as alternativeAnswersModule };
