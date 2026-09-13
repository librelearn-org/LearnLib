import { CheckConfig, CheckModule, Preprocessor, goodDefaults, LowestCheckFunction } from "./shared";
import { globalModuleTracker } from "../moduleSystem";

export type { CheckConfig, CheckModule, Preprocessor, LowestCheckFunction } from "./shared";
export { goodDefaults } from "./shared";

export function normalize(s: string): string {
  return s.trim();
}

export function preprocess(
  s: string,
  preprocessors?: Preprocessor[],
  config?: CheckConfig
): string {
  let res = s.trim();
  const activePreprocessors = preprocessors ?? globalModuleTracker.getPreprocessors();
  for (let i = 0; i < activePreprocessors.length; i++) {
    res = activePreprocessors[i].preprocess(res, config);
  }
  return res.trim();
}

export function checkAnswer(
  correctAnswerOG: string,
  userAnswerOG: string,
  config: CheckConfig = goodDefaults,
  customModules?: CheckModule[],
  customPreprocessors?: Preprocessor[]
): boolean {
  const activePreprocessors = customPreprocessors ?? globalModuleTracker.getPreprocessors();
  const activeModules = customModules ?? globalModuleTracker.getCheckerModules();

  // Preprocessors run ONCE before the main checking loop
  const userAnswer = preprocess(userAnswerOG, activePreprocessors, config);
  const preprocessedCorrect = preprocess(correctAnswerOG, activePreprocessors, config);

  const visited = new Set<string>();

  const check = (correctAnswerVariant: string): boolean => {
    const trimmedVariant = correctAnswerVariant.trim();
    if (trimmedVariant === userAnswer) {
      return true;
    }
    if (visited.has(trimmedVariant)) {
      return false;
    }
    visited.add(trimmedVariant);

    for (let i = 0; i < activeModules.length; i++) {
      if (activeModules[i].check(trimmedVariant, check, config)) {
        return true;
      }
    }
    return false;
  };

  return check(preprocessedCorrect);
}
