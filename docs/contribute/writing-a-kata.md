# Writing a DataDojo Kata 🥋

Welcome, author! Katas are the heartbeat of DataDojo. Our goal is to make total beginners feel capable, curious, and celebrated.

---

## 🎯 Kata Philosophy
1. **One Idea Per Kata**: A single concept mastered deeply in ~5 minutes.
2. **Grade 7 Reading Level**: Short, clear sentences. No jargon without an explanation or glossary tooltip.
3. **Mistakes Are Celebrated**: Errors are normal. We actively encourage learners to break code on purpose to remove fear.
4. **Sparring Tests Techniques**: Every exercise has instant feedback and a 3-step hint ladder.

---

## 📋 The Anatomy of a Kata
Every kata markdown file (e.g. `docs/belts/white/01-hello-dojo.md`) follows this exact structure:

```markdown
---
title: Human Friendly Title
belt: white
minutes: 5
goal: One-sentence goal of what the learner will accomplish.
---

# Kata XX: Title 🥋

## 🎯 Why This Matters
One warm sentence explaining the real-world value of this skill.

---

## 🥋 Try It Out
A simple explanation followed by a live runnable block:

\`\`\`dojo-run
print("See it in action!")
\`\`\`

---

## 💡 What Just Happened?
Brief explanation of the concept with glossary tooltips if introducing new terms:
<abbr class="dojo-term" data-term="variable">variable</abbr>

---

## 🤔 Predict, Then Run
A short code puzzle where the learner guesses before revealing the answer:

\`\`\`dojo-run
print(2 + 2)
\`\`\`

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>Explanation of what prints and why.</p>
  </details>
</div>

---

## 💥 Break It On Purpose!
Intentionally introduce an error so the learner learns how to read Sensei hints:

\`\`\`dojo-run
# ci: skip
broken_code(
\`\`\`

---

## 🥊 Sparring Exercise
The exercise block with tests, tips ladder, and solution:

\`\`\`dojo-exercise
id: white-01-hello
xp: 10
%% starter
# Initial starter code with blanks ___
%% tests
# Assertions using Dojo test helpers
check(has_var("x"), "Create variable x.")
%% tips
Tip 1: First hint gives a direction.
Tip 2: Second hint narrows down syntax.
Tip 3: Third hint gives the near-exact answer.
%% solution
# Full working solution
\`\`\`

---

## 📝 Recap
3 bullet points reviewing key takeaways and a link to the next kata.
```

---

## 🥊 The `dojo-exercise` Format
- **Metadata**: Lines before the first `%%` section define `id:` and `xp:`.
- **Allowed Sections**:
  - `%% starter`: The code initially displayed to the learner. Must fail at least one test.
  - `%% tests`: Python assertions using helper functions (`check`, `stdout_contains`, `stdout_equals`, `var`, `has_var`).
  - `%% tips`: Exactly 3 tips labeled `Tip 1:`, `Tip 2:`, `Tip 3:`.
  - `%% solution`: The working code. Must pass all tests. (Separated into JSON at build time to prevent spoilers).

---

## 🧪 Validating Your Kata
Run the local validator before submitting:

```bash
python tools/validate_katas.py
```

The validator checks:
- Required front matter keys and valid belt.
- Unique exercise IDs across the site.
- Exactly 3 tips per exercise.
- Solution passes all tests in CPython.
- Starter code fails at least one test.
- Navigation links and internal page references.

---

## 🤝 The Beginner Test
Before opening a Pull Request:
1. **Test with a real beginner**: Ask someone who does not code to sit at your screen and complete your kata without help.
2. Note where they paused or frowned.
3. Simplify wording and refine your tips until they can complete it smoothly!
