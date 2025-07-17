## Python Notes – Part 3

### Operators in Python

#### Introduction to Operators

In Python, **operators** are special symbols or keywords used to perform operations on variables and values. These operations can include arithmetic calculations, comparisons, logical evaluations, and more. Operators allow you to manipulate data and variables effectively, making them essential for any programming task.

Python supports several types of operators, each designed for a specific category of tasks.

---

### Types of Operators in Python

Python provides the following categories of operators:

1. **Arithmetic Operators**
2. **Comparison (Relational) Operators**
3. **Assignment Operators**
4. **Logical Operators**
5. **Bitwise Operators**
6. **Membership Operators**
7. **Identity Operators**

---

#### 1. Arithmetic Operators

Arithmetic operators are used to perform common mathematical operations such as addition, subtraction, multiplication, division, and more.

Assume the following values:

```python
a = 10
b = 20
```

| **Operator** | **Description**        | **Example** | **Result** |
| :----------- | :--------------------- | :---------- | :--------- |
| +            | Addition               | `a + b`     | 30         |
| -            | Subtraction            | `a - b`     | -10        |
| \*           | Multiplication         | `a * b`     | 200        |
| /            | Division (float)       | `a / b`     | 0.5        |
| //           | Floor Division         | `a // b`    | 0          |
| %            | Modulus (Remainder)    | `a % b`     | 10         |
| \*\*         | Exponentiation (Power) | `a ** 2`    | 100        |

**Explanation:**

- `/` gives a floating-point result.
- `//` performs integer (floor) division, discarding the decimal part.
- `%` returns the remainder after division.
- `**` raises the number to the power of the right operand.

---

#### 2. Comparison (Relational) Operators

These operators compare the values of two operands and return a Boolean result (True or False).

| **Operator** | **Description**          | **Example** | **Result** |
| :----------- | :----------------------- | :---------- | :--------- |
| ==           | Equal to                 | `a == b`    | False      |
| !=           | Not equal to             | `a != b`    | True       |
| >            | Greater than             | `a > b`     | False      |
| <            | Less than                | `a < b`     | True       |
| >=           | Greater than or equal to | `a >= b`    | False      |
| <=           | Less than or equal to    | `a <= b`    | True       |

**Usage Example:**

```python
print(a == b) # Output: False
print(a < b)  # Output: True
```

---

#### 3. Assignment Operators

These operators are used to assign values to variables. They can also combine assignment with other operations.

| **Operator** | **Description**         | **Example** | **Equivalent To** |
| :----------- | :---------------------- | :---------- | :---------------- |
| =            | Assign                  | `a = 10`    | `a = 10`          |
| +=           | Add and assign          | `a += b`    | `a = a + b`       |
| -=           | Subtract and assign     | `a -= b`    | `a = a - b`       |
| \*=          | Multiply and assign     | `a *= b`    | `a = a * b`       |
| /=           | Divide and assign       | `a /= b`    | `a = a / b`       |
| //=          | Floor divide and assign | `a //= b`   | `a = a // b`      |
| %=           | Modulus and assign      | `a %= b`    | `a = a % b`       |
| \*\*=        | Exponent and assign     | `a **= 2`   | `a = a ** 2`      |

---

#### 4. Logical Operators

Logical operators are used to combine conditional statements and return Boolean values.

| **Operator** | **Description** | **Example**        | **Result** |
| :----------- | :-------------- | :----------------- | :--------- |
| and          | Logical AND     | `a > 5 and b < 30` | True       |
| or           | Logical OR      | `a < 5 or b < 30`  | True       |
| not          | Logical NOT     | `not(a > 5)`       | False      |

---

#### 5. Bitwise Operators

Bitwise operators perform operations on the binary representation of integers.

Let:

```python
a = 10 # 1010 in binary
b = 4  # 0100 in binary
```

| **Operator** | **Description** | **Example** | **Result** | **Binary**     |
| :----------- | :-------------- | :---------- | :--------- | :------------- |
| &            | Bitwise AND     | `a & b`     | 0          | 0000           |
| `            | `               | Bitwise OR  | `a         | b`             |
| ^            | Bitwise XOR     | `a ^ b`     | 14         | 1110           |
| ~            | Bitwise NOT     | `~a`        | -11        | (inverts bits) |
| <<           | Left Shift      | `a << 2`    | 40         | 101000         |
| >>           | Right Shift     | `a >> 2`    | 2          | 0010           |

---

#### 6. Membership Operators

These operators test whether a value or variable exists in a sequence (like a string, list, tuple, etc.)

| **Operator** | **Description**             | **Example**          | **Result** |
| :----------- | :-------------------------- | :------------------- | :--------- |
| in           | Returns True if present     | `'a' in 'apple'`     | True       |
| not in       | Returns True if not present | `'x' not in 'apple'` | True       |

---

#### 7. Identity Operators

Identity operators compare the memory location of two objects.

| **Operator** | **Description**                      | **Example**  | **Result** |
| :----------- | :----------------------------------- | :----------- | :--------- |
| is           | True if both refer to same object    | `a is b`     | False      |
| is not       | True if they are not the same object | `a is not b` | True       |

**Note:** Even if two variables have the same value, `is` checks whether they refer to the same object in memory.

---

### Python Comparison Operators:

These operators compare the values on either sides of them and decide the relation among them. They are also called Relational operators.

Assume variable `a` holds 10 and variable `b` holds 20, then −

| **Operator** | **Description**                                                                                                   | **Example**             |
| :----------- | :---------------------------------------------------------------------------------------------------------------- | :---------------------- |
| **==**       | If the values of two operands are equal, then the condition becomes true.                                         | `(a == b)` is not true. |
| **!=**       | If values of two operands are not equal, then condition becomes true.                                             | `(a != b)` is true.     |
| **>**        | If the value of left operand is greater than the value of right operand, then condition becomes true.             | `(a > b)` is not true.  |
| **<**        | If the value of left operand is less than the value of right operand, then condition becomes true.                | `(a < b)` is true.      |
| **>=**       | If the value of left operand is greater than or equal to the value of right operand, then condition becomes true. | `(a >= b)` is not true. |
| **<=**       | If the value of left operand is less than or equal to the value of right operand, then condition becomes true.    | `(a <= b)` is true.     |

---

### Python Assignment Operators:

Assume variable `a` holds 10 and variable `b` holds 20, then –

| **Operator**                                     | **Description**                                                                            | **Example**                                                              |
| :----------------------------------------------- | :----------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **=**                                            | Assigns values from right side operands to left side operand                               | `c = a + b` assigns value of a + b into c                                |
| += ADD and ASSIGNMENT                            | It adds right operand to the left operand and assign the result to left operand            | `c += a` is equivalent to `c = c + a`                                    |
| -= Subtract AND ASSGINMNET                       | It subtracts right operand from the left operand and assign the result to left operand     | `c -= a` is equivalent to `c = c - a`                                    |
| \*= Multiply AND ASSIGNMENT                      | It multiplies right operand with the left operand and assign the result to left operand    | `c \*= a` is equivalent to `c = c \* a`                                  |
| /= Divide AND ASSIGNMENT                         | It divides left operand with the right operand and assign the result to left operand       | `c /= a` is equivalent to `c = c / ac /= a` is equivalent to `c = c / a` |
| %= Modulus AND ASSIGNMENT                        | It takes modulus using two operands and assign the result to left operand                  | `c %= a` is equivalent to `c = c % a`                                    |
| \*\*= Exponent AND ASSIGNMENT                    | Performs exponential (power) calculation on operators and assign value to the left operand | `c \*\*= a` is equivalent to `c = c \*\* a`                              |
| //= Floor Division FLOOR DIVISION AND ASSIGNMENT | It performs floor division on operators and assign value to the left operand               | `c //= a` is equivalent to `c = c // a`                                  |

\
**Python Bitwise Operators**

**What are Bitwise Operators?**

Bitwise operators are used to perform operations at the binary level. They operate on integers by converting them into their binary representations (a sequence of bits), and then applying logical operations **bit by bit**.

Each bit of the number is compared and manipulated according to the operation. This is particularly useful in low-level programming, performance optimizations, embedded systems, and dealing with binary data.

---

**Binary Representation Refresher**

To understand bitwise operations, it's important to understand binary notation.

Let’s consider two integers:

```python
a = 60 # Binary: 0011 1100
b = 13 # Binary: 0000 1101
```

Now, let’s break this down:

| **Decimal** | **Binary** |
| :---------- | :--------- |
| 60          | 0011 1100  |
| 13          | 0000 1101  |

---

**Bitwise Operators in Python**

Python supports the following bitwise operators:

| **Operator** | **Name**           | **Description**                                                            |
| :----------- | :----------------- | :------------------------------------------------------------------------- |
| &            | AND                | Sets each bit to 1 if **both** bits are 1                                  |
| `            | `                  | OR                                                                         |
| ^            | XOR (Exclusive OR) | Sets each bit to 1 if **only one** of the bits is 1                        |
| ~            | NOT (Complement)   | Inverts all the bits (also flips the sign of the number in 2’s complement) |
| <<           | Left Shift         | Shifts bits to the left, adding zeros on the right                         |
| >>           | Right Shift        | Shifts bits to the right, removing bits on the right                       |

---

**Bitwise Operation Examples**

Let's go through the bitwise operations step by step using the values:

```python
a = 60 # 0011 1100
b = 13 # 0000 1101
```

**1. AND (a & b)**

```python
a & b = 0000 1100 # Only the bits where both a and b are 1 remain 1
```

`         `= 12

**2. OR (a | b)**

```python
a | b = 0011 1101 # Bits where either a or b is 1 become 1
```

`         `= 61

**3. XOR (a ^ b)**

```python
a ^ b = 0011 0001 # Bits are 1 only if they differ
```

`         `= 49

**4. NOT (~a)**

```python
~a = 1100 0011
```

- In Python, `~a` gives `-(a + 1)` using 2’s complement.
- So, `~60` is -61

```python
print(~60) # Output: -61
```

**5. Left Shift (a << 2)**

```python
a << 2 = 1111 0000 # Shift bits two places to the left, append 00
```

`        `= 240

- Equivalent to multiplying a by 2ⁿ (a \* 2^2 = 60 \* 4 = 240)

**6. Right Shift (a >> 2)**

```python
a >> 2 = 0000 1111 # Shift bits two places to the right, discard the last 2 bits
```

`        `= 15

- Equivalent to dividing a by 2ⁿ (a // 2^2 = 60 // 4 = 15)

| **Operator**             | **Description**                                                                              | **Example**                                                                         |
| :----------------------- | :------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- | --- | ------------------------- |
| & Binary AND             | Operator copies a bit to the result if it exists in both operands                            | `(a & b)` (means 0000 1100)                                                         |
|                          | Binary OR                                                                                    | It copies a bit if it exists in either operand.                                     | `(a | b) = 61 (means 0011 1101) |
| ^ Binary XOR             | It copies the bit if it is set in one operand but not both.                                  | `(a ^ b) = 49 (means 0011 0001)                                                     |
| ~ Binary Ones Complement | It is unary and has the effect of 'flipping' bits.                                           | `(~a ) = -61 (means 1100 0011 in 2's complement form due to a signed binary number. |
| << Binary Left Shift     | The left operands value is moved left by the number of bits specified by the right operand.  | `a << 2 = 240 (means 1111 0000)                                                     |
| >> Binary Right Shift    | The left operands value is moved right by the number of bits specified by the right operand. | `a >> 2 = 15 (means 0000 1111)                                                      |

\
\

### Python Logical Operators:

There are following logical operators supported by Python language.

**Ex:** variable `a` holds 10 and variable `b` holds 20 then

| **Operator**    | **Description**                                                      | **Example**              |
| :-------------- | :------------------------------------------------------------------- | :----------------------- |
| and Logical AND | If both the operands are true then condition becomes true.           | `(a and b)` is true.     |
| or Logical OR   | If any of the two operands are non-zero then condition becomes true. | `(a or b)` is true.      |
| not Logical NOT | Used to reverse the logical state of its operand.                    | `Not(a and b)` is false. |

---

### Python Membership Operators:

Python’s membership operators test for membership in a sequence, such as strings, lists, or tuples is used to search for a particular data in the sequence types. There are two membership operators:

| **Operator** | **Description**                                                                                  | **Example**                                                                    |
| :----------- | :----------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **In**       | Evaluates to true if it finds a variable in the specified sequence and false otherwise.          | `x in y`, here `in` results in a 1 if x is a member of sequence y.             |
| **not in**   | Evaluates to true if it does not finds a variable in the specified sequence and false otherwise. | `x not in y`, here `not in` results in a 1 if x is not a member of sequence y. |

---

### Python Identity Operators

**What Are Identity Operators?**

In Python, **identity operators** are used to **compare the memory locations** (object identity) of two variables. Rather than checking if two variables _contain_ the same data, identity operators check if both variables _refer to the same object_ in memory.

Python stores objects in memory and variables are simply references (or labels) pointing to these objects. Two variables can refer to the same object or to different objects—even if they hold the same value.

---

**Why Use Identity Operators?**

While comparison operators like `==` check for **value equality**, identity operators like `is` and `is not` check for **object identity**. This is especially important when dealing with:

- Mutable data types (lists, dictionaries, sets)
- Object-oriented programming (classes and instances)
- Interned or cached values (like small integers or strings in Python)

---

**Identity Operators in Python**

| **Operator** | **Description**                                                         |
| :----------- | :---------------------------------------------------------------------- |
| is           | Returns True if both variables refer to the **same object** in memory   |
| is not       | Returns True if both variables refer to **different objects** in memory |

---

### Python Operator Precedence

**What is Operator Precedence?**

Operator precedence determines the **order in which operations are evaluated** in an expression. When an expression involves multiple operators, Python uses this hierarchy to decide which operations to perform first.

If two operators share the same precedence, **associativity rules** are applied (usually left-to-right, except for exponentiation which is right-to-left).

Understanding operator precedence is crucial for writing correct and predictable expressions in Python.

---

### Operator Precedence Table

Below is the complete operator precedence list in Python, ordered from **highest precedence (executed first)** to **lowest precedence (executed last)**.

| **Precedence** | **Operator(s)**             | **Category / Description**                                         |
| :------------- | :-------------------------- | :----------------------------------------------------------------- |
| 1              | \*\*                        | Exponentiation: raises a number to a power                         |
| 2              | +x, -x, ~x                  | Unary operations: positive, negative, and bitwise NOT (complement) |
| 3              | \*, /, //, %                | Multiplication, Division, Floor Division, Modulo                   |
| 4              | +, -                        | Addition and Subtraction                                           |
| 5              | <<, >>                      | Bitwise Shift Operators: Left shift and Right shift                |
| 6              | &                           | Bitwise AND                                                        |
| 7              | ^, `                        | `                                                                  |
| 8              | <, <=, >, >=                | Comparison Operators                                               |
| 9              | ==, !=                      | Equality Operators                                                 |
| 10             | =, +=, -=, \*=, /=, //=, %= | Assignment Operators (and their compound forms)                    |
|                | \*\*=, &=, `                | =, ^=, >>=, <<=`                                                   |
| 11             | is, is not                  | Identity Operators                                                 |
| 12             | in, not in                  | Membership Operators                                               |
| 13             | not, and, or                | Logical Operators                                                  |

---

### Explanation of Operator Categories

**1. Exponentiation (\*\*)**

- Raises a number to a given power.

2 \*\* 3 = 8

**2. Unary Operators (+, -, ~)**

- +x: Unary plus (returns x)
- -x: Unary minus (negates x)
- ~x: Bitwise NOT (inverts all bits)

~5 # = -6

**3. Multiplicative Operators (\*, /, //, %)**

- \*: Multiplication
- /: Division
- //: Floor division (returns the quotient rounded down)
- %: Modulo (returns the remainder)

5 // 2 = 2

5 % 2 = 1

**4. Additive Operators (+, -)**

- Standard addition and subtraction.

3 + 4 = 7

**5. Bitwise Shift Operators (<<, >>)**

- <<: Left shift (moves bits to the left)
- > > : Right shift (moves bits to the right)

4 << 1 = 8

**6. Bitwise AND (&)**

- Performs AND on each pair of bits.

5 & 3 = 1

**7. Bitwise OR and XOR (|, ^)**

- |: Bitwise OR
- ^: Bitwise XOR (exclusive OR)

5 | 3 = 7

5 ^ 3 = 6

**8. Comparison Operators (<, <=, >, >=)**

- Used to compare values.

3 < 4 = True

**9. Equality Operators (==, !=)**

- ==: Equal to
- !=: Not equal to

4 == 4 = True

4 != 5 = True

**10. Assignment Operators**

- Used to assign values or update variables.
- Includes compound assignments like +=, -=, etc.

```python
x = 5
x += 2 # x = x + 2 → x becomes 7
```

**11. Identity Operators (is, is not)**

- Checks whether two variables point to the same object in memory.

```python
a = [1, 2]
b = a
a is b # True
```

**12. Membership Operators (in, not in)**

- Tests if a value exists in a sequence.

```python
3 in [1, 2, 3] # True
```

**13. Logical Operators (not, and, or)**

- Combine boolean expressions.

```python
True and False # False
not True # False
```

---

### Associativity Rules

| **Operator** | **Associativity Direction** |
| :----------- | :-------------------------- |
| `**`         | Right to Left               |
| All others   | Left to Right               |
