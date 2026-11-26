---
title: White Belt Grading
type: grading
belt: white
pass: 4
minutes: 15
goal: Prove your foundational Python skills and earn your Yellow Belt.
---

# White Belt Grading 🥋

<div class="dojo-grading-container" data-belt="white" data-pass="4">

Sensei Panda bows and welcomes you to your first Belt Grading!
To earn your **Yellow Belt**, you must complete at least **4 out of the 5 challenges** below.

---

### Challenge 1: Dojo Math 🧮
Calculate the total cost of 4 wooden training swords at 75 rupees each, with a 20 rupee discount.
Store the result in `total_cost` and print it.

```dojo-exercise
id: white-grading-01
covers: white-03
xp: 0
%% starter
sword_price = 75
quantity = 4
discount = 20
# Calculate: (sword_price * quantity) - discount
total_cost = ___
print("Total cost:", total_cost)
%% tests
check(has_var("total_cost"), "Create a variable named total_cost.")
check(var("total_cost") == 280, "total_cost should be 280 ((75 * 4) - 20).")
check(stdout_contains("280"), "Print total_cost.")
%% solution
sword_price = 75
quantity = 4
discount = 20
total_cost = (sword_price * quantity) - discount
print("Total cost:", total_cost)
```

---

### Challenge 2: Dojo Badge Text 🏷️
Create a badge string using an f-string: `"NINJA: Maya"`.
Ensure the title `"NINJA"` is capitalized. Store the result in `badge` and print it.

```dojo-exercise
id: white-grading-02
covers: white-04
xp: 0
%% starter
title = "ninja"
student = "Maya"
# Create badge: "NINJA: Maya" using title.upper()
badge = "___"
print(badge)
%% tests
check(has_var("badge"), "Create a variable named badge.")
check(var("badge") == "NINJA: Maya", "badge should be 'NINJA: Maya'.")
check(stdout_contains("NINJA: Maya"), "Print the badge.")
%% solution
title = "ninja"
student = "Maya"
badge = f"{title.upper()}: {student}"
print(badge)
```

---

### Challenge 3: Dojo Access Control 🚪
Check if a student has enough sparring stars to enter the tournament.
If `stars >= 5`, print `"Welcome to Tournament"`, otherwise print `"Keep training"`.

```dojo-exercise
id: white-grading-03
covers: white-05
xp: 0
%% starter
stars = 7

# Write if/else statement to check stars >= 5

%% tests
check(has_var("stars"), "Keep the stars variable.")
check(stdout_contains("Welcome to Tournament"), "For stars = 7, print 'Welcome to Tournament'.")
%% solution
stars = 7
if stars >= 5:
    print("Welcome to Tournament")
else:
    print("Keep training")
```

---

### Challenge 4: Dojo Roster 📋
Update the roster list:
1. Add `"Kenji"` to `roster` using `.append()`.
2. Print the total count of students using `len()`.

```dojo-exercise
id: white-grading-04
covers: white-06
xp: 0
%% starter
roster = ["Asha", "Ravi", "Maya"]

# 1. Add "Kenji" to roster
# 2. Print total student count

%% tests
check(has_var("roster"), "Keep the roster list.")
check("Kenji" in var("roster"), "Add 'Kenji' to roster with .append('Kenji').")
check(len(var("roster")) == 4, "roster must contain 4 students.")
check(stdout_contains("4"), "Print len(roster).")
%% solution
roster = ["Asha", "Ravi", "Maya"]
roster.append("Kenji")
print(len(roster))
```

---

### Challenge 5: Belt Level Function 🥋
Write a function `belt_level(points)` that returns:
`"Yellow"` if `points >= 100`, or `"White"` otherwise.
Then call `belt_level(120)` and print the result.

```dojo-exercise
id: white-grading-05
covers: white-08
xp: 0
%% starter
# Define belt_level(points)
# Return "Yellow" if points >= 100, else "White"
# Print belt_level(120)

%% tests
check(has_var("belt_level"), "Define a function named belt_level.")
check(callable(var("belt_level")), "belt_level must be a function.")
fn = var("belt_level")
check(fn(120) == "Yellow", "belt_level(120) should return 'Yellow'.")
check(fn(80) == "White", "belt_level(80) should return 'White'.")
check(stdout_contains("Yellow"), "Print belt_level(120).")
%% solution
def belt_level(points):
    if points >= 100:
        return "Yellow"
    else:
        return "White"

print(belt_level(120))
```

</div>

---

[← Back to White Belt Overview](index.md)
