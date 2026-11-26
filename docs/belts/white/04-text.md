---
title: Working with Text
belt: white
minutes: 5
goal: Combine and format text with Python strings.
---

# Kata 04: Working with Text 🥋

## 🎯 Why This Matters
Apps and games display messages, player names, and warnings all day long.
In Python, any sequence of text wrapped in quotes is called a <abbr class="dojo-term" data-term="string">string</abbr>.

---

## 🥋 Try It Out
You can glue strings together using the `+` operator.
Press **Run** to introduce a dojo student:

```dojo-run
student = "Asha"
belt = "White Belt"
message = student + " is training for her " + belt + "!"
print(message)
```

---

## 💡 What Just Happened?
We joined three smaller text fragments into one longer sentence.
Here are a few powerful things you can do with a **string**:

1. **Find its length:** `len("Dojo")` returns `4`.
2. **Change case:** `"hello".upper()` becomes `"HELLO"`, and `"HELLO".lower()` becomes `"hello"`.
3. **Use f-strings (format strings):** Put an `f` before the quote and place variables directly inside curly braces `{}`:
   ```python
   name = "Ravi"
   print(f"Welcome, {name}!")
   ```

---

## 🤔 Predict, Then Run
Look at this code before clicking Run. What will be printed?

```dojo-run
badge = "code ninja"
print(badge.upper())
print("Length:", len(badge))
```

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>It prints <code>CODE NINJA</code> and <code>Length: 10</code>. Notice that the space between words counts as a character!</p>
  </details>
</div>

---

## 💥 Break It On Purpose!
What happens when you try to add a string and a number together directly?

```dojo-run
# ci: skip
level = "Belt " + 1
print(level)
```

Press **Run** above. Python displays a `TypeError`.
Python refuses to glue a number directly to text.
To fix this, write `f"Belt {1}"` or turn the number into text with `str(1)`.

---

## 🥊 Sparring Exercise
Build a greeting for a new ninja.
1. Take `belt_color` and turn it uppercase using `.upper()`.
2. Create `greeting` containing `"Welcome Maya, your belt is WHITE!"`.
3. Print `greeting`.

```dojo-exercise
id: white-04-text
xp: 10
%% starter
first_name = "Maya"
belt_color = "white"
# Create greeting: "Welcome Maya, your belt is WHITE!"
greeting = "___"
print(greeting)
%% tests
check(has_var("greeting"), "Create a variable named greeting.")
check(var("greeting") != "___", "Replace ___ with your formatted greeting.")
check("WHITE" in var("greeting"), "Use .upper() on belt_color to make it uppercase.")
check(var("greeting") == "Welcome Maya, your belt is WHITE!", "greeting must equal 'Welcome Maya, your belt is WHITE!'.")
check(stdout_contains("Welcome Maya, your belt is WHITE!"), "Print the exact greeting.")
%% tips
Tip 1: You can get uppercase belt color with belt_color.upper().
Tip 2: Use an f-string: f"Welcome {first_name}, your belt is {belt_color.upper()}!".
Tip 3: Set greeting = f"Welcome {first_name}, your belt is {belt_color.upper()}!".
%% solution
first_name = "Maya"
belt_color = "white"
greeting = f"Welcome {first_name}, your belt is {belt_color.upper()}!"
print(greeting)
```

---

## ❓ Quick Check

```dojo-quiz
id: white-04-quiz
? What does len("Py 3") return?
+ 4
- 3
- 5
? Which code turns the word "panda" into uppercase "PANDA"?
+ "panda".upper()
- "panda".capitalize()
- upper("panda")
```

---

## 📝 Recap
- Text in quotes is called a **string**.
- Use `len(text)` to count characters (including spaces).
- Use `.upper()` and `.lower()` to change casing.
- Use **f-strings** like `f"Hello {name}"` to smoothly insert values into text.

[← Back to Kata 03](03-numbers.md) | [Continue to Kata 05: Decisions with If →](05-decisions.md)
