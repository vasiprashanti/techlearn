## Python Notes – 2

## Inbuilt Functions in Python

### 1. `print()` Function

The `print()` function is one of the most commonly used built-in functions in Python. It is used to display data on the standard output device (i.e., the console or terminal). Whether you're debugging your code or presenting output to a user, `print()` is the go-to function.

---

#### a) Printing Different Data Types

The `print()` function can be used to display values of all fundamental Python data types:

```python
print('Hello')                           # String (str) type
print(100)                               # Integer (int) type
print(3.14)                              # Floating-point (float) type
print([1, 2, 3, 4])                      # List (list) type
print((5, 6, 7))                         # Tuple (tuple) type
print({1, 2, 3, 10, 4})                  # Set (set) type
print({1: 'One', 2: 'Two', 3: 'Three'})  # Dictionary (dict) type
print(True)                              # Boolean (bool) type
print(3 + 4j)                            # Complex number (complex) type
print(None)                              # NoneType (None) – represents the absence of value
```

---

### b) Printing Variables

Python allows you to store data in variables and later print them. This is highly useful for dynamic and reusable code.

```python
name = 'Techlearn Solutions'
mobile = 9000663666
email = 'techlearnsolutions@gmail.com'
print(name)
print(mobile)
print(email)
```

**Output:**

```
Techlearn Solutions
9000663666
techlearnsolutions@gmail.com
```

---

**c) Printing Multiple Values Together**

You can use `print()` to display multiple values at once, separated by commas. Python will automatically insert a space between them.

```python
print(1, 2, 3, 4)
print('TechLearn', 9676663136, 'AS Rao Nagar')
```

**Output:**

```
1 2 3 4
TechLearn 9676663136 AS Rao Nagar
```

---

**d) Ways to Print Strings Along With Values**

There are multiple ways to format strings with values using the `print()` function:

---

**1) Using Commas**

Commas separate values in `print()` and automatically insert spaces.

```python
name = 'Techlearn Solutions'
mobile = 9000663666
print('Name :', name)
print('Mobile:', mobile)
```

**Output:**

```
Name : Techlearn Solutions
Mobile: 9000663666
```

---

**2) Using String Concatenation (+)**

The `+` operator is used to concatenate (combine) strings.

```python
name = 'Techlearn Solutions'
print('Name : ' + name)
```

**Output:**

```
Name : Techlearn Solutions
```

**Note:** You can only concatenate strings with strings. If you try to add a string and an integer directly, Python will raise a `TypeError`. You need to explicitly convert other types to strings using `str()` before concatenation.

---

**e) Type Conversion / Type Casting**

Python provides a set of built-in functions for **type casting** or **type conversion**, which allows you to convert one data type into another.

---

**str() Function**

The `str()` function converts any data type to its string representation.

```python
print(str(5))          # Output: '5'
print(str(5.6))        # Output: '5.6'
```

---

**int() Function**

The `int()` function converts a string (that contains a valid integer) or a float (by truncating the decimal part) to an integer.

```python
a = int('56')          # Converts string to int
b = int('60')          # Converts string to int
c = a + b
print(c)               # Output: 116
```

⚠️ `int('12.5')` would raise a `ValueError` because '12.5' is not an integer.

---

**float() Function**

The `float()` function converts integers or numeric strings (with decimal) to floating-point numbers.

```python
a = 5
b = float(a)           # Converts integer to float
print(b)               # Output: 5.0
c = '12.3'
d = float(c)           # Converts string to float
print(d)               # Output: 12.3
```

---

**list() Function**

aList = list(x) # Converts each character in the string into list elements
y = 'TECH'
bList = list(y) # Output: ['T', 'E', 'C', 'H']

The list() function is used to convert other iterable types (like strings, tuples, or sets) into a list.

```python
x = '[1,2,3]'         # This is a string, not a list
aList = list(x)       # Converts each character in the string into list elements
y = 'TECH'
bList = list(y)       # Output: ['T', 'E', 'C', 'H']
print(type(x))        # Output: <class 'str'>
print(type(aList))    # Output: <class 'list'>
print(type(bList))    # Output: <class 'list'>
```

---

**tuple() Function**

The `tuple()` function converts other iterable types into tuples.

```python
x = '(1,2,3)'         # String type
aTuple = tuple(x)     # Converts each character into tuple elements
y = 'TECH'
bTuple = tuple(y)     # Output: ('T', 'E', 'C', 'H')
print(type(x))        # <class 'str'>
print(type(aTuple))   # <class 'tuple'>
print(type(bTuple))   # <class 'tuple'>
```

---

**f) Real-Life Example Using Type Conversion**

**Example 1: Printing the Gold Rate in Hyderabad**

```python
gold_rate = 6605
print('Gold rate today in Hyderabad is: ' + str(gold_rate))
```

**Explanation:** Since `gold_rate` is an integer, we need to convert it to a string using `str()` before concatenating it with another string.

---

**g) Using Format Specifiers**

Format specifiers are placeholders used to embed values into strings:

- `%d` → for integers
- `%f` → for floats
- `%s` → for strings

---

**Example 1: Rectangle Dimensions and Area**

```python
length = 5
breadth = 3
area = length * breadth
print('Length = %d' % length)
print('Breadth = %d' % breadth)
print('Area = %d' % area)
```

---

**Example 2: Country Details**

```python
name = 'India'
capital = 'Delhi'
population = 1449297353
print("Country: %s Capital: %s Population: %d" % (name, capital, population))
```

---

**h) Using f-Strings (Formatted String Literals)**

Introduced in Python 3.6, **f-strings** are a modern and efficient way to embed expressions inside string literals using `{}`.

```python
x = 5
y = 3
print(f'value of x={x} and value of y={y}')
```

**Output:**

```
value of x=5 and value of y=3
```

✅ f-strings offer improved readability and performance compared to older formatting methods.

---

### 2. type() Function

The type() function in Python is used to **determine the data type** of a value or a variable. It returns a special object called **<class 'type'>**, which indicates the type of the data.

**Syntax:**

```
type(object)
```

**Example:**

```
a = 5
print(type(a)) # Output: <class 'int'>
print(type('Techlearn')) # Output: <class 'str'>
```

---

### 3. input() Function

The input() function is used to **accept user input from the console**. It always returns the input as a **string (str)**, regardless of what the user types.

**Key Characteristics:**

- ✅ The input received is always of str type.
- ✅ The function can take a **prompt message** as a parameter to display a message to the user.
- ✅ Only **one value** can be taken at a time through a single input() call.
- ❗ If the input needs to be used as a number or any other type, **explicit type conversion** is required.

---

**Example:**

```
a = input('Enter a value: ')
print(type(a)) # Output: <class 'str'>
```

Even if you type a number like 5, it is returned as '5' (string).

---

**Example with Type Casting:**

```
x = input('Enter x value: ') # input as string
y = input('Enter y value: ') # input as string
z = input('Enter list of 3 values: ') # input as string

num1 = int(x) # converting x to int
num2 = float(y) # converting y to float
num3 = list(z) # converting z (string) to list of characters

print(type(x)) # str
print(type(num1)) # int
print(type(y)) # str
print(type(num2)) # float
print(type(z)) # str
print(type(num3)) # list

print(x + y) # string concatenation
print(z) # original input string
```

---

### 4. id() Function

The id() function returns the **unique memory address (identity)** of an object. In CPython (the standard implementation of Python), this address is the memory location where the object is stored.

**Key Observations:**

- If two variables store **immutable data** (like integers, strings, floats, tuples, booleans) with the **same value**, they may point to the **same memory location**.
- **Mutable data** types like lists and dictionaries **always have unique IDs**, even if their contents are the same.

---

**Examples:**

```
a = 5
b = 5
print(id(a), id(b)) # Same ID (integers are immutable)

a = 5.3
b = 5.3
print(id(a), id(b)) # Might be same, but not guaranteed

a = (1, 2, 3)
b = (1, 2, 3)
print(id(a), id(b)) # Tuples are immutable → same ID

a = [1, 2, 3]
b = [1, 2, 3]
print(id(a), id(b)) # Lists are mutable → different ID

a = 3 + 4j
b = 3 + 5j
print(id(a), id(b)) # Different complex numbers → different IDs

a = 5
b = 10
print(id(a), id(b)) # Different values → different IDs
```

**Sample Output (will vary by machine):**

```
135618794224680 135618794224680
135618784459312 135618784459312
135618781930880 135618781930880
135618781856832 135618783803648
135618783454384 135618783454416
135618794224680 135618794224840
```

---

### 5. sum() Function

The sum() function is used to **calculate the total sum of all numeric elements** in an **iterable** like a list or tuple. The elements must be numeric (int, float, or complex).

**Syntax:**

```
sum(iterable)
```

**Return Type:**

- The return type depends on the **highest type** among the elements:
  - complex > float > int

---

**Examples:**

```
a = [1, 2, 3] # All integers
b = [1.2, 2.2, 3.2] # All floats
c = [3 + 4j, 5 + 2j, 6 + 3j] # All complex numbers
d = [5, 3.5, 2 + 3j] # Mixed: int, float, complex

print(sum(a)) # Output: 6
print(sum(b)) # Output: 6.6000000000000005
print(sum(c)) # Output: (14+9j)
print(sum(d)) # Output: (10.5+3j)
```

---

### 6. max() Function

The max() function is used to **find the maximum (highest) value** among a set of values.

**✅ Features:**

- Accepts **two or more individual values**, or a **single iterable** like list, tuple, or string.
- Works on **numeric types** and **strings**.
- For strings, the comparison is based on **ASCII values** (A=65, Z=90, a=97, etc.).
- ❗ max() does **not** work with complex numbers.

**Example:**

```
print(max(1, 10, 3, 5)) # Returns 10
x = [1, 12, 3]
print(max(x)) # Returns 12
y = 'LEARN'
print(max(y)) # Returns 'R' (ASCII comparison)
```

**Output:**

```
10
12
R
```

---

### 7. min() Function

The min() function works just like max(), but returns the **minimum (lowest)** value.

**Example:**

```
print(min(1, 10, 3, 5)) # Returns 1
x = [1, 12, 3]
print(min(x)) # Returns 1
```

**Output:**

```
1
1
```

---

### 8. round() Function

The round() function is used to **round a number to the nearest value** at the desired decimal or integer place.

**✅ Features:**

- Takes **1 or 2 arguments**:
  - round(number) → rounds to nearest integer (0 decimal places).
  - round(number, ndigits) → rounds to ndigits decimal places (positive) or to integer place values (negative).
- Negative values for ndigits allow rounding off at **units, tens, hundreds**, etc.

**Rules:**

- If digit to be removed is **≥ 5**, next digit increases by 1.
- If digit to be removed is **< 5**, it is truncated.

---

**Examples:**

```
print(round(567.589)) # No 2nd argument → rounds to 568
print(round(567.539, 2)) # Rounds to 2 decimal places → 567.54
print(round(567.582)) # Rounds to 568
print(round(567.582, -1)) # Rounds to nearest 10 → 570.0
print(round(4567.582, -2)) # Rounds to nearest 100 → 4600.0
print(round(4537.582, -2)) # Rounds to nearest 100 → 4500.0
print(round(4567.582, -3)) # Rounds to nearest 1000 → 5000.0
```

**Output:**

```
568
567.54
568
570.0
4600.0
4500.0
5000.0
```

---

### 9. len() Function

The len() function returns the **total number of elements** in a collection like str, list, tuple, set, or dict.

**Example:**

```
x = [11, 52, 30, 24, 15]
print(len(x)) # Returns 5
```

**Output:**

```
5
```

---

**ℹ️ Bonus: Using math Module Functions**

The math module provides mathematical constants and functions.

**Example:**

```python
import math
print(math.e) # Euler’s constant
print(math.pi) # Pi constant
print(math.sqrt(625)) # Square root of 625
print(math.factorial(5)) # 5! = 5\*4\*3\*2\*1
```

**Output:**

```
2.718281828459045
3.141592653589793
25.0
120
```

---

### 10. abs() Function

The abs() function returns the **absolute (non-negative)** value of a number.

**Example:**

```
n = -45
print(abs(n)) # Returns 45
```

**Output:**

```
45
```

---

### 11. any() Function

The any() function returns **True** if **any element** in a collection is **truthy** (i.e., not 0, False, or None). Otherwise, returns **False**.

**Usage Idea:**

Check if **at least one light is ON**.

**Example:**

```
lights1 = [0, 0, 0, 0, 0, 0]
lights2 = [0, 0, 0, 1, 0, 0]
print(any(lights1)) # All lights OFF
print(any(lights2)) # At least one light ON
```

**Output:**

```
False
True
```

---

### 12. all() Function

The all() function returns **True** only if **all elements** in a collection are **truthy**. Returns **False** if any one of them is 0, False, or None.

**Usage Idea:**

Check if **no subject has zero marks** (i.e., all marks > 0).

**Example:**

```
std = [45, 98, 76, 88, 65, 90]
print(all(std)) # All values are non-zero → True
std2 = [56, 90, 89, 19, 0, 80]
print(all(std2)) # Contains 0 → False
```

**Output:**

```
True
False
```

---

### 13. dir() Function

The dir() function is used to return a **list of all the attributes, methods, and variables** in the current scope or within a module/object.

It is a helpful tool for introspection and debugging.

**Example:**

```
name = 'tech'
mobile = 987666
print(dir())
```

**Output (sample):**

```
['__annotations__', '__builtins__', '__doc__', '__loader__',
 '__name__', '__package__', '__spec__', 'mobile', 'name']
```

---

### 14. divmod()

The divmod() function returns a **tuple containing the quotient and the remainder** when one number is divided by another.

**Syntax:**

```
divmod(a, b) # Returns (a // b, a % b)
```

**Example:**

```
a = 5
b = 2
c = divmod(a, b)
print(c)
```

**Output:**

```
(2, 1)
```

---

### 15. iter()

The iter() function is used to **create an iterator object** from an iterable (like list, tuple, string, etc.).

Once the iterator is created, you can use the next() function to retrieve elements one by one.

**Example:**

```
x = [10, 20, 30, 40]
i = iter(x)
print(next(i))
print(next(i))
```

**Output:**

```
10
20
```

---

### 16. range()

The range() function returns a sequence of numbers starting from 0 by default and increments by 1 (default), ending at a specified number (exclusive).

**Example 1: Using For Loop**

```
print('Value in range of 5 using for each loop:')
for val in range(5):
    print(val, end=' ')
```

**Output:**

```
Value in range of 5 using for each loop:
0 1 2 3 4
```

**Example 2: Using iter() and next()**

```
r2 = range(5)
itr = iter(r2)
print('Values using iter():')
print(next(itr), end=' ')
print(next(itr), end=' ')
print(next(itr), end=' ')
print(next(itr), end=' ')
print(next(itr), end=' ')
```

**Output:**

```
Values using iter():
0 1 2 3 4
```

---

### 17. chr()

The chr() function returns the **character** that represents the specified **Unicode code (ASCII number)**.

**Example:**

```
print(chr(65))
print(chr(63))
print(chr(93))
print(chr(61))
print(chr(48))
```

**Output:**

```
A
?
]
=
0
```

---

### 18. ord()

The ord() function returns the **Unicode code (ASCII number)** for a given **character**.

**Example:**

```
print(ord('a'), end=' ')
print(ord(';'), end=' ')
print(ord('+'), end=' ')
print(ord('9'), end=' ')
print(ord('Z'), end=' ')
```

**Output:**

```
97 59 43 57 90
```

---

### 19. zip()

The zip() function returns a **zip object**, which is an iterator of tuples. It pairs elements from two or more iterables.

If the iterables are of different lengths, zip() stops at the shortest one.

---

**Example:**

```python
state = ('Telangana', 'Tamilnadu', 'Karnataka')
capital = ('Hyderabad', 'Chennai', 'Bengaluru')
state_capital = zip(state, capital)
print(state_capital)
print(type(state_capital))
for val in state_capital:
    print(val)
```

**Output:**

```
<zip object at 0x7de2fee2ec80>
<class 'zip'>
('Telangana', 'Hyderabad')
('Tamilnadu', 'Chennai')
('Karnataka', 'Bengaluru')
```

---

**Summary**

1. type()

   - Returns the data type of a variable or value.
   - Example:
     ```python
     type(5)  # <class 'int'>
     ```

2. input()

   - Takes input from the user as a string.
   - You can cast the string to other types (e.g., int(input())).

3. id()

   - Returns the memory address (ID) of a variable.
   - Same values of immutable types may have the same ID.

4. sum()

   - Returns the sum of numeric elements in an iterable.
   - Works with int, float, and complex.

5. max() / min()

   - Returns the maximum or minimum value from arguments or an iterable.
   - Works with numbers and strings (by ASCII).

6. round()

   - Rounds a number to a specified number of decimal or integer places.
   - Example:
     ```python
     round(4567.582, -2)  # 4600.0
     ```

7. len()

   - Returns the number of elements in a collection (like list, string, etc.).

8. abs()

   - Returns the absolute value of a number (i.e., removes sign).

9. any()

   - Returns True if at least one element in a collection is truthy.

10. all()

    - Returns True if all elements in a collection are truthy.

11. dir()

    - Returns a list of attributes and methods for an object/module.

12. divmod()

    - Returns a tuple with quotient and remainder: (a // b, a % b).

13. iter() + next()

    - iter() creates an iterator.
    - next() retrieves values one by one from the iterator.

14. range()

    - Generates a sequence of numbers; commonly used in loops.
    - Returns a range object (iterable).

15. chr() / ord()

    - chr(num) → ASCII character from code.
    - ord(char) → ASCII code from character.

16. zip()
    - Combines two or more iterables into tuples.
    - Stops at the shortest iterable.
