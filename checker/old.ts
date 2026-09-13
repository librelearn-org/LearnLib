import { CheckConfig, goodDefaults } from "./shared";

export function checkAnswer(
    correctAnswerOG: string,
    userAnswerOG: string,
    config: CheckConfig = goodDefaults
): boolean {
    const fullConfig: CheckConfig = { ...goodDefaults, ...config };

    // normalize inputs
    let correctAnswer = correctAnswerOG.trim();
    let answer = userAnswerOG.trim();

    if (!fullConfig.caseSensitive) {
        correctAnswer = correctAnswer.toLowerCase();
        answer = answer.toLowerCase();
    }

    if (fullConfig.stripAccents) {
        correctAnswer = correctAnswer.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        answer = answer.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    if (answer === correctAnswer) return true;

    let isCorrect = false;

    const allowAlternatives = fullConfig.alternativeAnswers?.allow ?? true;
    const alternativeMode = fullConfig.alternativeAnswers?.mode ?? "both";
    const allowSentence = allowAlternatives && (alternativeMode === "both" || alternativeMode === "onlySentence");
    const allowSingleWord = allowAlternatives && (alternativeMode === "both" || alternativeMode === "onlySingleWord");

    if (allowSentence && correctAnswer.includes(" / ")) {
        const mogelijkeAntwoorden = correctAnswer.split(" / ");
        for (const mogelijkAntwoord of mogelijkeAntwoorden) {
            if (checkAnswer(mogelijkAntwoord, answer, fullConfig)) {
                isCorrect = true;
                break;
            }
        }
    }

    if (!isCorrect && fullConfig.allowOptionalAnswerParts && correctAnswer.includes("(")) {
        const antwoordZonderOptioneel = correctAnswer.replace(/\([^)]*\)/g, "").trim();
        const antwoordMetOptioneel = correctAnswer.replace(/\(([^)]*)\)/g, "$1").trim();
        if (answer === antwoordZonderOptioneel || answer === antwoordMetOptioneel) {
            isCorrect = true;
        }
    }

    if (!isCorrect && allowSingleWord && correctAnswer.includes("/")) {
        const antwoordWoorden = correctAnswer.split(" ");
        for (let i = 0; i < antwoordWoorden.length; i++) {
            const woord = antwoordWoorden[i];
            if (woord.includes("/")) {
                const mogelijkeWoorden = woord.split("/");
                for (const mogelijkWoord of mogelijkeWoorden) {
                    const mogelijkAntwoord = [...antwoordWoorden];
                    mogelijkAntwoord[i] = mogelijkWoord;
                    const mogelijkAntwoordStr = mogelijkAntwoord.join(" ");
                    if (checkAnswer(mogelijkAntwoordStr, answer, fullConfig)) {
                        isCorrect = true;
                        break;
                    }
                }
                if (isCorrect) break;
            }
        }
    }

    return isCorrect;
}