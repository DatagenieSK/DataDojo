---
title: Repeating with Loops
belt: white
minutes: 5
goal: Repeat actions without repeating code using for loops.
---

# Kata 07: Repeating with Loops 🥋

## 🎯 Why This Matters
If you want to print 100 certificates, you wouldn't write 100 `print()` lines.
A computer's greatest superpower is repeating instructions without getting tired.
In programming, repeating actions is done with a <abbr class="dojo-term" data-term="loop">loop</abbr>.

---

## 🥋 Try It Out
A `for` loop visits each item in a list one by one.
Press **Run** to practice our daily dojo warmups:

```dojo-run
warmups = ["10 pushups", "20 jumping jacks", "5 stretches"]

for drill in warmups:
    print("Sensei orders:", drill)
```

---

## 💡 What Just Happened?
The loop visited each item in `warmups`.
During each turn, the variable `drill` held the current item, and the indented code ran.

You can also repeat code a specific number of times using `range()`:
```python
for count in range(3):
    print("Round", count + 1)
```

To calculate a running total across a list, start a variable at `0` before the loop, and add to it inside:
```python
total = 0
for score in [5, 10, 15]:
    total = total + score
```

---

## 🤔 Predict, Then Run
What will Python display when you run this countdown loop?

```dojo-run
for num in [3, 2, 1]:
    print(num)
print("🥋 Spar!")
```

<div class="dojo-predict-box">
  <details>
    <summary>Click here to reveal the answer</summary>
    <p>It prints <code>3</code>, then <code>2</code>, then <code>1</code>, and finally <code>🥋 Spar!</code>. Notice that <code>🥋 Spar!</code> is not indented, so it only runs once after the loop finishes.</p>
  </details>
</div>

---

## 💥 Break It On Purpose!
What happens if you forget to indent the body of your loop?

```dojo-run
# ci: skip
for x in [1, 2, 3]:
print(x)
```

Press **Run** above. Python stops with an `IndentationError: expected an indented block`.
Every loop body must be indented by 4 spaces!

---

## 🥊 Sparring Exercise: Arrange the Lines
Arrange the lines below in the correct order to sum up the scores in a match.
(Watch out for the distractor line!)

```dojo-order
id: white-07-order
%% lines
points = [10, 20, 30]
total = 0
for pt in points:
    total = total + pt
print("Final total:", total)
%% distractors
total = [10, 20, 30]
%% tests
check(has_var("total"), "Keep the total variable.")
check(var("total") == 60, "total must equal 60.")
check(stdout_contains("Final total: 60"), "Prints 'Final total: 60'.")
%% tips
Tip 1: First define points, then initialize total = 0.
Tip 2: Next start the loop: for pt in points: with indented total = total + pt.
Tip 3: End with print("Final total:", total). Leave out the distractor line!
```

---

## ❓ Quick Check

```dojo-quiz
id: white-07-quiz
? How many times does for i in range(4): run?
+ 4 times
- 5 times
- 3 times
? Why do coders use loops?
+ To repeat instructions easily without copying code
- To slow down the computer
- To lock the screen
```

---

## 📝 Recap
- A **for loop** iterates through each element in a collection.
- `range(n)` generates numbers from `0` up to `n - 1`.
- Lines inside the loop must be indented with 4 spaces.
- Lines outside the loop run after all repetitions complete.

[← Back to Kata 06](06-lists.md) | [Continue to Kata 08: Functions and Custom Moves →](08-functions.md)
