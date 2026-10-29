import { CheckConfig, CheckModule, LowestCheckFunction } from "../shared";
import { extractDefaults, InferConfig } from "../../configSystem";

export const unorderedAnswerPartsSchema = {
    allow: {
        type: "boolean",
        default: true,
        label: {
            EN: "Allow unordered answer parts",
            NL: "Ongeordende antwoorddelen toestaan",
        },
        description: {
            EN: "Allow parts of the answer enclosed in square brackets [a,b,c] in any order",
            NL: "Sta delen van het antwoord tussen blokhaken [a,b,c] in willekeurige volgorde toe",
        },
    },
    maxItems: {
        type: "number",
        default: 5,
        min: 2,
        max: 7,
        step: 1,
        label: {
            EN: "Maximum items per list",
            NL: "Maximaal aantal items per lijst",
        },
        description: {
            EN: "Limit the number of items in [a,b,c] to prevent factorial (x!) explosion",
            NL: "Beperk het aantal items in [a,b,c] om faculteitsexplosie (x!) te voorkomen",
        },
    },
} as const;

export type UnorderedAnswerPartsConfig = InferConfig<typeof unorderedAnswerPartsSchema>;

const RE_FIRST_UNORDERED = /\[([^\]]+)\]/;
const RE_SPACES = /\s+/g;

export class UnorderedAnswerPartsModule implements CheckModule<typeof unorderedAnswerPartsSchema> {
    type = "checker" as const;
    id = "unorderedAnswerParts";
    name = {
        EN: "Unordered Answer Parts",
        NL: "Ongeordende Antwoorddelen",
    };
    description = {
        EN: "Allow the parts of the answer between square brackets in any order [a,b,c]",
        NL: "Sta de delen van het antwoord tussen blokhaken in willekeurige volgorde toe [a,b,c]",
    };
    schema = unorderedAnswerPartsSchema;
    config = extractDefaults(unorderedAnswerPartsSchema);

    check(answer: string, callback: LowestCheckFunction, config?: CheckConfig): boolean {
        const isAllowed = config?.allowUnorderedAnswerParts ?? this.config.allow;
        if (isAllowed === false) {
            return false;
        }

        // Fast path: Only run if both square brackets exist in the answer string
        if (answer.indexOf("[") === -1 || answer.indexOf("]") === -1) {
            return false;
        }

        const match = answer.match(RE_FIRST_UNORDERED);
        if (!match || match.index === undefined) {
            return false;
        }

        const before = answer.slice(0, match.index);
        const after = answer.slice(match.index + match[0].length);
        const items = match[1]
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

        if (items.length === 0) {
            return false;
        }

        const maxItems = this.config.maxItems ?? 5;

        // Guard against factorial (x!) explosion when list is too large
        if (items.length > maxItems) {
            const joined = (before + items.join(" ") + after).replace(RE_SPACES, " ").trim();
            if (joined !== answer && callback(joined)) {
                return true;
            }
            return false;
        }

        return this.permuteAndCheck(items, 0, before, after, answer, callback);
    }

    private permuteAndCheck(
        items: string[],
        start: number,
        before: string,
        after: string,
        originalAnswer: string,
        callback: LowestCheckFunction
    ): boolean {
        if (start === items.length - 1) {
            const variant = (before + items.join(" ") + after).replace(RE_SPACES, " ").trim();
            if (variant !== originalAnswer && callback(variant)) {
                return true;
            }
            return false;
        }

        const swapped = new Set<string>();
        for (let i = start; i < items.length; i++) {
            if (swapped.has(items[i])) continue;
            swapped.add(items[i]);

            // Swap
            const temp = items[start];
            items[start] = items[i];
            items[i] = temp;

            if (this.permuteAndCheck(items, start + 1, before, after, originalAnswer, callback)) {
                // Restore before returning
                items[i] = items[start];
                items[start] = temp;
                return true;
            }

            // Backtrack
            items[i] = items[start];
            items[start] = temp;
        }

        return false;
    }
}

export { UnorderedAnswerPartsModule as unorderedAnswerPartsModule };
