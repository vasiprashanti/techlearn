# Python Notes 7

---

## Functions in Python – A Comprehensive Explanation

A **function** in Python is a reusable block of organized, self-contained code that performs a specific task. Functions are designed to increase modularity, reduce redundancy, and improve code readability and maintainability. A function can optionally take input parameters, process them, and optionally return a result.

---

## Why Use Functions?

- **Reusability**: Define once, use multiple times.
- **Modularity**: Divides the program into manageable pieces.
- **Maintainability**: Changes in logic can be handled in one place.
- **Testing**: Individual units can be tested independently.

---

### 1. Defining a Function

Functions are defined using the `def` keyword, followed by a unique name (identifier), parentheses which may include input parameters, and a colon. The body of the function is written in an indented block below the definition.

**Syntax:**

```python
def function_name(parameter1, parameter2, ...):
    # Code block
    return value # optional
```

**Example:**

```python
def displayMessage():
    print("Hello! Welcome to TechLearn Solutions")
```

This function does not take any parameters and simply prints a message.

---

### 2. Calling a Function

To execute the function’s code, you simply call it using its name followed by parentheses, passing required arguments if any.

**Syntax:**

```python
function_name(arguments)
```

**Example:**

```python
displayMessage()
```

If the function is defined in a separate module or file (e.g., `test.py`), you must import the module before calling the function:

```python
import test

test.displayMessage()
```

---

## Types of Functions Based on Input and Return Value

Python supports multiple types of functions based on whether they receive input parameters and whether they return a value.

---

### 1. Function with Input Parameters and a Return Value

Such functions accept data through arguments, process it, and return a result.

**Example:**

```python
def add(n1, n2):
    return n1 + n2

result = add(5, 67)
print(result) # Output: 72
print(add(45, 30)) # Output: 75
```

Another example involving computation:

**Example: Area of a Circle**

```python
import math

def findCircleArea(radius):
    return math.pi * radius ** 2

circle_area = findCircleArea(5.9)
print('Area of circle is:', circle_area)
print('Area of circle is:', round(circle_area, 2))
```

**Output:**

```
Area of circle is: 109.3588402714607
Area of circle is: 109.36
```

---

### 2. Function with Input Parameters and No Return Value

Such functions take inputs and execute a block of code but do not return any result explicitly.

**Example: Student Report Generation**

```python
def hasPassed(std_marks):
    for mark in std_marks:
        if mark < 8:
            return False
    return True

def generateStdReport(std_marks):
    total = sum(std_marks)
    print('Student marks are:')
    for sub in std_marks:
        print(sub, end=' ')
    print('Total:', total)
    result = hasPassed(std_marks)
    if result:
        print('Result: Passed')
    else:
        print('Result: Failed')

std1 = [12, 16, 17, 11, 18]
std2 = [19, 7, 17, 18, 16]

generateStdReport(std1)
generateStdReport(std2)
```

**Output:**

```
Student marks are:
12 16 17 11 18 Total: 74
Result: Passed

Student marks are:
19 7 17 18 16 Total: 77
Result: Failed
```

---

### 3. Function with Real-World Logic: Shopping List Manager

A practical example to demonstrate the usage of multiple functions to simulate a shopping list system.

**Program: Shopping List Manager**

```python
import time

shopping_list = set()

def addItem(name):
    shopping_list.add(name)
    print(name, 'added to the list')

def viewList():
    if len(shopping_list) == 0:
        print('Your list is empty')
    else:
        print('Your list has:')
        for product in shopping_list:
            print(product)
            time.sleep(1)

def removeItem(item):
    if item in shopping_list:
        shopping_list.remove(item)
        print(item, 'is removed from the list')
    else:
        print(item, 'not found in the list')

def clearList():
    shopping_list.clear()
    print('Shopping list is cleared')

def getItemsCount():
    print('Your shopping list has:', len(shopping_list), 'items')

addItem('Milk')
addItem('Sugar')
addItem('Tea')
addItem('Milk') # Will not add again as sets avoid duplicates
getItemsCount()
viewList()
removeItem('Milk')
viewList()
clearList()
```

**Output:**

```
Milk added to the list
Sugar added to the list
Tea added to the list
Milk added to the list
Your shopping list has: 3 items
Your list has:
Sugar
Tea
Milk
Milk is removed from the list
Your list has:
Sugar
Tea
Shopping list is cleared
```

**Key Observations in this Program:**

- A **set** is used to store shopping items to automatically avoid duplicates.
- **Modular functions** are written for specific actions: adding, viewing, removing, and clearing.
- **Real-time delay** using `time.sleep(1)` improves user experience when displaying items.

---

## Function Parameters in Python

When defining and calling functions in Python, the arguments passed to a function can be categorized based on their behavior and flexibility. Python supports several types of function arguments:

- **Required (Positional) Arguments**
- **Keyword Arguments**
- **Default Arguments**
- **Variable-Length Arguments**
  - Arbitrary Positional Arguments (`*args`)
  - Arbitrary Keyword Arguments (`**kwargs`)
- **Keyword-Only Arguments**

---

### 1. Required (Positional) Arguments

These arguments must be provided in the exact number and order as specified in the function definition. Omitting or misordering them results in a `TypeError`.

**Example:**

```python
# test.py

def register(name, mobile, email):
    print('Registered Successfully')
    print('Id Card:')
    print('Name :', name)
    print('Mobile:', mobile)
    print('Email :', email)

# Usage
import test

test.register('Kumar', 987678966, 'kumar@gmail.com')

# Incorrect Usage
test.register('Kumar', 987678966) # Error: missing one required argument
```

---

### 2. Keyword Arguments

Arguments can be passed by explicitly specifying the parameter name, allowing them to be passed **in any order**. However, **all positional arguments must come before any keyword arguments**.

**Example:**

```python
def getCustomerDetails(name, mobile, age):
    print('Name :', name)
    print('Mobile:', mobile)
    print('Age :', age)

# Usage
getCustomerDetails(mobile=8976578887, name='Kumar', age=28)

# Incorrect Usage
getCustomerDetails(mobile=8976578887, 'Kumar', 28) # Error: positional argument follows keyword argument
```

---

### 3. Default Arguments

Parameters can have default values. If an argument is not passed, the default value is used. If passed, it overrides the default.

**Example:**

```python
def add(n1=0, n2=0):
    return n1 + n2

print(add()) # Uses default values
print(add(5)) # Overrides n1 only
print(add(56, 4)) # Overrides both
```

**Output:**

```
0
5
60
```

**Practical Example:**

```python
# test.py
import datetime

def bookTickets(movie, ticket_cost, date=datetime.date.today(), tickets_count=2):
    print("Movie :", movie)
    print("Date :", date.strftime('%d-%m-%Y'))
    print("Ticket Count:", tickets_count)
    print("Total Cost :", tickets_count * ticket_cost)

# Usage
import test

test.bookTickets("Manjummel Boys", 250)
```

---

### 4. Variable-Length Arguments

#### a) Arbitrary Positional Arguments (`*args`)

- Used to pass multiple **non-keyword** arguments.
- Received as a **tuple**.

**Example:**

```python
def addStdNames(*batch):
    print("Names added are:")
    for std_name in batch:
        print(std_name)

addStdNames()
addStdNames('Kumar')
addStdNames('Kiran', 'Yash', 'Ram')
```

**Output:**

```
Names added are:
Names added are:
Kumar
Names added are:
Kiran
Yash
Ram
```

---

#### b) Arbitrary Keyword Arguments (`**kwargs`)

- Used to pass multiple **keyword arguments**.
- Received as a **dictionary**.

**Example:**

```python
def addItems(**cart):
    print("Cart items are:")
    for item, qnt in cart.items():
        print(item, '=', qnt)

addItems(milkshakes=6, lottochocopie=6, bingo=3)
```

**Output:**

```
Cart items are:
milkshakes = 6
lottochocopie = 6
bingo = 3
```

---

#### Combined Example: Using `*args` and `**kwargs` Together

```python
def addBatchDetails(*std_ids, **stds):
    print('Details of the students', end=' ')
    for std_id in std_ids:
        print(std_id, end=' ')
    print('are:')
    for std_name, std_data in stds.items():
        print(std_name, '->', std_data)

addBatchDetails(
    101, 102, 103,
    Kiran=[9876545666, 'Hyderabad'],
    Suman=[89777779, 'Chennai'],
    Pranay=[789898788, 'Bengaluru']
)
```

**Output:**

```
Details of the students 101 102 103 are:
Kiran -> [9876545666, 'Hyderabad']
Suman -> [89777779, 'Chennai']
Pranay -> [789898788, 'Bengaluru']
```

---

### 5. Keyword-Only Arguments

By placing a `*` before parameter names, any parameters that follow must be passed as keyword arguments during function calls. Positional arguments are not allowed for those.

**Example:**

```python
def findArea(*, len, bre):
    return len * bre

# Valid Call
print(findArea(len=5, bre=6)) # Output: 30

# Invalid Call
print(findArea(5, 6)) # TypeError: findArea() takes 0 positional arguments
```

---

## Conclusion

Python offers a wide range of flexible function parameter options that make it easy to write general, reusable, and intuitive functions. Understanding and using these effectively helps in writing cleaner, more maintainable code.

---

## Summary Table

| **Type**                   | **Syntax**             | **Accepts**               | **Received As** |
| :------------------------- | :--------------------- | :------------------------ | :-------------- |
| Required (Positional)      | `func(a, b)`           | Fixed position inputs     | Individual vars |
| Keyword Arguments          | `func(a=val, b=val)`   | Named inputs              | Individual vars |
| Default Arguments          | `def func(a=0)`        | Optional inputs           | Individual vars |
| Arbitrary Positional (`*`) | `def func(*args)`      | Variable non-keyword args | Tuple           |
| Arbitrary Keyword (`**`)   | `def func(**kwargs)`   | Variable keyword args     | Dictionary      |
| Keyword-Only Arguments     | `def func(*, a, b)`    | Keyword-only arguments    | Individual vars |
| Positional-only Arguments  | `def func(a, /)`       | Positional-only inputs    | No key allowed  |
| Combined                   | `def func(a, /, *, b)` | Mixed inputs              | Mixed           |
| Lambda                     | `lambda x: x+1`        | Inline function           | Inline function |

---

## Function Definition in Python: Parameter Types

Python allows flexibility in function definitions by enabling the use of different types of parameters to handle a wide range of input use cases. These types include:

---

### 1. Required (Positional) Arguments

- These are the **basic parameters** expected in the **exact order and quantity** as defined in the function.
- Missing or extra arguments result in a TypeError.

**Example:**

```python
def register(name, mobile, email):
    print('Registered Successfully')
    print('Id Card: ')
    print('Name : ', name)
    print('Mobile : ', mobile)
    print('Email :', email)

# Function Call:
register('Kumar', 987678966, 'kumar@gmail.com')

# Incorrect Call:
register('Kumar', 987678966) # Missing 'email'
# TypeError
```

---

### 2. Keyword Arguments

- Allows arguments to be passed using **key = value** format.
- **Order does not matter** when using keyword arguments.
- However, **positional arguments must come before keyword arguments**.

**Example:**

```python
def getCustomerDetails(name, mobile, age):
    print('Name :', name)
    print('Mobile:', mobile)
    print('Age :', age)

# Valid Call:
getCustomerDetails(age=28, name='Kumar', mobile=8976578887)

# Invalid Call:
getCustomerDetails(mobile=8976578887, 'Kumar', 28)
# SyntaxError: positional argument follows keyword argument
```

---

### 3. Default Arguments

- Parameters can be assigned **default values** during function definition.
- If a value is not provided during the call, the **default is used**.

**Example:**

```python
def add(n1=0, n2=0):
    return n1 + n2

print(add()) # 0 + 0
print(add(5)) # 5 + 0
print(add(56, 4)) # 56 + 4
```

---

### 4. Variable-length Arguments

#### a) Arbitrary Positional Arguments (`*args`)

- Accepts **multiple positional arguments** as a **tuple**.
- Used when **number of arguments is not fixed**.

```python
def addStdNames(*batch):
    print("Names added are:")
    for name in batch:
        print(name)

# Function Calls:
addStdNames('Kumar', 'Kiran', 'Ram')
```

---

#### b) Arbitrary Keyword Arguments (`**kwargs`)

- Accepts multiple **keyword arguments** as a **dictionary**.
- Useful for passing **named arguments** dynamically.

```python
def addItems(**cart):
    print("Cart items are:")
    for item, quantity in cart.items():
        print(item, '=', quantity)

# Function Call:
addItems(milkshakes=6, lottochocopie=6, bingo=3)
```

---

#### c) Using Both `*args` and `**kwargs`

```python
def addBatchDetails(*std_ids, **stds):
    print('Details of the students', end=' ')
    for std_id in std_ids:
        print(std_id, end=' ')
    print('\nare:')
    for name, data in stds.items():
        print(name, '->', data)

# Call:
addBatchDetails(101, 102, Kiran=[98765, 'Hyderabad'], Pranay=[12345, 'Bengaluru'])
```

---

### 5. Keyword-Only Arguments

- Arguments that **must be passed using keywords**.
- Declared after a `*` in the parameter list.

```python
def findArea(*, len, bre):
    return len * bre

findArea(len=5, bre=6) # Valid
findArea(5, 6) # TypeError
```

---

### 6. Positional-Only Arguments

- Arguments that **must be passed positionally**.
- Declared before `/` in the parameter list.

```python
def viewDetails(name, mobile, /):
    print('Name:', name)
    print('Mobile:', mobile)

viewDetails('Amar', 9676663136) # Valid
viewDetails(name='Amar', mobile='9676663136') # TypeError
```

---

### 7. Combining Positional-only and Keyword-only Arguments

- Parameters before `/` → **Positional-only**
- Parameters after `*` → **Keyword-only**
- Useful for **flexible and explicit APIs**.

```python
def findTotal(a, b, /, *, c, d):
    print('Total is:', a + b + c + d)

findTotal(5, 6, c=7, d=8) # Valid
findTotal(c=5, d=2, 3, 4) # SyntaxError
```

---

### 8. Lambda Functions

- Also called **anonymous functions**.
- Syntax: `lambda parameters: expression`

**Examples:**

```python
squareArea = lambda side: side * side
simpleInterest = lambda p, r, t: p * r * t / 100
checkEvenOrOdd = lambda num: "even" if num % 2 == 0 else "odd"
printRectArea = lambda length, breadth: print("Area:", length * breadth)

print(squareArea(12))
print(simpleInterest(250000, .03, 24))
print(checkEvenOrOdd(24))
printRectArea(12, 6)
```

**Lambda inside another function:**

```python
def multiply(num):
    return lambda val: num * val

twice = multiply(2)
print(twice(5)) # 10
```

---

## 🔍 Scope of Variables in Python

---

### 1. Global Variables

- Declared **outside any function or class**.
- Can be **accessed globally** in the same file.
- Can be **read anywhere**, but to **modify inside a function**, `global` keyword must be used.

**Example:**

```python
x = 10

def show():
    print("Value of x:", x)

# If you **want to modify x inside a function**:
def update():
    global x
    x += 5
```

---

### 2. Local Variables

- Declared **inside a function**.
- Only accessible **within that function**.
- Exist temporarily **while the function executes**.

**Example:**

```python
def add(n1, n2):
    res = n1 + n2
    print('sum =', res)

add(10, 20)
print(res) # Error: 'res' is not defined outside the function
```

---

### 3. Global vs Local Conflict Example

```python
balance = 5000

def deposit(amt):
    global balance
    balance += amt

# If global balance is not declared, it will create a **local copy**, and the global variable won’t be updated.
```

---

### 4. Real-world Example (Remote Controller Simulation)

```python
temp = 18
mode = False

def power():
    global mode, temp
    if mode:
        mode = False
        temp = 18
    else:
        mode = True
    print("Power Mode:", mode)

def incTemp():
    global temp
    if mode and temp < 30:
        temp += 1
    print("Temp:", temp)
```

---

## 🔍 `locals()` and `globals()` Functions

- **`locals()`**: Returns a dictionary of **local symbol table**.
- **`globals()`**: Returns a dictionary of **global symbol table**.

**Example:**

```python
def add(n1, n2):
    res = n1 + n2
    print("Local Scope:", locals())

add(10, 20)
print("Global Scope:", globals())
```

---

## ✅ Summary Table

| **Type**            | **Declaration**     | **Passed As**       | **Stored As**   |
| :------------------ | :------------------ | :------------------ | :-------------- |
| Required/Positional | `def f(x, y)`       | `f(1, 2)`           | Direct values   |
| Keyword             | `def f(x, y)`       | `f(x=1, y=2)`       | Key-value pairs |
| Default             | `def f(x=0)`        | Optional            | Defaults used   |
| `*args`             | `def f(*args)`      | `f(1,2,3)`          | Tuple           |
| `**kwargs`          | `def f(**kwargs)`   | `f(a=1, b=2)`       | Dictionary      |
| Keyword-only        | `def f(*, x)`       | `f(x=1)`            | Must use key    |
| Positional-only     | `def f(x, /)`       | `f(1)`              | No key allowed  |
| Combined            | `def f(a, /, *, b)` | `f(1, b=2)`         | Mixed           |
| Lambda              | `lambda x: x+1`     | `f = lambda x: x+1` | Inline function |

---
