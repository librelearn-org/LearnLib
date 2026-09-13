import { checkAnswer as checkAnswerBase } from "../checker/base";
import { checkAnswer as checkAnswerOld } from "../checker/old";
import { wordChecker } from "../checker/compiled";
import { CheckConfig } from "../checker/shared";

export interface BenchmarkResult {
    name: string;
    iterations: number;
    totalMs: number;
    opsPerSec: number;
    avgTimeUs: number;
}

export interface SuiteResult {
    id: string;
    title: string;
    description: string;
    results: BenchmarkResult[];
}

const config: CheckConfig = {
    allowOptionalAnswerParts: true,
    caseSensitive: false,
    alternativeAnswers: {
        allow: true,
        mode: "both",
    },
};

function benchmarkSync(
    name: string,
    fn: () => void,
    iterations: number = 50_000,
    warmup: number = 1_000
): BenchmarkResult {
    for (let i = 0; i < warmup; i++) {
        fn();
    }

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = performance.now();

    const totalMs = end - start;
    const opsPerSec = Math.round((iterations / (totalMs || 0.001)) * 1000);
    const avgTimeUs = Number(((totalMs / iterations) * 1000).toFixed(3));

    return {
        name,
        iterations,
        totalMs: Number(totalMs.toFixed(2)),
        opsPerSec,
        avgTimeUs,
    };
}

async function benchmarkAsync(
    name: string,
    fn: () => Promise<void> | void,
    iterations: number = 50_000,
    warmup: number = 1_000
): Promise<BenchmarkResult> {
    for (let i = 0; i < warmup; i++) {
        await fn();
    }

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        await fn();
    }
    const end = performance.now();

    const totalMs = end - start;
    const opsPerSec = Math.round((iterations / (totalMs || 0.001)) * 1000);
    const avgTimeUs = Number(((totalMs / iterations) * 1000).toFixed(3));

    return {
        name,
        iterations,
        totalMs: Number(totalMs.toFixed(2)),
        opsPerSec,
        avgTimeUs,
    };
}

export async function runAllBenchmarks(
    onProgress?: (current: number, total: number, suiteName: string) => void
): Promise<SuiteResult[]> {
    const suites: SuiteResult[] = [];
    const totalSuites = 8;
    let currentSuite = 0;

    // 1. Exact Match
    currentSuite++;
    onProgress?.(currentSuite, totalSuites, "1. Exact Match");
    await new Promise((r) => setTimeout(r, 10)); // Yield to UI
    {
        const correct = "Amsterdam";
        const user = "amsterdam";
        const compiled = new wordChecker(correct, config);
        compiled.compile();
        await compiled.check(user);

        const iters = 100_000;
        suites.push({
            id: "exact-match",
            title: "1. Exact Match Performance",
            description: "Compares exact string match ('Amsterdam' vs 'amsterdam')",
            results: [
                benchmarkSync("Old (Monolithic)", () => checkAnswerOld(correct, user, config), iters),
                benchmarkSync("Base (Modular)", () => checkAnswerBase(correct, user, config), iters),
                await benchmarkAsync("Compiled (Async check)", async () => { await compiled.check(user); }, iters),
                benchmarkSync("Compiled (Sync checkSync)", () => compiled.checkSync(user), iters),
            ],
        });
    }

    // 2. Negative Match
    currentSuite++;
    onProgress?.(currentSuite, totalSuites, "2. Negative Match");
    await new Promise((r) => setTimeout(r, 10));
    {
        const correct = "Nederland";
        const user = "Frankrijk";
        const compiled = new wordChecker(correct, config);
        compiled.compile();
        await compiled.check(user);

        const iters = 100_000;
        suites.push({
            id: "negative-match",
            title: "2. Negative Match Performance (Worst Case)",
            description: "Evaluates full rule traversal on mismatch ('Nederland' vs 'Frankrijk')",
            results: [
                benchmarkSync("Old (Monolithic)", () => checkAnswerOld(correct, user, config), iters),
                benchmarkSync("Base (Modular)", () => checkAnswerBase(correct, user, config), iters),
                await benchmarkAsync("Compiled (Async check)", async () => { await compiled.check(user); }, iters),
                benchmarkSync("Compiled (Sync checkSync)", () => compiled.checkSync(user), iters),
            ],
        });
    }

    // 3. Optional Parentheses
    currentSuite++;
    onProgress?.(currentSuite, totalSuites, "3. Optional Parentheses");
    await new Promise((r) => setTimeout(r, 10));
    {
        const correct = "voetbal (spel)";
        const user = "voetbal";
        const compiled = new wordChecker(correct, config);
        compiled.compile();
        await compiled.check(user);

        const iters = 50_000;
        suites.push({
            id: "optional-parts",
            title: "3. Optional Answer Parts (Parentheses)",
            description: "Tests bracket parsing ('voetbal (spel)' vs 'voetbal')",
            results: [
                benchmarkSync("Old (Monolithic)", () => checkAnswerOld(correct, user, config), iters),
                benchmarkSync("Base (Modular)", () => checkAnswerBase(correct, user, config), iters),
                await benchmarkAsync("Compiled (Async check)", async () => { await compiled.check(user); }, iters),
                benchmarkSync("Compiled (Sync checkSync)", () => compiled.checkSync(user), iters),
            ],
        });
    }

    // 4. Sentence Alternatives
    currentSuite++;
    onProgress?.(currentSuite, totalSuites, "4. Sentence Alternatives");
    await new Promise((r) => setTimeout(r, 10));
    {
        const correct = "hond / kat / konijn / vogel";
        const user = "kat";
        const compiled = new wordChecker(correct, config);
        compiled.compile();
        await compiled.check(user);

        const iters = 50_000;
        suites.push({
            id: "sentence-alternatives",
            title: "4. Sentence Alternatives (' / ')",
            description: "Tests sentence slash split ('hond / kat / konijn / vogel' vs 'kat')",
            results: [
                benchmarkSync("Old (Monolithic)", () => checkAnswerOld(correct, user, config), iters),
                benchmarkSync("Base (Modular)", () => checkAnswerBase(correct, user, config), iters),
                await benchmarkAsync("Compiled (Async check)", async () => { await compiled.check(user); }, iters),
                benchmarkSync("Compiled (Sync checkSync)", () => compiled.checkSync(user), iters),
            ],
        });
    }

    // 5. Single-Word Slashes
    currentSuite++;
    onProgress?.(currentSuite, totalSuites, "5. Single-Word Alternatives");
    await new Promise((r) => setTimeout(r, 10));
    {
        const correct = "de kleur is rood/blauw/groen vanmorgen";
        const user = "de kleur is blauw vanmorgen";
        const compiled = new wordChecker(correct, config);
        compiled.compile();
        await compiled.check(user);

        const iters = 40_000;
        suites.push({
            id: "single-word-alternatives",
            title: "5. Single-Word Slashes In Sentence",
            description: "Substitutes word options in sentence ('...rood/blauw/groen...' vs '...blauw...')",
            results: [
                benchmarkSync("Old (Monolithic)", () => checkAnswerOld(correct, user, config), iters),
                benchmarkSync("Base (Modular)", () => checkAnswerBase(correct, user, config), iters),
                await benchmarkAsync("Compiled (Async check)", async () => { await compiled.check(user); }, iters),
                benchmarkSync("Compiled (Sync checkSync)", () => compiled.checkSync(user), iters),
            ],
        });
    }

    // 6. Composite Rules
    currentSuite++;
    onProgress?.(currentSuite, totalSuites, "6. Composite Brackets & Slashes");
    await new Promise((r) => setTimeout(r, 10));
    {
        const correct = "(un/le) auto/wagen";
        const user = "le auto";
        const compiled = new wordChecker(correct, config);
        compiled.compile();
        await compiled.check(user);

        const iters = 40_000;
        suites.push({
            id: "composite-rules",
            title: "6. Composite Rules ('(un/le) auto/wagen')",
            description: "Evaluates recursive combination of parentheses and slashes ('(un/le) auto/wagen' vs 'le auto')",
            results: [
                benchmarkSync("Old (Monolithic)", () => checkAnswerOld(correct, user, config), iters),
                benchmarkSync("Base (Modular)", () => checkAnswerBase(correct, user, config), iters),
                await benchmarkAsync("Compiled (Async check)", async () => { await compiled.check(user); }, iters),
                benchmarkSync("Compiled (Sync checkSync)", () => compiled.checkSync(user), iters),
            ],
        });
    }

    // 7. Mixed Workload Simulation
    currentSuite++;
    onProgress?.(currentSuite, totalSuites, "7. Mixed Workload Session");
    await new Promise((r) => setTimeout(r, 10));
    {
        const testCases = [
            { correct: "Parijs", user: "parijs" },
            { correct: "voetbal (spel)", user: "voetbal" },
            { correct: "hond / kat / konijn", user: "kat" },
            { correct: "hij/zij loopt", user: "zij loopt" },
            { correct: "(un/le) café/thé", user: "un cafe" },
            { correct: "Computer", user: "  COMPUTER  " },
            { correct: "olifant", user: "giraf" },
        ];

        const compiledCheckers = await Promise.all(
            testCases.map(async (tc) => {
                const checker = new wordChecker(tc.correct, config);
                checker.compile();
                await checker.check(tc.user);
                return { checker, user: tc.user };
            })
        );

        const iters = 20_000;
        suites.push({
            id: "mixed-workload",
            title: "7. Mixed Workload Session",
            description: "Simulates 7 diverse real-world card checks per round (140,000 checks total)",
            results: [
                benchmarkSync("Old (Monolithic)", () => {
                    for (let i = 0; i < testCases.length; i++) checkAnswerOld(testCases[i].correct, testCases[i].user, config);
                }, iters),
                benchmarkSync("Base (Modular)", () => {
                    for (let i = 0; i < testCases.length; i++) checkAnswerBase(testCases[i].correct, testCases[i].user, config);
                }, iters),
                await benchmarkAsync("Compiled (Async check)", async () => {
                    for (let i = 0; i < compiledCheckers.length; i++) await compiledCheckers[i].checker.check(compiledCheckers[i].user);
                }, iters),
                benchmarkSync("Compiled (Sync checkSync)", () => {
                    for (let i = 0; i < compiledCheckers.length; i++) compiledCheckers[i].checker.checkSync(compiledCheckers[i].user);
                }, iters),
            ],
        });
    }

    // 8. Absolute Worst-Case Multi-Branching Mismatch
    currentSuite++;
    onProgress?.(currentSuite, totalSuites, "8. Worst-Case Multi-Branching Mismatch");
    await new Promise((r) => setTimeout(r, 10));
    {
        const worstCaseTarget = "(het/een) (zeer/heel) (mooie/prachtige) grote/kleine rode/blauwe auto/wagen/voertuig (uit 2024)";
        const wrongAnswer = "volledig_onjuist_antwoord_om_alle_takken_te_doorlopen";

        const compiled = new wordChecker(worstCaseTarget, config);
        compiled.compile();
        await compiled.check(wrongAnswer);

        const iters = 50;
        suites.push({
            id: "worst-case",
            title: "8. Absolute Worst-Case Mismatch",
            description: "Traverses full combinatorial search space (192 permutations) before returning false",
            results: [
                benchmarkSync("Old (Monolithic)", () => checkAnswerOld(worstCaseTarget, wrongAnswer, config), iters, 2),
                benchmarkSync("Base (Modular DFS Traversal)", () => checkAnswerBase(worstCaseTarget, wrongAnswer, config), iters, 2),
                await benchmarkAsync("Compiled (Async check)", async () => { await compiled.check(wrongAnswer); }, iters, 2),
                benchmarkSync("Compiled (Sync checkSync - O(1) Set lookup)", () => compiled.checkSync(wrongAnswer), iters, 2),
            ],
        });
    }

    return suites;
}

export function testCustomAnswer(correct: string, user: string, iters: number = 20_000) {
    const compiled = new wordChecker(correct, config);
    compiled.compileSync();

    const oldRes = checkAnswerOld(correct, user, config);
    const baseRes = checkAnswerBase(correct, user, config);
    const compiledRes = compiled.checkSync(user);

    const oldBench = benchmarkSync("Old (Monolithic)", () => checkAnswerOld(correct, user, config), iters);
    const baseBench = benchmarkSync("Base (Modular)", () => checkAnswerBase(correct, user, config), iters);
    const compBench = benchmarkSync("Compiled (Sync)", () => compiled.checkSync(user), iters);

    return {
        isMatch: { old: oldRes, base: baseRes, compiled: compiledRes },
        benchmarks: [oldBench, baseBench, compBench],
    };
}

// Attach to window for the HTML UI
if (typeof window !== "undefined") {
    (window as any).LearnlibPerf = {
        runAllBenchmarks,
        testCustomAnswer,
        checkAnswerBase,
        checkAnswerOld,
        wordChecker,
    };
}
