---
title: Naming Things with Variables
belt: white
minutes: 5
goal: Store information in labeled boxes called variables.
---

# Kata 02: Naming Things with Variables 🥋

## 🎯 Why This Matters
Real programs need to remember numbers, names, and scores while they work.

---

## 📦 What is a Variable?
A <abbr class="dojo-term" data-term="variable">variable</abbr> is like a labeled storage box in computer memory. You choose a label for the box, and drop a value inside.

Let's save your favorite snack in a box labeled `snack`:

```dojo-run
snack = "Mango slices"
print("My energy snack is:", snack)
```

Press **Run**. Python looks inside the `snack` box and prints what is inside!

---

## 🤔 Predict, Then Run
What happens if we put a new value into the same box?

```dojo-run
score = 10
score = 25
print(score)
```

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>It prints <code>25</code>! When you assign a new value to an existing variable, the old value is replaced.</p>
  </details>
</div>

---

## 💥 Break It On Purpose!
What happens if you ask Python for a box that was never created?

```dojo-run
# ci: skip
print(dragon_points)
```

Press **Run** above. Notice Sensei Panda's friendly explanation:
> **🥋 Name Not Found**  
> Python doesn't know what `dragon_points` is yet! Did you create the variable before printing it?

---

## 🥊 Sparring Exercise 1: Fill in the Blank
Create a variable named `snack` and put `"Samosa"` inside it.

```dojo-exercise
id: white-02-snack
xp: 10
%% starter
# Fill in the blank with "Samosa"
snack = "___"
print("Snack:", snack)
%% tests
check(has_var("snack"), "Make sure you create a variable named snack.")
check(var("snack") != "___", "Replace ___ with \"Samosa\".")
check(var("snack") == "Samosa", "The snack variable should equal \"Samosa\".")
check(stdout_contains("Snack: Samosa"), "Your program should print 'Snack: Samosa'.")
%% tips
Tip 1: The blank ___ is where the word goes.
Tip 2: Keep the quotation marks around the word "Samosa".
Tip 3: Set snack = "Samosa" on line 2.
%% solution
snack = "Samosa"
print("Snack:", snack)
```

---

## 🥊 Sparring Exercise 2: Write It Yourself
Now write the code yourself!
1. Create a variable called `score` and set it to `100`. (Notice numbers do **not** need quotes).
2. Print `score`.

```dojo-exercise
id: white-02-score
xp: 10
%% starter
# 1. Create a variable called score and set it to 100
# 2. Print the score

%% tests
check(has_var("score"), "Create a variable named score.")
check(var("score") == 100, "The score variable should be the number 100 (without quotes).")
check(stdout_contains("100"), "Remember to print the score using print(score).")
%% tips
Tip 1: To create a number variable, write score = 100 without quotation marks.
Tip 2: To display it, write print(score) on the next line.
Tip 3: The complete program is two lines: score = 100 then print(score).
%% solution
score = 100
print(score)
```

---

## 📝 Recap
- A **variable** stores information with a name you choose.
- Use the `=` sign to put data inside a variable.
- Text uses quotes `"text"`, but numbers like `100` do not need quotes.

[← Back to Kata 01](01-hello-dojo.md) | [Back to White Belt Overview →](index.md)
