# Python Notes – Basics

## Introduction

### History

Python is a high-level, interpreted, interactive, and object-oriented scripting language. It was developed by Guido van Rossum in the late 1980s and early 1990s at the National Research Institute for Mathematics and Computer Science in the Netherlands. Python is derived from several languages like C, C++, SmallTalk, Algol-68, and other scripting languages. It is general-purpose, versatile, concise, easy to read, and can be used in web development, software development, and scientific applications.

### Features

- Easy to read, learn, and maintain.
- Comes with a standard library that is portable and cross-platform compatible.
- Strong support for modules and packages.
- Provides extensive support for major databases like MySQL and Oracle.
- Suitable for developing Windows-based applications.
- Supports functional, structured, and object-oriented programming paradigms.
- Offers automatic garbage collection.
- Supports dynamic type checking and conversion.

### Setting Up Python

1. Download the latest version of Python from: https://www.python.org/downloads/
2. Install the Python interpreter.
3. Execute Python code using IDLE (Integrated Development Environment) or via the command prompt.

## Working with Python

Python code can be written and executed in several ways:

1\. Using the Python shell (IDLE): Type a line of Python code and press Enter. The interpreter processes it and returns the output.

2\. Writing Python scripts in a new file within IDLE and executing using 'Run' or pressing F5.

3\. Running saved Python files using the 'import' keyword in the shell or executing from the command prompt.

```python
# Example: test.py
print('Hello World!')
```

```python
>>> import test
# Output: Hello World!
```

```python
# Example: test2.py
print('Program started')
x = 10
y = 20
z = x + y
print(x, y, z)
print('Program ends')
```

```python
>>> import test2
# Output:
# Program started
# 10 20 30
# Program ends
```

```python
>>> print(test2.x, test2.y, test2.z)
# Output: 10 20 30
```

```python
# Importing specific variables
from test2 import z
print(z)

from test2 import x, y, z
print(x, y, z)
```

From the command prompt, type `python` to open the shell or `python filename.py` to run a script.

## Python Identifiers and Keywords

### Identifiers

Naming conventions for identifiers:

\- Class names start with an uppercase letter.

\- Other identifiers start with a lowercase letter.

\- Single leading underscore: indicates a private identifier.

\- Double leading underscores: strongly private identifier.

\- Leading and trailing double underscores: language-defined special names.

### Keywords

Python has 33 keywords, including:

and, exec, not, assert, finally, or, break, for, pass, class, from, print, continue, global, raise, def, if, return, del, import, try, elif, in, while, else, is, with, except, lambda, yield

## Lines and Indentation

Python uses indentation instead of braces to define blocks of code. All statements within a block must be indented consistently.

## Comments in Python

Use the '#' symbol to write comments.

```python
# This is a comment
# Written by TechLearn Solutions
print('Hello World')
print("Welcome to TechLearn!")
print("""Computer Training & Development
2nd Floor, Surabhi Complex, AS Rao Nagar, ECIL, Hyderabad-500062.""")
```

## Variables and Data Types

- **Variables** are nothing but reserved memory locations to store values. This means, when you create a variable, you reserve some space in memory.

- Based on the data type of a variable, the interpreter allocates memory and decides what can be stored in the reserved memory. Therefore, by assigning different data types to variables, you can store integers, decimals, or characters in these variables.

### Assigning Values

```python
var = 100
var2 = 12.56
var3 = "techlearn solutions"
var4 = 'python programming'

print(var)
print(var2)
print(var3)
print(var4)
```

### Multiple Assignment

```python
a = b = c = 1
print(a, b, c)

x, y, z = 1, 'tech', 12.5
print(x)
print(y)
print(z)
```

### Standard Data Types

Python supports the following data types:

- Numbers (`int`, `float`, `complex`)
- Strings
- List `[ ]`
- Tuple `( )`
- Set `{ }`
- Dictionary `{key: value}`
- Boolean (`True`/`False`)
- None (no value)

### Numbers

x = 0b1100 # Binary\

Integer examples:

```python
x = 0b1100 # Binary
y = 0o14 # Octal
z = 0xc # Hexadecimal
x = 1_23_450
```

```python
a = 1200000000000000000000
b = 12
c = -234

# Integer formats:
x = 0b1100      # Binary
y = 0o14        # Octal
z = 0xc         # Hexadecimal

# Underscores can be used as visual separators:
x = 1_23_450
print(type(x))  # Output: <class 'int'>
```

### Float

```python
x = 5.01234567890123456789
print(x)  # Output: rounded to 15 decimal places
```

### Complex Numbers

```python
a = 5 + 2j
print(a)
print(type(a))  # Output: <class 'complex'>
```

---

#### 📘 Number Systems in Python: Binary, Octal, and Hexadecimal

In computer science, numbers can be represented in **different numeral systems**, such as:

- **Binary (Base 2)** – Uses only 0 and 1.
- **Octal (Base 8)** – Uses digits from 0 to 7.
- **Decimal (Base 10)** – Standard numeric system we use (uses digits 0–9).
- **Hexadecimal (Base 16)** – Uses digits 0–9 and letters A–F (A=10, B=11, ..., F=15).

Python natively supports these formats by using **prefixes** to indicate the base of a literal value.

---

#### 1. Binary Numbers in Python

- **Prefix**: `0b` or `0B`
- **Base**: 2
- **Digits allowed**: 0 and 1 only

**Example:**

```python
x = 0b00001100
print(x)  # Output: 12
```

#### 2. Octal Numbers in Python

- **Prefix**: `0o` or `0O`
- **Base**: 8
- **Digits allowed**: 0 to 7 only

**Example:**

```python
x = 0o12
print(x)  # Output: 10
```

#### 3. Hexadecimal Numbers in Python

- **Prefix**: `0x` or `0X`
- **Base**: 16
- **Digits allowed**: 0–9, A–F (or a–f)

**Example:**

```python
a = 0xc
print(a)  # Output: 12
```

## Strings

Strings are sequences of characters enclosed in quotes (single or double). They are index-based.

```python
s1 = "TECHLEARN"
print(s1[5])  # Output: L

print(s1[0:4])   # Output: TECH
print(s1[-5:])   # Output: LEARN

str = "Hello World"
print(str)
print(str[0])
print(str[0:])
print(str[2:])
print(str*2)
print(str + " Welcome to TechLearn")
```

## Lists

Lists are mutable sequences enclosed in square brackets [].

```python
list = ['tech', 900066, 12.23, 'sujith', 70.2]
list2 = [3, 4, 5]
print(list)
print(list[0])
print(list[0:])
print(list[2:])
print(list*2)
print(list + list2)
list[0] = 'techlearn'
print(list)
```

## Tuples

Tuples are immutable sequences enclosed in parentheses ().

```python
tup1 = (1, 2, "tech", 9676663136)
tup2 = (3, 4, 5, 6, 7)
print(tup1)
print(tup2)
# tup1[0] = "first"  # Error: tuples are immutable
```

## Dictionaries

Dictionaries are collections of key-value pairs enclosed in curly braces {}.

```python
dic = {1: 'one', 2: 'two', 3: 'three'}
print(dic)
print(dic[2])
print(dic.keys())
print(dic.values())
dic[2] = 'second'
print(dic)
```

## Boolean and NoneType

### Boolean Type

Boolean values are either True or False, often used in conditions.

```python
num = 12
print(num > 0)  # Output: True
```

### NoneType

Represents the absence of a value. Often used as a function return type when nothing is returned.

```python
x = None
print(type(x))  # Output: <class 'NoneType'>
```
