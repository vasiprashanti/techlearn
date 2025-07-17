## Python Notes – 5

### Python Notes – 05: Data Types and Methods

Python provides several built-in data types, grouped into the following major categories:

1. **Numeric Types**
2. **Sequence Types**
3. **Mapping Types**
4. **Set Types**
5. **Boolean Type**
6. **Binary Types**
7. **None Type**

Each category is discussed in detail below.

---

### 1. Numeric Types

Python supports three primary numeric types:

#### a. `int` (Integer)

- Represents whole numbers (positive, negative, or zero) without a fractional component.
- Arbitrary precision; can handle very large integers.

**Example:**

```python
x = 100
print(type(x))  # <class 'int'>

# Attributes:
x = 5
print(x.numerator)    # 5
print(x.denominator)  # 1
```

#### b. `float` (Floating-Point)

- Represents real numbers with a decimal point.
- Precision may be limited due to binary representation.

**Example:**

```python
y = 7.25
print(type(y))  # <class 'float'>
```

#### c. `complex` (Complex Numbers)

- Represents complex numbers in the form a + bj.
- a is the real part, b is the imaginary part.

**Example:**

```python
z = 2 + 3j
print(z.real)  # 2.0
print(z.imag)  # 3.0
```

---

### 2. Sequence Types

These represent ordered collections of items. The three main sequence types are:

#### a. `str` (String)

- Represents a sequence of Unicode characters.
- Immutable (cannot be changed after creation).

**Example:**

```python
s = "Hello, World!"
print(s[0])  # 'H'
print(len(s))  # 13

# Common methods:
print(s.lower())
print(s.upper())
print(s.replace('World', 'Python'))
print(s.find('World'))
print(s.split(','))
```

#### b. `list`

- Represents an ordered, mutable collection.
- Can contain elements of different types.

**Example:**

```python
lst = [1, 2, 3, "Python"]
lst.append(4)
lst[0] = 100
print(lst)
```

#### c. `tuple`

- Represents an ordered, immutable collection.
- Useful when data should not change.

**Example:**

```python
t = (1, 2, 3)
print(t[1])  # 2
```

---

### 3. Mapping Type

#### `dict` (Dictionary)

- Represents a collection of key-value pairs.
- Unordered (in versions before 3.7) but insertion-ordered (Python 3.7+).
- Keys must be hashable; values can be of any type.

**Example:**

```python
d = {'name': 'Alice', 'age': 25}
print(d['name'])  # 'Alice'

# Common methods:
print(d.keys())
print(d.values())
print(d.items())
print(d.get('age'))
print(d.update({'city': 'Hyderabad'}))
print(d.pop('age'))
```

---

### 4. Set Types

Used for collections of **unique**, unordered items.

#### a. `set`

- Mutable and unordered.
- No duplicate elements allowed.
- Useful for membership tests and eliminating duplicates.

**Example:**

```python
s = {1, 2, 3, 3}
print(s)  # {1, 2, 3}

# Operations:
s.add(4)
s.remove(2)
print(s.union({5, 6}))
print(s.intersection({1, 3, 5}))
print(s.difference({3}))
```

#### b. `frozenset`

- Immutable version of a set.
- Supports set operations but cannot be changed after creation.

**Example:**

```python
fs = frozenset([1, 2, 3])
print(fs)
```

---

### 5. Boolean Type

#### `bool`

- Represents truth values: True and False.
- Internally, True is equivalent to 1 and False to 0.
- Commonly used in conditions and logical operations.

**Example:**

```python
x = True
y = False
print(type(x))  # <class 'bool'>

# Logical operations:
print(x and y)
print(x or y)
print(not x)
```

---

### 6. Binary Types

Used for working with raw binary data.

#### a. `bytes`

- Immutable sequence of bytes.

**Example:**

```python
b = b'hello'
print(b)
```

#### b. `bytearray`

- Mutable version of bytes.

**Example:**

```python
ba = bytearray([65, 66, 67])
ba[0] = 68  # Changes to 68, which is 'D'
print(ba)
```

#### c. `memoryview`

- Provides memory-efficient view of binary data.
- Useful for manipulating slices of data without copying.

---

### 7. None Type

#### `NoneType`

- Represents the absence of a value or a null value.
- There is only one instance: None.
- Commonly used as a default function return value when nothing is returned explicitly.

**Example:**

```python
x = None
print(type(x))  # <class 'NoneType'>
```

---

## Casting or Type Conversion in Python

**Type conversion**, also called **type casting**, refers to converting one data type into another. Python provides constructor functions to perform this explicitly for numeric types.

**Constructors for Numeric Type Conversion**

Python offers the following built-in functions for type conversion:

1. `int()` – Converts a number or numeric string to an integer, truncating any decimal part.
2. `float()` – Converts an integer or a numeric string to a floating-point number.
3. `complex()` – Converts an integer or float into a complex number.

---

**Example 1: float → int**

```python
a = 5.6
b = int(a)
print(b)
```

**Output:**

```
5
```

**Explanation:** The `int()` function truncates the decimal part. 5.6 becomes 5.

---

**Example 2: int → float**

```python
a = 5
b = float(a)
print(b)
```

**Output:**

```
5.0
```

**Explanation:** The integer 5 is converted to a float by adding a decimal part, resulting in 5.0.

---

**Example 3: int → complex**

```python
a = 5
b = complex(a)
print(b)
```

**Output:**

```
(5+0j)
```

**Explanation:** The integer 5 is converted to a complex number with 0 as the imaginary part.

---

**Example 4: float → complex**

```python
a = 5.6
b = complex(a)
print(b)
```

**Output:**

```
(5.6+0j)
```

**Explanation:** The float 5.6 is converted to a complex number with 0 as the imaginary part.

---

## Sequence Types in Python: Strings

A **sequence** in Python is an ordered collection of elements. A **string** is one such sequence type that consists of Unicode characters.

### 1. String (`str`)

**Definition:**

A **string** in Python is a sequence of characters enclosed in **single quotes (' ')**, **double quotes (" ")**, or **triple quotes (''' ''' or """ """)**.

---

### Creating Strings

**a) Empty Strings**

```python
s1 = ""
s2 = str()
```

**Explanation:** Both s1 and s2 are empty strings created using a pair of empty quotes and the string constructor respectively.

**b) Non-empty Strings**

```python
s3 = 'techlearn'
```

---

### Multiline Strings

```python
para = """This is the first line,
This is second line,
This is third line."""
print(para)
```

**Output:**

```
This is the first line,
This is second line,
This is third line.
```

**Explanation:** Triple-quoted strings allow line breaks and preserve the format of text exactly as written.

---

### Properties of Strings

1. **Strings are immutable**
   - Once a string is created, it cannot be modified.
   - Any operation that modifies a string returns a new string instead.
2. **Strings are index-based**
   - Characters in a string can be accessed using **index numbers**, starting from 0 for the first character.

---

### Indexing

**a) Positive Indexing**

```python
s1 = 'TECHLEARN'
print('First character:', s1[0]) # T
print('Fifth character:', s1[4]) # L
```

**Output:**

```
First character: T
Fifth character: L
```

**b) Negative Indexing**

- Negative indexing allows access from the end of the string.
- Index -1 refers to the last character, -2 to the second last, and so on.

```python
s1 = 'TECHLEARN'
print('Last character:', s1[-1]) # N
print('Third last character:', s1[-3]) # A
```

**Output:**

```
Last character: N
Third last character: A
```

**Character Index Mapping:**

| **Character** | **T** | **E** | **C** | **H** | **L** | **E** | **A** | **R** | **N** |
| :------------ | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Positive      | 0     | 1     | 2     | 3     | 4     | 5     | 6     | 7     | 8     |
| Negative      | -9    | -8    | -7    | -6    | -5    | -4    | -3    | -2    | -1    |

---

### 7) Slice Operator [:] with Strings

The **slice operator** is used to extract a portion (substring) of a string. The syntax is:

`string[start : end : step]`

- **start** (optional): Index to begin the slice (inclusive).
- **end** (optional): Index to end the slice (exclusive).
- **step** (optional): Interval between characters in the slice.

**Basic Slice (with 2 values)**

```python
s1 = 'TECHLEARN'
s2 = s1[0:4]
print(s2) # Output: TECH
```

- This extracts characters from index 0 to 3 (excluding index 4).

**Default start value** is 0, so:

```python
s2 = s1[:4] # Equivalent to s1[0:4]
```

**Slicing from the end using negative indices**

```python
s2 = s1[-5:] # Extracts the last 5 characters
print(s2) # Output: LEARN
```

**Slice with Step (3 values)**

```python
s3 = s1[0:6:2]
print(s3) # Output: TCL
```

- Starts at index 0, goes up to 5, skipping every second character.

**Note:** The slice operator always returns a **new string**, leaving the original string unchanged.

---

### 8) Concatenation Operator + with Strings

The + operator joins two or more strings into one.

**Example:**

```python
s1 = 'TECH'
s2 = 'LEARN'
s3 = s1 + s2
print(s3) # Output: TECHLEARN
```

- A new string is created with characters from both strings, in order.

---

### 9) Repetition Operator \* with Strings

The \* operator repeats a string a specified number of times.

**Example:**

```python
s1 = 'TECH'
s2 = s1 \* 3
print(s2) # Output: TECHTECHTECH
```

- A new string is created by repeating the original string three times.

---

### 10) F-Strings (Formatted String Literals)

Introduced in Python 3.6, **f-strings** provide a concise way to embed expressions inside string literals.

**Syntax:**

```python
f"string with {expression}"
```

**Example:**

```python
name = 'TechLearn'
mobile = 9676663136
s1 = f"Name is: {name} and Mobile is: {mobile}"
print(s1)
```

**Output:**

```
Name is: TechLearn and Mobile is: 9676663136
```

- You can include any variable or expression inside `{}`.

---

### 11) Escape Character

The backslash `\` is used to insert characters that are otherwise illegal in strings.

**Common Escape Sequences:**

- `\"` – Double quote
- `\'` – Single quote
- `\\` – Backslash
- `\n` – New line
- `\t` – Tab

**Example:**

```python
s1 = 'This is \"TECHLEARN\" Solutions.'
print(s1)
```

**Output:**

```
This is "TECHLEARN" Solutions.
```

---

### 12) len() Function

The `len()` function returns the number of characters in a string (including spaces and special characters).

**Example:**

```python
s1 = 'TECHLEARN SOLUTIONS'
print(len(s1))
```

**Output:**

```
19
```

- Counts all characters including the space.

---

### Summary Table

| **Feature**      | **Operator/Function** | **Description**                            |
| :--------------- | :-------------------- | :----------------------------------------- |
| Slice            | `[:]`                 | Extracts substring from a string           |
| Concatenation    | `+`                   | Combines strings                           |
| Repetition       | `*`                   | Repeats a string n times                   |
| Formatted String | `f""`                 | Inserts variables into a string            |
| Escape Character | `\`                   | Inserts special characters                 |
| Length           | `len()`               | Returns the number of characters in string |

---

## In-built Methods of String Data Type

**1. `capitalize()`**

- Converts the **first character** of the string to uppercase and makes all other characters lowercase.

```python
s = 'apple'
s2 = s.capitalize()
print(s2) # Output: Apple
```

---

**2. `count()`**

- Returns the number of **non-overlapping occurrences** of a specified substring in the given string.

```python
s = 'This is the first sentence. And this is the second sentence. And this is the last sentence.'
c = s.count('the')
print(c) # Output: 3
```

---

**3. `find()`**

- Returns the **lowest index** where the specified substring is found.
- If not found, returns -1.

```python
s = 'THIS IS INDIA'
print(s.find('INDIA')) # Output: 8
print(s.find('HYDERABAD')) # Output: -1
```

---

**4. `split()`**

- Splits the string into a **list of substrings**, using the specified delimiter (default is whitespace).

```python
words = "One, Two, Three, Four, Five"
words_list = words.split(',')
print(words_list) # Output: ['One', ' Two', ' Three', ' Four', ' Five']
```

**Task Example:**\
Separate and capitalize names from a hyphen-separated string:

```python
names = "vnr-cmr-uoh-mahindra-cbit"
name_list = names.split('-')
capitalized_names = [name.capitalize() for name in name\_list]
print(capitalized_names) # Output: ['Vnr', 'Cmr', 'Uoh', 'Mahindra', 'Cbit']
```

---

**5. `index()`**

- Works like `find()`, but **raises a ValueError** if the substring is not found.

```python
sentence = "This is India"
print(sentence.index("India")) # Output: 8
```

---

**6. `upper()`**

- Returns a **new string** where all characters are uppercase.

```python
name = "Guido Van Rossum"
print(name.upper()) # Output: GUIDO VAN ROSSUM
```

---

**7. `lower()`**

- Converts all characters of the string to **lowercase**.

```python
name = "APPLE"
print(name.lower()) # Output: apple
```

---

**8. `islower()`**

- Returns True if **all characters** in the string are lowercase.

```python
name = "Apple"
print(name.islower()) # Output: False
```

---

**9. `isupper()`**

- Returns True if **all characters** in the string are uppercase.

```python
name = "TECHLEARN"
print(name.isupper()) # Output: True
```

---

**10. `isnumeric()`**

- Returns True if the string contains **only numeric characters**.

```python
ticket = '123'
print(ticket.isnumeric()) # Output: True
```

---

## List in Python

**Key Characteristics of Lists**

1. **Ordered**: Maintains the order of elements.
2. **Mutable**: Can be modified after creation.
3. **Allows Duplicates**: Multiple identical elements allowed.
4. **Heterogeneous Elements**: Can store different data types.
5. **Defined Using Square Brackets [ ]** or list() constructor.

---

### Examples

```python
x = [] # Empty list using brackets
y = list() # Empty list using constructor
```

---

### Allows Duplicates

```python
xList = [1, 3, 7, 4, 5, 3]
print(xList) # Output: [1, 3, 7, 4, 5, 3]
```

---

### Length of List

```python
xList = [10, 20, 30, 40, 50]
print(len(xList)) # Output: 5
```

---

### Index-Based Access

```python
xList = [10, 20, 30, 40, 50]
print(xList[0]) # Output: 10
print(xList[3]) # Output: 40
```

---

### Negative Indexing

```python
xList = [10, 20, 30, 40]
print(xList[-1]) # Output: 40 (last element)
```

---

### Slicing Lists

```python
xList = [10, 20, 30, 40, 50, 60]
yList = xList[:3]
print(yList) # Output: [10, 20, 30]
```

---

### List Concatenation

```python
xList = [10, 20, 30]
yList = [40, 50, 60]
zList = xList + yList
print(zList) # Output: [10, 20, 30, 40, 50, 60]
```

---

### List Repetition

```python
xList = [10, 20, 30]
yList = xList \* 2
print(yList) # Output: [10, 20, 30, 10, 20, 30]
```

---

### List Comprehension

A concise way to generate lists using conditions and loops.

**Examples**

**1. Multiples of 5**

```python
xList = [5, 6, 2, 8, 9, 10, 45]
z = [x for x in xList if x % 5 == 0]
print(z) # Output: [5, 10, 45]
```

**2. Generate numbers from 0 to 9**

```python
x = [y for y in range(10)]
print(x) # Output: [0, 1, 2, ..., 9]
```

**3. Filter strings containing 'a'**

```python
xlist = ['apple', 'mango', 'kiwi', 'cherry', 'banana']
y = [x for x in xlist if 'a' in x]
print(y) # Output: ['apple', 'mango', 'banana']
```

**4. Convert strings to uppercase**

```python
y = [x.upper() for x in xlist]
print(y) # Output: ['APPLE', 'MANGO', 'KIWI', 'CHERRY', 'BANANA']
```

**5. Replace specific item**

```python
y = [x if x != 'banana' else 'orange' for x in xlist]
print(y) # Output: ['apple', 'mango', 'kiwi', 'cherry', 'orange']
```

**6. Replace even numbers with '\*'**

```python
a = [10, 23, 45, 67, 89, 12]
b = [val if val % 2 != 0 else '\*' for val in a]
print(b) # Output: ['\*', 23, 45, 67, 89, '\*']
```

---

## Python Built-in Methods

Organized into three major data types: **String**, **List**, and **Tuple**.

---

### STRING DATA TYPE METHODS

| **Method**     | **Description**                                    |
| :------------- | :------------------------------------------------- |
| `capitalize()` | Converts first character to uppercase.             |
| `count(x)`     | Returns count of substring x.                      |
| `find(x)`      | Returns index of x if found, else -1.              |
| `split(sep)`   | Splits string by sep, returns list.                |
| `index(x)`     | Same as `find()`, but gives error if x not found.  |
| `upper()`      | Converts entire string to uppercase.               |
| `lower()`      | Converts entire string to lowercase.               |
| `islower()`    | Checks if string is lowercase.                     |
| `isupper()`    | Checks if string is uppercase.                     |
| `isnumeric()`  | Checks if string contains only numeric characters. |

**Example Problem:**

```python
names = "vnr-cmr-uoh-mahindra-cbit"
for name in names.split('-'):
    print(name.capitalize())
```

---

### LIST DATA TYPE METHODS

| **Method**      | **Description**                                             |
| :-------------- | :---------------------------------------------------------- |
| `append(x)`     | Adds x to end of list.                                      |
| `insert(i, x)`  | Inserts x at index i.                                       |
| `extend(list2)` | Appends all elements of list2 to current list.              |
| `remove(x)`     | Removes first occurrence of x; throws error if x not found. |
| `pop()`         | Removes and returns last item.                              |
| `pop(i)`        | Removes and returns item at index i.                        |
| `clear()`       | Empties the list.                                           |
| `sort()`        | Sorts list in ascending order.                              |
| `reverse()`     | Reverses order of items in list.                            |
| `index(x)`      | Returns index of x; error if x not found.                   |
| `count(x)`      | Counts number of times x appears.                           |
| `copy()`        | Returns a new shallow copy of the list.                     |

**Common Concepts**

- Indexing: `list[i]`, `list[-1]`
- Slicing: `list[start:stop]`
- Concatenation: `list1 + list2`
- Repetition: `list \* n`
- **List comprehension**:
  - `xList = [5, 6, 2, 8, 9, 10, 45]`
  - `z = [x for x in xList if x % 5 == 0] # [5, 10, 45]`

---

## TUPLE DATA TYPE

| **Property**     | **Description**                                  |
| :--------------- | :----------------------------------------------- |
| Immutable        | Cannot be changed after creation.                |
| Created using    | `x = (1, 2, 3)` or `x = 1, 2, 3`                 |
| Singleton syntax | `x = (1,)` (note the comma)                      |
| Access           | Supports indexing (`x[0]`) and slicing (`x[:3]`) |
| Concatenation    | `x + y` returns new tuple                        |
| Repetition       | `x \* 2` duplicates elements                     |
| Tuple unpacking  | `a, b = (1, 2)`                                  |
| Comprehension    | Returns a generator, not a tuple                 |

---

### Tuple Built-in Methods

| **Method** | **Description**                                                      |
| :--------- | :------------------------------------------------------------------- |
| `index(x)` | Returns index of first occurrence of x; throws error if x not found. |
| `count(x)` | Returns the count of x in the tuple.                                 |

---

### Tuple Comprehension Example:

```python
t = (10, 15, 20, 25)
z = (x for x in t if x <= 20)
for val in z:
    print(val, end=' ')
# Output: 10 15 20
```

---

## Bonus Comparison

| **Feature** | **String**    | **List**         | **Tuple**      |
| :---------- | :------------ | :--------------- | :------------- |
| Mutability  | Immutable     | Mutable          | Immutable      |
| Syntax      | "text"        | [1,2,3]          | (1,2,3)        |
| Methods     | Many          | Many             | Very Few       |
| Use Case    | Text handling | Dynamic sequence | Fixed sequence |

---

## What is a Set in Python?

A **set** is a built-in data type in Python that represents a **collection of unique, unordered items**. It is inspired by the concept of sets in mathematics.

---

### BASIC PROPERTIES OF SET:

**✅ a) Set Representation:**

A set is created using curly braces `{}` or the `set()` constructor.

```python
xSet = {1, 21, 33, 2, 40, 5}
print(xSet) # Output might be: {1, 2, 33, 5, 21, 40}
```

**Explanation:**

- **Unordered**: The output order may not match the input order. It does **not preserve order** like a list.
- **Unique**: If you repeat elements, duplicates are removed automatically.

---

**✅ b) Accepts Multiple Data Types**

```python
my_set = {1, "hello", 3.14, True}
```

- You can mix integers, strings, floats, booleans, even tuples.
- **Mutable types like lists or dictionaries are not allowed** in a set (they're unhashable).

---

**✅ c) Unordered Collection**

Set does **not store elements in any particular order**. This means:

```python
{1, 2, 3} == {3, 2, 1} # True
```

---

**✅ d) Creating an Empty Set**

- ✅ Correct way: `set1 = set()`
- ❌ Wrong way: `set1 = {}` → this creates an **empty dictionary**.

```python
set1 = set()
set2 = set([1, 2, 3, 4])
set3 = {1, 2, 3, 4, 5, 4, 5} # Duplicates removed
```

---

**✅ e) Unique Elements Only**

```python
xSet = {1, 2, 3, 2, 4, 5}
print(xSet) # Output: {1, 2, 3, 4, 5}
```

- Duplicate elements are **automatically removed**.

---

**✅ f) No Indexing / Assignment**

```python
xSet = {1, 2, 3}
xSet[0] = 11 # ❌ Error
```

- Sets are **not indexable**.
- You **cannot assign** values using an index like a list.

---

**✅ g) Getting Set Length**

```python
set1 = {10, 20, 30, 40, 50}
print(len(set1)) # Output: 5
```

---

**✅ h & i) Not Index-Based & No Element Access by Index**

```python
set1 = {1, 2, 3}
print(set1[0]) # ❌ TypeError
```

- You **cannot use index access like in lists or tuples**.
- This is because the order is not guaranteed.

---

**✅ j) No Concatenation (+), Repetition (\*), or Slicing [:]**

```python
set1 = {1, 2, 3}
set2 = {4, 5}
set3 = set1 + set2 # ❌ TypeError
set4 = set1 \* 2 # ❌ TypeError
set5 = set1[:2] # ❌ TypeError
```

---

## ⚙️ SET IN-BUILT METHODS:

**1. `add()`**

Adds a **single** new element if it's not already in the set.

```python
set1 = {1, 3, 2, 4, 5}
set1.add(6) # Adds 6
set1.add(3) # Does nothing (3 already exists)
```

- ❌ `set1.add(98, 9)` → invalid: `add()` only takes one element.

---

**2. `update()`**

Adds elements from another set or iterable, one by one.

```python
set1 = {71, 13}
set2 = {5, 6, 7}
set1.update(set2) # Adds 5, 6, 7 into set1
```

You can also use `|=` (in-place union):

```python
set2 |= {85, 3, 7}
```

---

**3. `union()` or `|`**

Returns a **new set** combining all unique elements from both sets.

```python
set1 = {71, 5, 13}
set2 = {5, 6, 7}
set3 = set1.union(set2) # OR set1 | set2
```

---

**4. `intersection()` or `&`**

Returns only the **common elements** in both sets.

```python
set1 = {71, 5, 13, 6}
set2 = {5, 6, 7}
set3 = set1.intersection(set2) # OR set1 & set2
```

---

**5. `discard()`**

Removes element if it exists. If not, does nothing (no error).

```python
set1 = {71, 5, 7, 3, 6}
set1.discard(5) # Removes 5
set1.discard(20) # Does nothing
```

---

**6. `pop()`**

Removes and returns a **random** element (usually the first inserted, but depends on hash).

```python
set1 = {71, 5, 7, 3, 6}
set1.pop() # Removes a random element
```

- Raises error on empty set:

```python
set1 = set()
set1.pop() # ❌ TypeError
```

---

**7. `remove()`**

Removes a specified item from the set.

```python
set1 = {10, 2, 4, 6, 7}
set1.remove(4) # Works
set1.remove(99) # ❌ KeyError (if item doesn't exist)
```

---

**8. `issuperset()` or `>=`**

Returns True if **all elements of set2 are present in set1**.

```python
set1 = {1, 2, 3, 4, 5, 6}
set2 = {3, 4, 5}
print(set1.issuperset(set2)) # True
```

---

**9. `issubset()` or `<=`**

Returns True if **all elements of set1 are in set2**.

```python
set1 = {1, 2, 3}
set2 = {1, 2, 3, 4, 5}
print(set1.issubset(set2)) # True
```

---

**10. `difference()` or `-`**

Returns elements in set1 that are **not in set2**.

```python
set1 = {1, 2, 3, 4, 5, 6, 7}
set2 = {1, 2}
set3 = {3, 4}
set4 = set1.difference(set2) # {3, 4, 5, 6, 7}
set5 = set1.difference(set2, set3) # {5, 6, 7}
```

---

**11. `difference_update()`**

Removes elements in set2 from set1. **Updates set1**, does not return new set.

```python
delhi = {'Air India', 'Indigo','Go First', 'Vistara', 'Spicejet'}
mumbai = {'Air India', 'Akasa Air', 'Indigo', 'Go First'}
delhi.difference_update(mumbai)
# Now delhi = {'Vistara', 'Spicejet'}
```

---

**12. `symmetric_difference()` or `^`**

Returns items **only in one set, not both**.

```python
delhi = {'Air India', 'Indigo','Go First', 'Vistara', 'Spicejet'}
mumbai = {'Air India', 'Akasa Air', 'Indigo', 'Go First'}
result = delhi.symmetric_difference(mumbai)
# Output: {'Akasa Air', 'Vistara', 'Spicejet'}
```

---

**13. `isdisjoint()`**

Returns **True** if the sets have **no common items**, else False.

```python
delhi = {'Air India', 'Indigo','Go First', 'Vistara', 'Spicejet'}
bhubaneswar = {'IndiaOne Air'}
mumbai = {'Air India', 'Akasa Air', 'Indigo', 'Go First'}
print(delhi.isdisjoint(bhubaneswar)) # True
print(delhi.isdisjoint(mumbai)) # False
```

---

### Summary Table

| **Operation**            | **Symbol** | **Description**                      |
| :----------------------- | :--------- | :----------------------------------- |
| `add()`                  | –          | Add one item                         |
| `update()`               | –          | Add multiple items                   |
| `union()`                | `          | `                                    |
| `intersection()`         | &          | Common items                         |
| `difference()`           | -          | Items only in first set              |
| `symmetric_difference()` | ^          | Items not common                     |
| `remove()`               | –          | Remove item or error                 |
| `discard()`              | –          | Remove item or do nothing            |
| `pop()`                  | –          | Remove random item                   |
| `issuperset()`           | >=         | All items of other set exist in this |
| `issubset()`             | <=         | All items of this exist in other set |
| `isdisjoint()`           | –          | No common items                      |

\
Absolutely, maga! Let’s dive deep into **Python Dictionaries** and all the in-built methods you've listed. I’ll break everything down **clearly, with analogies, edge cases, tips, and practical examples**. This will help you **not only understand but also apply** them in real projects or exams.

---

## 1. What is a Dictionary?

A **dictionary** is like a **real-life dictionary** where each **word (key)** is associated with a **meaning (value)**.

**✅ Key Features:**

| **Feature**     | **Explanation**                                            |
| :-------------- | :--------------------------------------------------------- |
| **Syntax**      | `{ key1: value1, key2: value2 }`                           |
| **Key Rules**   | Must be **immutable** types (int, float, str, tuple, bool) |
| **Value Rules** | Can be **any** type (list, dict, set, etc.)                |
| **No Indexing** | Access is done using keys, not numeric indices             |
| **Ordered**     | From Python 3.7+, insertion order is maintained            |
| **Unique Keys** | Duplicate keys overwrite older ones                        |

```python
city = {40: 'Hyderabad', 44: 'Chennai', 11: 'Delhi'}
print(city[40]) # Output: Hyderabad
```

---

## 🛠️ 2. In-Built Dictionary Methods Explained

---

` `**update()**

**Purpose:** Add or update key-value pairs.

**Syntax:**

```python
dict1.update({key: value})
dict1.update(key1=value1, key2=value2)
```

**How it works:**

- If the key already exists → value gets **updated**.
- If the key doesn’t exist → key-value pair is **added**.

```python
d = {'a': 1, 'b': 2}
d.update({'b': 20, 'c': 30})
print(d) # {'a': 1, 'b': 20, 'c': 30}
```

✅ You can also do:

```python
d['d'] = 40
```

---

` `**setdefault()**

**Purpose:** Ensures a key exists, sets a default if not.

**Syntax:**

```python
dict.setdefault(key, default_value)
```

```python
user = {'name': 'Abhay'}
user.setdefault('email', 'noemail@example.com')
print(user)
```

- If email exists → returns current value.
- If not → inserts 'email': 'noemail@example.com'

---

` `**pop()**

**Purpose:** Removes a key and returns its value.

**Syntax:**

```python
dict.pop(key)
```

```python
d = {'a': 1, 'b': 2}
print(d.pop('b')) # 2
print(d) # {'a': 1}
```

` `If key not found → raises KeyError unless default is provided.

```python
print(d.pop('z', 'not found')) # Output: not found
```

---

` `**popitem()**

**Purpose:** Removes and returns **last inserted** key-value pair.

**Syntax:**

```python
dict.popitem()
```

```python
d = {'a': 1, 'b': 2, 'c': 3}
print(d.popitem()) # ('c', 3)
```

` `Raises error if dictionary is empty.

---

` `**copy()**

**Purpose:** Returns a **shallow copy** of the dictionary.

```python
d = {'a': 1, 'b': 2}
d2 = d.copy()
d2['a'] = 10
print(d) # {'a': 1, 'b': 2}
```

` `Changes in copy do not affect original.

---

` `**fromkeys()**

**Purpose:** Create a new dictionary from a list of keys and a **single default value**.

```python
keys = ['x', 'y', 'z']
new_dict = dict.fromkeys(keys, 0)
print(new_dict) # {'x': 0, 'y': 0, 'z': 0}
```

` `Only **immutable** types allowed as keys.\
✅ If value is mutable (like a list), all keys share same reference!

```python
d = dict.fromkeys(['a', 'b'], [])
d['a'].append(1)
print(d) # {'a': [1], 'b': [1]} → same list object
```

---

` `**clear()**

**Purpose:** Deletes all items from the dictionary.

```python
d = {'a': 1, 'b': 2}
d.clear()
print(d) # {}
```

---

` `**get()**

**Purpose:** Fetch value by key safely (no error if key missing).

**Syntax:**

```python
dict.get(key, default_value_if_not_found)
```

```python
d = {'name': 'Kaushik'}
print(d.get('name')) # Kaushik
print(d.get('email')) # None
print(d.get('email', 'not found')) # not found
```

Use this to avoid crashes when unsure if key exists.

---

` `**keys()**

**Purpose:** Returns a **dynamic view** of all keys.

```python
d = {'x': 10, 'y': 20}
keys_view = d.keys()
print(keys_view) # dict_keys(['x', 'y'])
d['z'] = 30
print(keys_view) # dict_keys(['x', 'y', 'z']) → reflects change
```

---

` `**values()**

**Purpose:** Returns a **view of all values**.

```python
d = {'a': 1, 'b': 2}
vals = d.values()
print(vals) # dict_values([1, 2])
d['c'] = 3
print(vals) # dict_values([1, 2, 3])
```

---

` `**items()**

**Purpose:** Returns a **list of key-value tuples**.

```python
d = {'a': 1, 'b': 2}
for k, v in d.items():
    print(f"Key: {k}, Value: {v}")
```

It returns a **dynamic view**, meaning changes in dict are reflected.
