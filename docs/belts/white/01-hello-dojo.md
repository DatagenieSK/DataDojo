---
title: Your First Line of Python
belt: white
minutes: 5
goal: Print a greeting to the screen and learn how to run Python code.
---

# Kata 01: Your First Line of Python 🥋

## 🎯 Why This Matters
In DataDojo, each bite-sized lesson is a <abbr class="dojo-term" data-term="kata">kata</abbr>.
Computers cannot read our minds, so we use code to tell them exactly what to say and do.

---

## 🥋 Try It Out
In Python, the `print()` instruction tells the computer to display words on the screen.

Press **Run** (or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>) to test this code:

```dojo-run
print("Hello, Dojo!")
```

---

## 💡 What Just Happened?
You just ran a tiny <abbr class="dojo-term" data-term="program">program</abbr>!
- A **program** is a set of step-by-step instructions for a computer.
- The box above is an interactive <abbr class="dojo-term" data-term="cell">cell</abbr>. You can change the code inside and run it again anytime.
- The quotes `" "` tell Python: *"this is plain text, not code instructions."*

---

## 🤔 Predict, Then Run
Look at this code before pressing Run. What do you think will appear on the screen?

```dojo-run
print("🥋 Bow to your sensei!")
print("3... 2... 1... Go!")
```

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>Python prints each <code>print()</code> instruction on a new line:</p>
    <pre>🥋 Bow to your sensei!
3... 2... 1... Go!</pre>
  </details>
</div>

---

## 💥 Break It On Purpose!
Mistakes are how every great coder learns.
The rules for how code must be written are called <abbr class="dojo-term" data-term="syntax">syntax</abbr>. Let's see what happens when we make a typo on purpose.

Look at the code below. We removed the closing quotation mark at the end of `"Hello`:

```dojo-run
# ci: skip
print("Hello)
```

Press **Run** above. Notice how Sensei Panda translates the Python error into a helpful hint:
> **🥋 Unfinished Quote or Bracket**  
> Python reached the end of the line while looking for a matching quote!

Fix the quotes and press Run again to see it succeed.

---

## 🥊 Sparring Exercise
Now it is your turn to try a <abbr class="dojo-term" data-term="sparring">sparring</abbr> exercise! Make Python greet you by name.

Replace the `___` with your name inside quotes (for example `"Asha"` or `"Alex"`), then click **Check**.

```dojo-exercise
id: white-01-hello
xp: 10
%% starter
# Make Python greet your name
name = "___"
print("Hello,", name)
%% tests
check(stdout_contains("Hello"), "Your program should print a greeting that starts with Hello.")
check(var("name") != "___", "Replace the ___ with your name (keep the quotes).")
check(var("name") is not None and len(str(var("name"))) > 0, "Make sure your name is not empty.")
%% tips
Tip 1: The blank ___ is where your name goes.
Tip 2: Text must stay inside quotes, like "Asha".
Tip 3: Change the line to name = "Asha" (use your own name).
%% solution
name = "Asha"
print("Hello,", name)
```

---

## 📝 Recap
- `print()` displays messages on your screen.
- Words must be wrapped in quotes like `"Hello"`.
- If you make a mistake, read the Sensei hint to fix it.

[Continue to Kata 02: Naming Things with Variables →](02-variables.md)
