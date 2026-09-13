# Making a module

If you want to extend the functionality of Learnlib you can create your own module.

## what is a module?

A module is a class containing a function that is called by learnlib instead of hardcoding functionality into the core of learnlib. This allows you to add new features without modifying the core codebase.
We have multiple different types of modules, each with a different purpose. 

## how to know which module type to use?

The type of module you should create depends on what you want to achieve. If you want to add a new scheduler, you should create a method module. If you want to add a new rule to the checker, such as `|` for that the user must enter the answer of both the text on its left and right in any order, you should create a checker module.
But if you want to add a new thing like `stripAccents`, you should create a preprocessor module.

Here is a table of the different module types and their purpose:

| Module Type | Purpose |
|-------------|---------|
| `Method`      | To add new scheduling methods |
| `Checker`     | To add new rules to the checker |
| `Preprocessor` | To add new preprocessing functions |
| `queueUpdater` | To add new behavior on how the queue is updated after grading |
| `gradeMaker` | To add new behavior on how we get a grade from a true/false boolean value |