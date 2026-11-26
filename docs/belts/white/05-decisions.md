---
title: Decisions with If
belt: white
minutes: 5
goal: Make choices in code using if, elif, and else.
---

# Kata 05: Decisions with If 🥋

## 🎯 Why This Matters
Smart programs don't just run every line blindly.
They make choices: Did the player win? Is the score high enough? Is the user logged in?
In Python, we make decisions using `if` statements.

---

## 🥋 Try It Out
Press **Run** to check if a student has enough points to earn their belt:

```dojo-run
points = 85

if points >= 80:
    print("🥋 Congratulations! You earned your belt!")
else:
    print("Keep practicing at the dojo!")
```

---

## 💡 What Just Happened?
Python evaluated the test `points >= 80`.
A test that is either `True` or `False` is called a <abbr class="dojo-term" data-term="condition">condition</abbr>.

Here are the comparison operators Python uses:
- `==` (equal to)
- `!=` (not equal to)
- `>` (greater than) and `<` (less than)
- `>=` (greater or equal) and `<=` (less or equal)

Notice the indentation!
The lines inside the `if` and `else` blocks must be indented with 4 spaces.
That indentation tells Python which lines belong inside the decision.

---

## 🤔 Predict, Then Run
What happens when you test multiple conditions using `elif` (short for "else if")?

```dojo-run
energy = 45

if energy > 70:
    print("Full power!")
elif energy > 30:
    print("Ready to spar.")
else:
    print("Rest at the dojo bench.")
```

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>It prints <code>Ready to spar.</code> Python checks conditions top-to-bottom. Since <code>45 > 70</code> is False, but <code>45 > 30</code> is True, Python runs that block and skips the rest.</p>
  </details>
</div>

---

## 💥 Break It On Purpose!
A very common beginner mistake is using a single `=` instead of `==` inside an `if` statement:

```dojo-run
# ci: skip
belt = "white"
if belt = "white":
    print("White belt ninja!")
```

Press **Run** above. Python stops with a `SyntaxError: invalid syntax. Maybe you meant '==' or ':='?`.
Remember: a single `=` *assigns* a value, while double `==` *compares* two values!

---

## 🥊 Sparring Exercise: Arrange the Lines
Put the lines in the correct order to check if a test score passes.
A score of 70 or higher prints `"Pass"`, otherwise it prints `"Try again"`.
(Watch out for the distractor line!)

```dojo-order
id: white-05-order
%% lines
score = 85
if score >= 70:
    print("Pass")
else:
    print("Try again")
%% distractors
else score < 70:
%% tests
check(has_var("score"), "Keep the score variable.")
check(stdout_contains("Pass"), "Score 85 should print Pass.")
check(not stdout_contains("Try again"), "Score 85 should not print Try again.")
%% tips
Tip 1: First set score = 85.
Tip 2: Next put the if statement and indented print("Pass").
Tip 3: Finish with else: and indented print("Try again"). Do not include the distractor line!
```

---

## ❓ Quick Check

```dojo-quiz
id: white-05-quiz
? Which operator checks if two values are equal in an if statement?
+ ==
- =
- ===
? What happens when an if condition is False and there is no else block?
+ Python skips the if block and moves on to the next code
- Python crashes with an error
- The computer restarts
```

---

## 📝 Recap
- Use `if` to run code only when a condition is `True`.
- Use `elif` to check another condition when the first is `False`.
- Use `else` as a fallback when no other conditions matched.
- Indent code inside your blocks by 4 spaces.
- Use `==` to compare, not `=`.

[← Back to Kata 04](04-text.md) | [Continue to Kata 06: Storing Many Things in Lists →](06-lists.md)
