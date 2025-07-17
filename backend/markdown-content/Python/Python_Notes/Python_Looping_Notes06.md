## Python Notes – 6

### Control Statements: Loop Statements in Python

#### Introduction to Looping

Loops in programming are **control flow structures** that enable the repeated execution of a block of code as long as a specified condition is true. This is particularly useful when a task must be repeated multiple times without rewriting the code for each repetition.

A loop generally involves four primary components:

1. **Initialization of a Counter**:
   A variable is initialized to act as the control or loop counter.
2. **Test Expression (Condition Check)**:
   A boolean expression is evaluated. If true, the loop body is executed; otherwise, the loop terminates.
3. **Loop Body (Statements)**:
   The core logic or instructions that need to be repeated.
4. **Counter Update**:
   The loop counter is updated (incremented or decremented) to progress the loop toward its termination condition.

This structure ensures that loops do not run infinitely unless intended.

---

### Types of Loops in Python

Python supports multiple types of loops, each suited for specific kinds of iteration:

1. **while loop**
2. **for loop with range()**
3. **for loop with sequences/collections** (also referred to as _for-each_ loop)
4. **iter() and generators** – Advanced topics for custom and lazy evaluation loops

---

#### 1. `while` Loop

##### Syntax

```python
# initialization
while condition:
    # block of code
    # update
```

**Explanation:**

- The loop begins with an initialization step.
- Before each iteration, the **condition** is evaluated.
- If the condition is true, the **loop body** executes.
- After execution, the counter is updated.
- This process repeats until the condition becomes false.

**Example: Print numbers from 1 to 10**

```python
count = 1
while count <= 10:
    print(count, end=' ')
    count += 1
```

**Output:**

```
1 2 3 4 5 6 7 8 9 10
```

---

#### 2. `for` Loop with `range()` Function

The `range()` function is a built-in method that generates a sequence of numbers. This is commonly used with a `for` loop to iterate a fixed number of times.

**Forms of `range()`:**

**a) Single Argument: `range(stop)`**

- Starts from 0 by default.
- Ends before the stop value.
- Step/increment is +1 by default.

```python
for i in range(5):
    print(i)
```

**Output:**

```
0 1 2 3 4
```

**b) Two Arguments: `range(start, stop)`**

- Starts from the start value.
- Ends before the stop value.
- Step is still +1 by default.

```python
for i in range(1, 6):
    print(i, end='\t')
```

**Output:**

```
1 2 3 4 5
```

**c) Three Arguments: `range(start, stop, step)`**

- Explicitly defines the step size (positive or negative).

```python
for i in range(1, 10, 2):
    print(i, end='  ')
```

**Output:**

```
1 3 5 7 9
```

**Reversed Order:**

```python
for i in range(10, 0, -1):
    print(i, end='  ')
```

**Output:**

```
10 9 8 7 6 5 4 3 2 1
```

```python
for i in range(10, -1, -1):
    print(i, end='  ')
```

**Output:**

```
10 9 8 7 6 5 4 3 2 1 0
```

---

#### 3. `for` Loop with Sequences (For-Each Loop)

This form of the `for` loop is used to iterate over **iterable objects**, such as lists, strings, tuples, sets, or dictionaries. It retrieves **each element** from the collection, one at a time.

**General Syntax:**

```python
for variable in sequence:
    # block of code
```

**Examples:**

`basket = ['orange', 'banana', 'apple', 'grapes']`

**a) Iterating over a list**

```python
basket = ['orange', 'banana', 'apple', 'grapes']
for fruit in basket:
    print(fruit, end='  ')
```

**Output:**

```
orange banana apple grapes
```

`names_list = {"Geethika", "Naga Srivalli", "Shiva Ganesh", "Nanda Kishore"}`

**b) Iterating over a set**

```python
names_list = {"Geethika", "Naga Srivalli", "Shiva Ganesh", "Nanda Kishore"}
for name in names_list:
    print(name, end='   ')
```

`xlist = [1, 2, 3, 4, 5] total = 0`

**c) Sum of squares of numbers in a list**

```python
xlist = [1, 2, 3, 4, 5]
total = 0
for num in xlist:
    total += num * num
print('Sum of squares is:', total)
```

**d) Iterating over a string**

```python
name = 'TECHLEARN SOLUTIONS'
for letter in name:
    print(letter, end=' ')
```

**e) Iterating over a tuple**

```python
price_list = (100, 105, 156, 112, 130)
for price in price_list:
    print(price, end='  ')
```

---

#### 4. Iterating Over Dictionaries

A dictionary in Python is a collection of key-value pairs.

`d = {65: 'A', 66: 'B', 67: 'C', 68: 'D'}`

**a) Print keys**

```python
d = {65: 'A', 66: 'B', 67: 'C', 68: 'D'}
for key in d:
    print(key, end='  ')
```

**b) Print values**

```python
for key in d:
    print(d[key], end='  ')
```

**c) Print keys and values using direct access**

```python
for key in d:
    print(key, '-', d[key])
```

**d) Print keys and values using items()**

- `items()` returns key-value pairs as tuples.

```python
for key, value in d.items():
    print(key, '-', value)
```

`states_list = {`

**Application Example: State-Capital Pairs**

```python
states_list = {
    'Telangana': 'Hyderabad',
    'Tamilnadu': 'Chennai',
    'Karnataka': 'Bengaluru',
    'Kerala': 'Thiruvanthapuram'
}
for state, capital in states_list.items():
    print(state, '-', capital)
```

---

#### 5. For-Each with Nested Sequences (List of Lists)

When the data structure contains sub-sequences, like a list of lists or a list of tuples, you can **unpack multiple elements** directly in the loop header.

**Example: Student Records**

```python
std_list = [
    ['Pranay', 987687654, 'Hyderabad'],
    ['Kranthi', 87986655, 'Chennai'],
    ['Bharath', 78889765, 'Lucknow']
]
for s1, s2, s3 in std_list:
    print(s1, s2, s3)
```

**Output:**

```
Pranay 987687654 Hyderabad
Kranthi 87986655 Chennai
Bharath 78889765 Lucknow
```

This technique simplifies the retrieval of structured data from nested collections.

---

### Conclusion

Loop statements form a critical part of any programming language, including Python. Understanding the different looping constructs such as:

- while for conditional repetition,
- for-in with range() for numeric sequences,
- for-each style iteration for collections,
- dictionary-specific traversal,
- unpacking nested sequences,enables programmers to write **efficient, readable, and structured** code.

These loop structures form the basis for implementing algorithms, data processing, and automation of repetitive tasks in Python.
