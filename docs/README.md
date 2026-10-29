---
description: "Modular flashcard learning, spaced repetition (FSRS), and flexible answer checking library for TypeScript and JavaScript."
icon: book-open
layout:
  width: wide
  title:
    visible: true
  description:
    visible: true
  tableOfContents:
    visible: true
  outline:
    visible: false
  pagination:
    visible: true
---

# LearnLib Documentation

Welcome to the documentation for **LearnLib** (<code class="expression">space.vars.package_name</code> `v`<code class="expression">space.vars.version</code>) — a modular, reactive flashcard learning and spaced repetition engine written in TypeScript.

{% hint style="info" %}
Looking for a real-world integration example? Check out **Librelearn** to see how LearnLib powers a full learning application.
{% endhint %}

## Explore the Documentation

<table data-view="cards">
  <thead>
    <tr>
      <th width="48"></th>
      <th></th>
      <th></th>
      <th data-hidden data-card-target data-type="content-ref"></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><i class="fa-bolt"></i></td>
      <td><strong>Installation & Quickstart</strong></td>
      <td>Install LearnLib and run your first flashcard review session in under five minutes.</td>
      <td><a href="getting-started/installation.md">installation</a></td>
    </tr>
    <tr>
      <td><i class="fa-play"></i></td>
      <td><strong>Using the Learnlib Class</strong></td>
      <td>Initialize sessions, override grades, persist state to localStorage, and bind to React or Svelte.</td>
      <td><a href="getting-started/using-learnlib.md">using-learnlib</a></td>
    </tr>
    <tr>
      <td><i class="fa-cubes"></i></td>
      <td><strong>Core Concepts</strong></td>
      <td>Understand how cards, learning methods, graders, queue updaters, and answer checkers fit together.</td>
      <td><a href="getting-started/core-concepts.md">core-concepts</a></td>
    </tr>
    <tr>
      <td><i class="fa-brain"></i></td>
      <td><strong>Learning Methods</strong></td>
      <td>Compare the Simple repetition method and the Free Spaced Repetition Scheduler (FSRS).</td>
      <td><a href="modules/learning-methods.md">learning-methods</a></td>
    </tr>
    <tr>
      <td><i class="fa-check-double"></i></td>
      <td><strong>Answer Checker</strong></td>
      <td>Support optional parts, unordered lists, alternatives, and ahead-of-time compiled checking.</td>
      <td><a href="modules/answer-checker.md">answer-checker</a></td>
    </tr>
    <tr>
      <td><i class="fa-sliders"></i></td>
      <td><strong>Module System & Registry</strong></td>
      <td>Register, inspect, and configure modules dynamically or generate settings UIs automatically.</td>
      <td><a href="configuration/module-system.md">module-system</a></td>
    </tr>
    <tr>
      <td><i class="fa-window-maximize"></i></td>
      <td><strong>Making a Module Settings GUI</strong></td>
      <td>Auto-generate localized settings forms from module schemas using getGuiConfigList().</td>
      <td><a href="configuration/module-settings-gui.md">module-settings-gui</a></td>
    </tr>
    <tr>
      <td><i class="fa-puzzle-piece"></i></td>
      <td><strong>Creating a Module</strong></td>
      <td>Extend LearnLib with custom scheduling algorithms, answer syntax rules, and preprocessors.</td>
      <td><a href="extending/creating-a-module.md">creating-a-module</a></td>
    </tr>
  </tbody>
</table>

## Key Highlights

{% columns %}
{% column %}
### Pluggable Architecture

Every stage of a review — preprocessing input, checking answer variants, computing a grade, scheduling the next review, and updating the active queue — is handled by an interchangeable module.
{% endcolumn %}

{% column %}
### Reactive State & GUI Schemas

Subscribe to state snapshots with `learnlib.subscribe()` for seamless UI integration (React `useSyncExternalStore`, Svelte stores, or vanilla JS), and auto-generate settings forms from typed module schemas.
{% endcolumn %}
{% endcolumns %}

<a href="https://github.com/siemvk/LearnLib" class="button primary" data-icon="github">View on GitHub</a>
