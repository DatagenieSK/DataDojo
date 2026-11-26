---
title: Functions and Custom Moves
belt: white
minutes: 5
goal: Package code into reusable custom functions.
---

# Kata 08: Functions and Custom Moves 🥋

## 🎯 Why This Matters
In martial arts, a combo like a block-and-punch has a name so you can execute it instantly.
In code, a named, reusable recipe of instructions is called a <abbr class="dojo-term" data-term="function">function</abbr>.
Once you write a function, you can use it hundreds of times without retyping it!

---

## 🥋 Try It Out
We define a function using the `def` keyword, followed by its name, parentheses `()`, and a colon `:`.
Press **Run** to practice a custom greeting function:

```dojo-run
def bow(ninja_name):
    print("🥋 Sensei bows to", ninja_name)

bow("Asha")
bow("Ravi")
```

---

## 💡 What Just Happened?
We created our own custom command called `bow`!
- The input variable inside the parentheses (`ninja_name`) is called a <abbr class="dojo-term" data-term="parameter">parameter</abbr>.
- When we called `bow("Asha")`, `"Asha"` was passed into the parameter.

Functions can also send an answer back using `return`.
The answer sent back is called the <abbr class="dojo-term" data-term="return value">return value</abbr>:

```python
def double(num):
    return num * 2

score = double(25)
print("Doubled score:", score)
```

`return` gives the result back to your program so you can store it in a variable.
`print()` only shows words on the screen!

---

## 🤔 Predict, Then Run
Look at this code before running it. What will be printed?

```dojo-run
def add_bonus(score):
    return score + 50

final_score = add_bonus(100)
print("Final:", final_score)
```

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>It prints <code>Final: 150</code>! <code>add_bonus(100)</code> adds 50 to 100, and returns 150 to be stored in <code>final_score</code>.</p>
  </details>
</div>

---

## 💥 Break It On Purpose!
What happens if you define a function that calculates a value, but forget the `return` statement?

```dojo-run
# ci: skip
def bad_calculator(a, b):
    answer = a + b

result = bad_calculator(5, 5)
print("Result is:", result)
```

Press **Run** above. Python prints `Result is: None`!
Without `return`, a Python function automatically returns `None`.

---

## 🥊 Sparring Exercise
Build a function to calculate a student's XP:
1. Define a function `calculate_xp(katas, sparring)`.
2. Each completed kata awards 10 XP, and each sparring exercise awards 15 XP. Return `(katas * 10) + (sparring * 15)`.
3. Call `calculate_xp(3, 2)` and print the result.

```dojo-exercise
id: white-08-functions
xp: 10
%% starter
# 1. Define calculate_xp(katas, sparring)
# 2. Return (katas * 10) + (sparring * 15)
# 3. Call calculate_xp(3, 2) and print the result

%% tests
check(has_var("calculate_xp"), "Define a function named calculate_xp.")
check(callable(var("calculate_xp")), "calculate_xp must be a function.")
fn = var("calculate_xp")
check(fn(1, 1) == 25, "calculate_xp(1, 1) should return 25.")
check(fn(3, 2) == 60, "calculate_xp(3, 2) should return 60.")
check(stdout_contains("60"), "Print the result of calculate_xp(3, 2).")
%% tips
Tip 1: Start with def calculate_xp(katas, sparring):.
Tip 2: Inside, write return (katas * 10) + (sparring * 15).
Tip 3: Outside the function, write print(calculate_xp(3, 2)).
%% solution
def calculate_xp(katas, sparring):
    return (katas * 10) + (sparring * 15)

print(calculate_xp(3, 2))
```

---

## ❓ Quick Check

```dojo-quiz
id: white-08-quiz
? Which Python keyword defines a function?
+ def
- function
- make
? What is the purpose of return inside a function?
+ To pass the result value back to the caller
- To print text on screen
- To stop the entire computer
```

---

## 📝 Recap
- Use `def function_name(parameter):` to define a function.
- A **parameter** receives values passed into the function.
- Use `return` to send an answer back to the rest of your program.
- Functions prevent code duplication and make programs easy to read.

[← Back to Kata 07](07-loops.md) | [Continue to White Belt Grading 🏅 →](grading.md)
