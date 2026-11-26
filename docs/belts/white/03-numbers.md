---
title: Numbers and Quick Math
belt: white
minutes: 5
goal: Use Python as a calculator and learn integers and floats.
---

# Kata 03: Numbers and Quick Math 🥋

## 🎯 Why This Matters
Every useful program calculates numbers.
Whether you are tracking cricket runs, splitting a dinner bill with friends, or computing high scores, Python makes math effortless.

---

## 🥋 Try It Out
Python knows all standard math symbols.
Press **Run** to calculate the score of a cricket over:

```dojo-run
runs = 6 + 4 + 1 + 2 + 0 + 6
print("Total runs in the over:", runs)
```

---

## 💡 What Just Happened?
Python evaluated the addition and stored the answer in `runs`.
A symbol that performs math is called an <abbr class="dojo-term" data-term="operator">operator</abbr>.

Python has two main kinds of numbers:
- An <abbr class="dojo-term" data-term="integer">integer</abbr> is a whole number with no decimal point, like `10` or `-5`.
- A <abbr class="dojo-term" data-term="float">float</abbr> is a number with a decimal point, like `3.14` or `9.5`.

Here are Python's core math operators:

- `+` (add) and `-` (subtract)
- `*` (multiply) and `/` (divide, always produces a float)
- `//` (integer divide, drops the decimal part: `7 // 2` is `3`)
- `%` (remainder or modulo: `7 % 2` is `1`)
- `**` (exponent or power: `2 ** 3` is `8`)

---

## 🤔 Predict, Then Run
What do you think Python prints for this calculation?

```dojo-run
result = 5 + 2 * 10
print("Result is:", result)
```

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>It prints <code>Result is: 25</code>! Just like school math, Python multiplies (<code>2 * 10 = 20</code>) before adding <code>5</code>. If you want addition first, use parentheses: <code>(5 + 2) * 10</code> gives <code>70</code>.</p>
  </details>
</div>

---

## 💥 Break It On Purpose!
What happens if you ask Python to divide by zero?

```dojo-run
# ci: skip
score = 100 / 0
print(score)
```

Press **Run** above. You will see a `ZeroDivisionError`.
In math and in Python, dividing by zero is impossible!

---

## 🥊 Sparring Exercise
Calculate the bill for 3 bowls of noodles at 40 rupees each, plus a 15 rupee delivery fee.
Replace the `___` with `(noodle_price * bowls) + delivery_fee`.

```dojo-exercise
id: white-03-math
xp: 10
%% starter
noodle_price = 40
bowls = 3
delivery_fee = 15
# Calculate the total cost: (40 * 3) + 15
total = ___
print("Total rupees:", total)
%% tests
check(has_var("total"), "Make sure you have a variable named total.")
check(var("total") != "___", "Replace ___ with your math calculation.")
check(var("total") == 135, "total should equal 135.")
check(stdout_contains("135"), "The printed output must contain 135.")
%% tips
Tip 1: Multiply noodle_price by bowls using *, then add delivery_fee.
Tip 2: You can write (noodle_price * bowls) + delivery_fee.
Tip 3: Set total = (noodle_price * bowls) + delivery_fee on line 5.
%% solution
noodle_price = 40
bowls = 3
delivery_fee = 15
total = (noodle_price * bowls) + delivery_fee
print("Total rupees:", total)
```

---

## ❓ Quick Check

```dojo-quiz
id: white-03-quiz
? What is the result of 17 // 5 in Python?
+ 3
- 3.4
- 2
- 4
? What kind of number is 12.0 in Python?
+ A float (it has a decimal point)
- An integer
- A string
```

---

## 📝 Recap
- Python works as a superfast calculator.
- Whole numbers are **integers**; numbers with decimals are **floats**.
- Python follows order of operations (multiplication and division before addition and subtraction). Use parentheses `()` to group calculations.

[← Back to Kata 02](02-variables.md) | [Continue to Kata 04: Working with Text →](04-text.md)
