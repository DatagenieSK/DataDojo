---
title: Storing Many Things in Lists
belt: white
minutes: 5
goal: Store, access, and modify collections with Python lists.
---

# Kata 06: Storing Many Things in Lists 🥋

## 🎯 Why This Matters
Real programs need to store groups of items: a list of student names, cricket scores from 10 matches, or inventory items in a game.
Instead of creating 10 separate variables, we store them in a single <abbr class="dojo-term" data-term="list">list</abbr>.

---

## 🥋 Try It Out
A list in Python is created with square brackets `[]` and commas between items.
Press **Run** to inspect our dojo equipment:

```dojo-run
gear = ["gi", "belt", "gloves", "headgear"]
print("Dojo gear list:", gear)
print("Number of items:", len(gear))
```

---

## 💡 What Just Happened?
We created a list of 4 strings.
To grab one item from a list, we use its position number, called an <abbr class="dojo-term" data-term="index">index</abbr>.

Crucial rule: **Python starts counting positions at 0!**
- `gear[0]` is `"gi"` (the first item)
- `gear[1]` is `"belt"` (the second item)
- `gear[-1]` is `"headgear"` (the last item)

Helpful list operations:
- **Add an item:** `gear.append("water bottle")` adds to the end.
- **Check membership:** `"belt" in gear` evaluates to `True`.
- **Count items:** `len(gear)` gives the total count.

---

## 🤔 Predict, Then Run
Look at this code before running it. Which fruit will appear?

```dojo-run
fruits = ["Mango", "Banana", "Papaya", "Guava"]
print(fruits[2])
```

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>It prints <code>Papaya</code>! Remember that index 0 is "Mango", index 1 is "Banana", and index 2 is "Papaya".</p>
  </details>
</div>

---

## 💥 Break It On Purpose!
What happens if you ask for an index that doesn't exist?

```dojo-run
# ci: skip
pets = ["cat", "dog"]
print(pets[5])
```

Press **Run** above. Python reports an `IndexError: list index out of range`.
The list only has 2 items (indices 0 and 1), so index 5 cannot be reached!

---

## 🥊 Sparring Exercise
Practice managing belt colors:
1. Add `"green"` to `belt_colors` using `.append()`.
2. Print the first belt using index `0`.
3. Print the total number of belts using `len()`.

```dojo-exercise
id: white-06-lists
xp: 10
%% starter
belt_colors = ["white", "yellow", "orange"]
# 1. Add "green" using .append()
# 2. Print the first belt
# 3. Print the total count of belts

%% tests
check("green" in var("belt_colors"), "Add 'green' to belt_colors using .append('green').")
check(len(var("belt_colors")) == 4, "belt_colors should have 4 items.")
check(stdout_contains("white"), "Print the first belt using belt_colors[0].")
check(stdout_contains("4"), "Print the total count of belts using len(belt_colors).")
%% tips
Tip 1: Use belt_colors.append("green") on line 2.
Tip 2: Print the first item with print(belt_colors[0]).
Tip 3: Print the total length with print(len(belt_colors)).
%% solution
belt_colors = ["white", "yellow", "orange"]
belt_colors.append("green")
print(belt_colors[0])
print(len(belt_colors))
```

---

## ❓ Quick Check

```dojo-quiz
id: white-06-quiz
? What is the index of the first item in any Python list?
+ 0
- 1
- -1
? How do you add the word "apple" to a list named basket?
+ basket.append("apple")
- basket.add("apple")
- basket.push("apple")
```

---

## 📝 Recap
- A **list** holds multiple values inside square brackets `[item1, item2]`.
- List positions are called **indices** and start at `0`.
- Use `.append()` to add an item to the end of a list.
- Use `len(list)` to find how many items are in the list.

[← Back to Kata 05](05-decisions.md) | [Continue to Kata 07: Repeating with Loops →](07-loops.md)
