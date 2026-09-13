import { CheckConfig, CheckModule, LowestCheckFunction } from "../shared";
import { extractDefaults, InferConfig } from "../../configSystem";

export const optionalAnswerPartsSchema = {
    allow: {
        type: "boolean",
        default: true,
        label: {
            EN: "Allow optional answer parts",
            NL: "Optionele antwoorddelen toestaan",
        },
        description: {
            EN: "Make parts of the answer enclosed in brackets () optional",
            NL: "Maak delen van het antwoord tussen haakjes () optioneel",
        },
    },
} as const;

export type OptionalAnswerPartsConfig = InferConfig<typeof optionalAnswerPartsSchema>;

const RE_FIRST_OPT = /\(([^)]*)\)/;
const RE_SPACES = /\s+/g;

export class OptionalAnswerPartsModule implements CheckModule<typeof optionalAnswerPartsSchema> {
    type = "checker" as const;
    id = "optionalAnswerParts";
    name = {
        EN: "Optional Answer Parts",
        NL: "Optionele Antwoorddelen",
    };
    description = {
        EN: "Make the parts of the answer between brackets optional ()",
        NL: "Maak de delen van het antwoord tussen haakjes optioneel ()",
    };
    schema = optionalAnswerPartsSchema;
    config = extractDefaults(optionalAnswerPartsSchema);

    check(answer: string, callback: LowestCheckFunction, config?: CheckConfig): boolean {
        const isAllowed = config?.allowOptionalAnswerParts ?? this.config.allow;
        if (isAllowed === false) {
            return false;
        }

        // Fast path: Only run if both parentheses exist in the answer string
        if (answer.indexOf("(") === -1 || answer.indexOf(")") === -1) {
            return false;
        }

        const match = answer.match(RE_FIRST_OPT);
        if (!match || match.index === undefined) {
            return false;
        }

        const before = answer.slice(0, match.index);
        const after = answer.slice(match.index + match[0].length);
        const inner = match[1];

        // Variant 1: Remove bracket and its contents entirely ("football (game)" -> "football")
        const withoutOptional = (before + after).replace(RE_SPACES, " ").trim();
        if (withoutOptional !== answer) {
            if (callback(withoutOptional)) {
                return true;
            }
        }

        // Variant 2: Keep the text inside the brackets, remove the parentheses ("football (game)" -> "football game")
        const withOptional = (before + inner + after).replace(RE_SPACES, " ").trim();
        if (withOptional !== answer && withOptional !== withoutOptional) {
            if (callback(withOptional)) {
                return true;
            }
        }

        return false;
    }
}

export { OptionalAnswerPartsModule as optionalAnswerPartsModule };
