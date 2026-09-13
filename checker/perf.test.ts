/// <reference types="bun-types" />
import { describe, it, expect } from "bun:test";
import { checkAnswer as checkAnswerBase } from "./base";
import { checkAnswer as checkAnswerOld } from "./old";
import { wordChecker } from "./compiled";
import { CheckConfig } from "./shared";

interface BenchmarkResult {
    name: string;
    iterations: number;
    totalMs: number;
    opsPerSec: number;
    avgTimeUs: number;
}

function benchmarkSync(
    name: string,
    fn: () => void,
    iterations: number = 50_000,
    warmup: number = 2_000
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
    const opsPerSec = Math.round((iterations / totalMs) * 1000);
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
    warmup: number = 2_000
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
    const opsPerSec = Math.round((iterations / totalMs) * 1000);
    const avgTimeUs = Number(((totalMs / iterations) * 1000).toFixed(3));

    return {
        name,
        iterations,
        totalMs: Number(totalMs.toFixed(2)),
        opsPerSec,
        avgTimeUs,
    };
}

function printBenchmarkTable(title: string, results: BenchmarkResult[]) {
    console.log(`\n=== Benchmark: ${title} ===`);
    const tableData = results.map((r) => ({
        "Checker": r.name,
        "Iterations": r.iterations.toLocaleString(),
        "Total (ms)": `${r.totalMs} ms`,
        "Ops / sec": r.opsPerSec.toLocaleString(),
        "Avg Time (µs)": `${r.avgTimeUs} µs`,
    }));
    console.table(tableData);
}

describe("Checker Performance Tests", () => {
    const config: CheckConfig = {
        allowOptionalAnswerParts: true,
        caseSensitive: false,
        alternativeAnswers: {
            allow: true,
            mode: "both",
        },
    };

    describe("1. Exact Match Performance", () => {
        it("compares exact string matches across checkers", async () => {
            const correctAnswer = "Amsterdam";
            const userAnswer = "amsterdam";

            const compiled = new wordChecker(correctAnswer, config);
            compiled.compile();
            await compiled.check(userAnswer);

            const iterations = 100_000;
            const results: BenchmarkResult[] = [
                benchmarkSync("Old (Monolithic)", () => {
                    checkAnswerOld(correctAnswer, userAnswer, config);
                }, iterations),
                benchmarkSync("Base (Modular)", () => {
                    checkAnswerBase(correctAnswer, userAnswer, config);
                }, iterations),
                await benchmarkAsync("Compiled (wordChecker.check - async)", async () => {
                    await compiled.check(userAnswer);
                }, iterations),
                benchmarkSync("Compiled (wordChecker.checkSync - sync)", () => {
                    compiled.checkSync(userAnswer);
                }, iterations),
            ];

            printBenchmarkTable("Exact Match ('Amsterdam' vs 'amsterdam')", results);

            expect(checkAnswerOld(correctAnswer, userAnswer, config)).toBe(true);
            expect(checkAnswerBase(correctAnswer, userAnswer, config)).toBe(true);
            expect(await compiled.check(userAnswer)).toBe(true);
            expect(compiled.checkSync(userAnswer)).toBe(true);
            expect(results.every((r) => r.opsPerSec > 0)).toBe(true);
        });
    });

    describe("2. Mismatch / Negative Match Performance (Worst Case Traversal)", () => {
        it("measures throughput when answers do not match", async () => {
            const correctAnswer = "Nederland";
            const wrongUserAnswer = "Frankrijk";

            const compiled = new wordChecker(correctAnswer, config);
            compiled.compile();
            await compiled.check(wrongUserAnswer);

            const iterations = 100_000;
            const results: BenchmarkResult[] = [
                benchmarkSync("Old (Monolithic)", () => {
                    checkAnswerOld(correctAnswer, wrongUserAnswer, config);
                }, iterations),
                benchmarkSync("Base (Modular)", () => {
                    checkAnswerBase(correctAnswer, wrongUserAnswer, config);
                }, iterations),
                await benchmarkAsync("Compiled (wordChecker.check - async)", async () => {
                    await compiled.check(wrongUserAnswer);
                }, iterations),
                benchmarkSync("Compiled (wordChecker.checkSync - sync)", () => {
                    compiled.checkSync(wrongUserAnswer);
                }, iterations),
            ];

            printBenchmarkTable("Negative Match ('Nederland' vs 'Frankrijk')", results);

            expect(checkAnswerOld(correctAnswer, wrongUserAnswer, config)).toBe(false);
            expect(checkAnswerBase(correctAnswer, wrongUserAnswer, config)).toBe(false);
            expect(await compiled.check(wrongUserAnswer)).toBe(false);
            expect(compiled.checkSync(wrongUserAnswer)).toBe(false);
            expect(results.every((r) => r.opsPerSec > 0)).toBe(true);
        });
    });

    describe("3. Optional Answer Parts (Parentheses parsing & variants)", () => {
        it("benchmarks answers containing optional parentheses", async () => {
            const correctAnswer = "voetbal (spel)";
            const userAnswer = "voetbal";

            const compiled = new wordChecker(correctAnswer, config);
            compiled.compile();
            await compiled.check(userAnswer);

            const iterations = 50_000;
            const results: BenchmarkResult[] = [
                benchmarkSync("Old (Monolithic)", () => {
                    checkAnswerOld(correctAnswer, userAnswer, config);
                }, iterations),
                benchmarkSync("Base (Modular)", () => {
                    checkAnswerBase(correctAnswer, userAnswer, config);
                }, iterations),
                await benchmarkAsync("Compiled (wordChecker.check - async)", async () => {
                    await compiled.check(userAnswer);
                }, iterations),
                benchmarkSync("Compiled (wordChecker.checkSync - sync)", () => {
                    compiled.checkSync(userAnswer);
                }, iterations),
            ];

            printBenchmarkTable("Optional Parentheses ('voetbal (spel)' vs 'voetbal')", results);

            expect(checkAnswerOld(correctAnswer, userAnswer, config)).toBe(true);
            expect(checkAnswerBase(correctAnswer, userAnswer, config)).toBe(true);
            expect(await compiled.check(userAnswer)).toBe(true);
            expect(compiled.checkSync(userAnswer)).toBe(true);
            expect(results.every((r) => r.opsPerSec > 0)).toBe(true);
        });
    });

    describe("4. Alternative Answers: Sentence-Level Split (' / ')", () => {
        it("benchmarks sentence-level alternative answers", async () => {
            const correctAnswer = "hond / kat / konijn / vogel";
            const userAnswer = "kat";

            const compiled = new wordChecker(correctAnswer, config);
            compiled.compile();
            await compiled.check(userAnswer);

            const iterations = 50_000;
            const results: BenchmarkResult[] = [
                benchmarkSync("Old (Monolithic)", () => {
                    checkAnswerOld(correctAnswer, userAnswer, config);
                }, iterations),
                benchmarkSync("Base (Modular)", () => {
                    checkAnswerBase(correctAnswer, userAnswer, config);
                }, iterations),
                await benchmarkAsync("Compiled (wordChecker.check - async)", async () => {
                    await compiled.check(userAnswer);
                }, iterations),
                benchmarkSync("Compiled (wordChecker.checkSync - sync)", () => {
                    compiled.checkSync(userAnswer);
                }, iterations),
            ];

            printBenchmarkTable("Sentence Alternatives ('hond / kat / konijn / vogel' vs 'kat')", results);

            expect(checkAnswerOld(correctAnswer, userAnswer, config)).toBe(true);
            expect(checkAnswerBase(correctAnswer, userAnswer, config)).toBe(true);
            expect(await compiled.check(userAnswer)).toBe(true);
            expect(compiled.checkSync(userAnswer)).toBe(true);
            expect(results.every((r) => r.opsPerSec > 0)).toBe(true);
        });
    });

    describe("5. Alternative Answers: Single-Word Sub-Sentence ('word1/word2')", () => {
        it("benchmarks inline single-word slash alternative answers", async () => {
            const correctAnswer = "de kleur is rood/blauw/groen vanmorgen";
            const userAnswer = "de kleur is blauw vanmorgen";

            const compiled = new wordChecker(correctAnswer, config);
            compiled.compile();
            await compiled.check(userAnswer);

            const iterations = 40_000;
            const results: BenchmarkResult[] = [
                benchmarkSync("Old (Monolithic)", () => {
                    checkAnswerOld(correctAnswer, userAnswer, config);
                }, iterations),
                benchmarkSync("Base (Modular)", () => {
                    checkAnswerBase(correctAnswer, userAnswer, config);
                }, iterations),
                await benchmarkAsync("Compiled (wordChecker.check - async)", async () => {
                    await compiled.check(userAnswer);
                }, iterations),
                benchmarkSync("Compiled (wordChecker.checkSync - sync)", () => {
                    compiled.checkSync(userAnswer);
                }, iterations),
            ];

            printBenchmarkTable("Single-Word Alternative ('de kleur is rood/blauw/groen...' vs '...blauw...')", results);

            expect(checkAnswerOld(correctAnswer, userAnswer, config)).toBe(true);
            expect(checkAnswerBase(correctAnswer, userAnswer, config)).toBe(true);
            expect(await compiled.check(userAnswer)).toBe(true);
            expect(compiled.checkSync(userAnswer)).toBe(true);
            expect(results.every((r) => r.opsPerSec > 0)).toBe(true);
        });
    });

    describe("6. Combined Parentheses & Slashes ('(un/le) iets/anders')", () => {
        it("benchmarks composite rules combining brackets and multiple alternatives", async () => {
            const correctAnswer = "(un/le) auto/wagen";
            const userAnswer = "le auto";

            const compiled = new wordChecker(correctAnswer, config);
            compiled.compile();
            await compiled.check(userAnswer);

            const iterations = 40_000;
            const results: BenchmarkResult[] = [
                benchmarkSync("Old (Monolithic)", () => {
                    checkAnswerOld(correctAnswer, userAnswer, config);
                }, iterations),
                benchmarkSync("Base (Modular)", () => {
                    checkAnswerBase(correctAnswer, userAnswer, config);
                }, iterations),
                await benchmarkAsync("Compiled (wordChecker.check - async)", async () => {
                    await compiled.check(userAnswer);
                }, iterations),
                benchmarkSync("Compiled (wordChecker.checkSync - sync)", () => {
                    compiled.checkSync(userAnswer);
                }, iterations),
            ];

            printBenchmarkTable("Combined Brackets & Slashes ('(un/le) auto/wagen' vs 'le auto')", results);

            // Old monolithic checker does not support multi-level recursion, returns false
            expect(checkAnswerOld(correctAnswer, userAnswer, config)).toBe(false);
            expect(checkAnswerBase(correctAnswer, userAnswer, config)).toBe(true);
            expect(await compiled.check(userAnswer)).toBe(true);
            expect(compiled.checkSync(userAnswer)).toBe(true);
            expect(results.every((r) => r.opsPerSec > 0)).toBe(true);
        });
    });

    describe("7. Deck Lifecycle: Concurrent Compilation vs Fast Query", () => {
        it("measures concurrent deck compilation vs repeated query throughput", async () => {
            const deckWords = [
                "fiets (rijwiel)",
                "hardlopen (sport)",
                "hond / kat / konijn",
                "hij/zij loopt snel",
                "Parijs",
                "(un/le) café/thé",
                "Berlijn",
                "tafel (meubel)",
                "stoel (zitmeubel)",
                "computer (pc/mac)",
            ];

            const deckSize = 500;
            const expandedDeck = Array.from({ length: deckSize }, (_, i) => deckWords[i % deckWords.length]);

            const compileStart = performance.now();
            const compiledDeck = expandedDeck.map((word) => {
                const checker = new wordChecker(word, config);
                checker.compile();
                return checker;
            });
            await Promise.all(compiledDeck.map((c) => c.check("test")));
            const compileEnd = performance.now();

            const batchCompileMs = Number((compileEnd - compileStart).toFixed(2));
            const compileOpsPerSec = Math.round((deckSize / batchCompileMs) * 1000);

            console.log(`\n=== Benchmark: Deck Load (Concurrent Compilation) ===`);
            console.log(`  - Compiled ${deckSize} multi-rule cards in ${batchCompileMs} ms (${compileOpsPerSec.toLocaleString()} cards/sec)`);

            const queryIterations = 50_000;
            const sampleWord = "(un/le) café/thé";
            const sampleUserAnswer = "un cafe";

            const singleCompiled = new wordChecker(sampleWord, config);
            singleCompiled.compile();
            await singleCompiled.check(sampleUserAnswer);

            const results: BenchmarkResult[] = [
                {
                    name: "wordChecker (Concurrent Batch Compile)",
                    iterations: deckSize,
                    totalMs: batchCompileMs,
                    opsPerSec: compileOpsPerSec,
                    avgTimeUs: Number(((batchCompileMs / deckSize) * 1000).toFixed(3)),
                },
                benchmarkSync("Old (Monolithic Query)", () => {
                    checkAnswerOld(sampleWord, sampleUserAnswer, config);
                }, queryIterations),
                benchmarkSync("Base (Modular Query)", () => {
                    checkAnswerBase(sampleWord, sampleUserAnswer, config);
                }, queryIterations),
                await benchmarkAsync("wordChecker (Cached Async Query)", async () => {
                    await singleCompiled.check(sampleUserAnswer);
                }, queryIterations),
                benchmarkSync("wordChecker (Cached Sync Query)", () => {
                    singleCompiled.checkSync(sampleUserAnswer);
                }, queryIterations),
            ];

            printBenchmarkTable("Deck Lifecycle: Batch Compile vs Query", results);

            expect(batchCompileMs).toBeGreaterThan(0);
            expect(compileOpsPerSec).toBeGreaterThan(0);
        });
    });

    describe("8. Mixed Workload Simulation (Real-world Flashcard Session)", () => {
        it("benchmarks a realistic study session with varying answer types", async () => {
            const testCases = [
                { correct: "Parijs", user: "parijs", desc: "exact lowercase" },
                { correct: "voetbal (spel)", user: "voetbal", desc: "optional part omitted" },
                { correct: "hond / kat / konijn", user: "kat", desc: "sentence alternative" },
                { correct: "hij/zij loopt", user: "zij loopt", desc: "single-word alternative" },
                { correct: "(un/le) café/thé", user: "un cafe", desc: "bracket + slash combination" },
                { correct: "Computer", user: "  COMPUTER  ", desc: "whitespace and uppercase" },
                { correct: "olifant", user: "giraf", desc: "negative mismatch" },
            ];

            const compiledCheckers = await Promise.all(
                testCases.map(async (tc) => {
                    const checker = new wordChecker(tc.correct, config);
                    checker.compile();
                    await checker.check(tc.user);
                    return { checker, user: tc.user };
                })
            );

            const iterations = 20_000;
            const results: BenchmarkResult[] = [
                benchmarkSync(
                    "Old (Monolithic)",
                    () => {
                        for (let i = 0; i < testCases.length; i++) {
                            checkAnswerOld(testCases[i].correct, testCases[i].user, config);
                        }
                    },
                    iterations
                ),
                benchmarkSync(
                    "Base (Modular)",
                    () => {
                        for (let i = 0; i < testCases.length; i++) {
                            checkAnswerBase(testCases[i].correct, testCases[i].user, config);
                        }
                    },
                    iterations
                ),
                await benchmarkAsync(
                    "Compiled (wordChecker - async)",
                    async () => {
                        for (let i = 0; i < compiledCheckers.length; i++) {
                            await compiledCheckers[i].checker.check(compiledCheckers[i].user);
                        }
                    },
                    iterations
                ),
                benchmarkSync(
                    "Compiled (wordChecker - sync)",
                    () => {
                        for (let i = 0; i < compiledCheckers.length; i++) {
                            compiledCheckers[i].checker.checkSync(compiledCheckers[i].user);
                        }
                    },
                    iterations
                ),
            ];

            printBenchmarkTable("Mixed Workload (7 diverse scenarios per iteration)", results);

            expect(results.every((r) => r.opsPerSec > 0)).toBe(true);
        });
    });

    describe("9. Absolute Worst-Case Multi-Branching Mismatch", () => {
        it("measures worst-case performance when full combinatorial tree must be traversed", async () => {
            // Highly combinatorial card with 192+ permutations
            const worstCaseTarget = "(het/een) (zeer/heel) (mooie/prachtige) grote/kleine rode/blauwe auto/wagen/voertuig (uit 2024)";
            const wrongAnswer = "volledig_onjuist_antwoord_om_alle_takken_te_doorlopen";

            const compiled = new wordChecker(worstCaseTarget, config);
            compiled.compile();
            await compiled.check(wrongAnswer);

            const iterations = 50;
            const results: BenchmarkResult[] = [
                benchmarkSync("Old (Monolithic)", () => {
                    checkAnswerOld(worstCaseTarget, wrongAnswer, config);
                }, iterations, 2),
                benchmarkSync("Base (Modular DFS Traversal)", () => {
                    checkAnswerBase(worstCaseTarget, wrongAnswer, config);
                }, iterations, 2),
                await benchmarkAsync("Compiled (Async check)", async () => {
                    await compiled.check(wrongAnswer);
                }, iterations, 2),
                benchmarkSync("Compiled (Sync checkSync - O(1) Set lookup)", () => {
                    compiled.checkSync(wrongAnswer);
                }, iterations, 2),
            ];

            printBenchmarkTable("Absolute Worst-Case Mismatch (192 permutations traversed)", results);

            expect(checkAnswerBase(worstCaseTarget, wrongAnswer, config)).toBe(false);
            expect(compiled.checkSync(wrongAnswer)).toBe(false);
            expect(results.every((r) => r.opsPerSec > 0)).toBe(true);
        });
    });
});
