# Learnlib checker

The checker is one of the main components of learnlib. Its purpose is to check the correctness of the answers provided by the user. It is designed to be modular and extensible, allowing library users to easily add domain-specific checkers.

## How it works

The checker works by taking the correct answer and the user's answer and comparing them. If the answers match, `true` is returned; otherwise the checker will call the first module to branch candidate answer variants. For every possible variant, the module will invoke the callback again to see if the variant matches. If any branch matches, `true` is returned; otherwise we proceed to the next module. If all modules have been evaluated and no match has been found, `false` is returned.

## Adding a new checker

Create a new file in `modules` and implement the `CheckModule` interface. Implement the required properties/methods and register your module in `moduleSystem.ts` or via `globalModuleTracker.register()`. The checker will automatically pick up your module and use it when checking answers. After writing your module, make sure to write unit and performance tests for it.

## Performance

Make sure your module is performant, as the checker may evaluate multiple branches. If your module is slow, it will slow down answer validation. Make sure to write tests for your module and run them to ensure high throughput.

Make sure to define compiled regular expressions outside of your checking functions!

Preprocessors are only called once per answer input, but checker modules branch during DFS, so keep variant generation minimal and avoid redundant allocations.
