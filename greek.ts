// ik ben lui AF dus chatgpt kan dit doen



type GreekMap = { [key: string]: string };

// Core mapping of lowercase Greek letters to Latin phonetics
const GREEK_TO_LATIN: GreekMap = {
  α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th',
  ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p',
  ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o'
};
/**
 * Converts Greek text to phonetic Latin script, stripping diacritics.
 * Handles casing while maintaining non-mapped characters (spaces, punctuation).
 */
export function greekToLatin(text: string): string {
  // NFD separates letters from their combining diacritics (e.g., "έ" becomes "ε" + "◌́")
  const normalized = text.normalize('NFD');
  
  return Array.from(normalized)
    .map(char => {
      const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
      const lowerChar = char.toLowerCase();
      
      // If it's a combining diacritic mark, skip it
      if (char.match(/[\u0300-\u036f]/)) return '';
      
      if (GREEK_TO_LATIN[lowerChar]) {
        const mapped = GREEK_TO_LATIN[lowerChar];
        return isUpper ? mapped.charAt(0).toUpperCase() + mapped.slice(1) : mapped;
      }
      
      return char;
    })
    .join('');
}