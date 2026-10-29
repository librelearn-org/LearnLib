import { Preprocessor, CheckConfig } from "../shared";
import { extractDefaults, InferConfig } from "../../configSystem";

export const DEFAULT_ARTICLES = [
    "de",
    "het",
    "een",
    "the",
    "a",
    "an",
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "der",
    "die",
    "das",
    "ein",
    "eine",
];

export const removeArticlesSchema = {
    enabled: {
        type: "boolean",
        default: false,
        label: {
            EN: "Remove Articles",
            NL: "Lidwoorden negeren",
        },
        description: {
            EN: "Ignore leading articles such as 'de', 'het', 'een', 'the', 'le', 'la', 'der', 'die', 'das'",
            NL: "Negeer lidwoorden zoals 'de', 'het', 'een', 'the', 'le', 'la', 'der', 'die', 'das'",
        },
    },
    articles: {
        type: "array",
        items: "string",
        default: DEFAULT_ARTICLES,
        label: {
            EN: "Articles",
            NL: "Lidwoorden",
        },
        description: {
            EN: "List of articles to strip from the start of answers",
            NL: "Lijst met lidwoorden die aan het begin van antwoorden worden verwijderd",
        },
    },
} as const;

export type RemoveArticlesConfig = InferConfig<typeof removeArticlesSchema>;

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class RemoveArticlesPreprocessor implements Preprocessor<typeof removeArticlesSchema> {
    type = "preprocessor" as const;
    id = "removeArticles";
    name = {
        EN: "Remove Articles",
        NL: "Lidwoorden negeren",
    };
    description = {
        EN: "Strips articles (e.g. de, het, een, the) from answers so they become optional. works with french, german and dutch.",
        NL: "Verwijdert lidwoorden (bijv. de, het, een, the) uit antwoorden zodat ze optioneel zijn. werkt met frans, duits en nederlands.",
    };

    schema = removeArticlesSchema;
    config = extractDefaults(removeArticlesSchema);

    private cachedArticlesKey = "";
    private cachedRegex: RegExp | null = null;

    private getRegex(articles: readonly string[]): RegExp | null {
        if (articles.length === 0) return null;
        const key = articles.join("|");
        if (key === this.cachedArticlesKey && this.cachedRegex) {
            return this.cachedRegex;
        }
        const pattern = articles
            .map((a) => a.trim())
            .filter((a) => a.length > 0)
            .map(escapeRegex)
            .join("|");
        if (!pattern) return null;

        // Matches an article at the start of the string or right after '/', '[', or ','
        // when followed by at least one space and a non-space character
        this.cachedArticlesKey = key;
        this.cachedRegex = new RegExp(`(^|[\\/[\\,]\\s*)(?:${pattern})\\s+(?=\\S)`, "gi");
        return this.cachedRegex;
    }

    preprocess(inputString: string, config?: CheckConfig): string {
        const shouldRemove = config?.removeArticles !== undefined
            ? config.removeArticles
            : this.config.enabled;

        if (!shouldRemove) {
            return inputString;
        }

        const regex = this.getRegex(this.config.articles ?? DEFAULT_ARTICLES);
        if (!regex) {
            return inputString;
        }

        return inputString.replace(regex, "$1").trim();
    }
}

export { RemoveArticlesPreprocessor as removeArticlesPreprocessor };
