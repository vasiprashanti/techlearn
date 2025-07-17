## Python Notes – In-Depth Guide to Built-In Functions, Data Types, and Control Statements

---

### Control Statements in Python (Expanded Version)

Control statements in Python are constructs that allow developers to make decisions, repeat actions, or jump out of loops. These are essential for writing dynamic and interactive programs. In Python, control flow determines the order in which statements are executed. By default, statements are executed sequentially from top to bottom. However, using control statements, we can alter this natural flow.

Python supports three broad categories of control statements:

1. **Decision-Making Statements**
2. **Looping Statements**
3. **Jump Statements**

These mechanisms empower the program to behave intelligently, depending on various conditions at runtime.

---

### 1. Decision Making Statements (Expanded)

Decision making statements in Python are used to execute certain blocks of code based on specific conditions. These conditions evaluate to either `True` or `False`. Python provides flexible and readable syntax for implementing conditional logic.

#### a) `if` Statement

The simplest decision-making statement. It executes a block of code if the condition evaluates to `True`.

**Syntax:**

```python
if condition:
    # block of code
```

**Explanation:**

- If the condition is true, the block inside the `if` is executed.
- If it’s false, nothing happens.

**Example:**

```python
age = 20
if age >= 18:
    print("You are eligible to vote.")
```

#### b) `if...else` Statement

Allows the program to choose between two blocks of code depending on the condition.

**Syntax:**

```python
if condition:
    # true block
else:
    # false block
```

**Example:**

```python
age = 16
if age >= 18:
    print("Eligible to vote")
else:
    print("Not eligible to vote")
```

#### c) `if...elif...else` Ladder

Used when multiple conditions need to be checked. The first true condition's block is executed.

**Syntax:**

```python
if condition1:
    # block1
elif condition2:
    # block2
elif condition3:
    # block3
else:
    # default block
```

**Example:**

```python
score = 85
if score >= 90:
    print("Grade A")
elif score >= 75:
    print("Grade B")
elif score >= 60:
    print("Grade C")
else:
    print("Fail")
```

#### d) Nested `if` Statements

Sometimes decisions need to be made within other decisions. Nested `if` statements allow this hierarchical evaluation.

**Example:**

```python
username = "admin"
password = "admin123"
if username == "admin":
    if password == "admin123":
        print("Login successful")
    else:
        print("Incorrect password")
else:
    print("Unknown user")
```

**Note:**

- Each inner `if` is only evaluated if its outer condition is satisfied.
- Proper indentation is critical for readability and correctness.

#### e) Dictionary as a Replacement for `switch` Statement

Python does not have a native `switch` statement like some other languages (e.g., C++, Java). However, you can simulate a similar behavior using a dictionary.

**Example:**

```python
def menu(option):
    return {
        1: "Start",
        2: "Settings",
        3: "Exit"
    }.get(option, "Invalid choice")

print(menu(1))
```

**Key Points:**

- Dictionary keys must be immutable types (int, float, bool, str, or tuple).
- Use `.get()` to provide a default value to avoid `KeyError`.
- This approach only works for exact matches, not ranges.

---

### 2. Looping Statements (Expanded)

Looping statements are used when a block of code needs to be executed repeatedly under a certain condition. Python offers two main types of loops: `while` and `for`, along with nested and controlled versions using conditions or jump statements.

#### a) `while` Loop

The `while` loop keeps executing the block of code as long as the condition is true.

**Syntax:**

```python
while condition:
    # block of code
```

**Example:**

```python
i = 1
while i <= 5:
    print(i)
    i += 1
```

**Explanation:**

- Initialization: `i = 1`
- Condition check: `i <= 5`
- Execution of loop body and incrementing value until the condition becomes False.

#### b) `for` Loop with `range()`

The `for` loop in Python iterates over a sequence of values. When combined with `range()`, it becomes a powerful tool to iterate over numerical ranges.

**Syntax:**

```python
for i in range(start, stop, step):
    # block of code
```

**Example:**

```python
for i in range(1, 6):
    print(i)
```

#### c) `for` Loop with Collections

This form is also known as a for-each loop. It’s used to iterate directly over elements of a collection like a list, tuple, string, or dictionary.

**Example:**

```python
colors = ["red", "blue", "green"]
for color in colors:
    print(color)
```

#### d) Nested Loops

A loop inside another loop is called a nested loop. Commonly used in matrix processing or pattern generation.

**Example:**

```python
for i in range(3):
    for j in range(2):
        print(f"i={i}, j={j}")
```

**Explanation:**

- Outer loop runs 3 times.
- For each iteration of the outer loop, the inner loop runs 2 times.

---

### 3. Jump Statements (Expanded)

Jump statements alter the flow of control unconditionally. These include:

#### a) `break` Statement

Terminates the loop prematurely when a condition is met.

**Example:**

```python
for i in range(10):
    if i == 5:
        break
    print(i)
```

#### b) `continue` Statement

Skips the current iteration and proceeds to the next one.

**Example:**

```python
for i in range(5):
    if i == 2:
        continue
    print(i)
```

#### c) `pass` Statement

Acts as a placeholder. It does nothing and is used when the code is syntactically required but not implemented.

**Example:**

```python
if True:
    pass  # Placeholder for future implementation
```

**Use Case:** Helps during development to avoid errors in unfinished code blocks.

Here’s the continuation you requested — now fully expanded and formalized — covering all five **Practice Programs** in a highly detailed, academic tone. These include:

---

**🧠 Practice Programs – In-Depth Explanation and Python Implementation**

---

**1. ✅ User Login System: Username & Password Verification**

**Problem Statement:**\
Write a program to accept the username and password from the user and check if they match the stored credentials. Provide meaningful responses based on the following test cases.

**Stored Credentials:**

username = 'techlearn'

password = 'tls@2014'

**Detailed Requirements:**

- ✔ If both username and password match the stored values → print "Hello! Techlearn".
- ❌ If any field is left blank → prompt "Enter the username/password."
- ❌ If credentials don’t match → print "Invalid Username/Password".

**Python Implementation:**

```python
stored_username = 'techlearn'
stored_password = 'tls@2014'

username = input("Enter your username: ").strip()
password = input("Enter your password: ").strip()

if username == "" or password == "":
    print("Enter the username/password.")
elif username == stored_username and password == stored_password:
    print("Hello! Techlearn")
else:
    print("Invalid Username/Password")
```

**Concepts Covered:**

- Input validation
- Conditional logic
- String comparison

---

**2. 🔐 Password Change System with Validation**

**Objective:**\
Design a secure password change system that:

- Validates old password
- Accepts new password and reconfirms it
- Changes password only if all conditions are met

**Logic Flow:**

1. Prompt for the old password.
1. If it matches the actual password → allow new password entry.
1. Reconfirm the new password.
1. If both new entries match → update the password.
1. Display appropriate failure messages.

**Implementation:**

```python
actual_password = "tls@2014"

old_password = input("Enter old password: ").strip()

if old_password != actual_password:
    print("Wrong Password")
else:
    new_password = input("Enter new password: ").strip()
    confirm_password = input("Re-enter new password: ").strip()
    if new_password != confirm_password:
        print("New Passwords do not match")
    else:
        actual_password = new_password
        print("Password updated successfully!")
```

**Topics Covered:**

- Nested conditions
- String matching
- Secure password validation

---

**3. 🏦 Bank Account Debit Simulation**

**Problem:**\
Create a Python program that simulates debit operations from a customer’s bank account, applying multiple validation rules.

**Account Data:**

account_no = 12345

balance = 12000

**Validation Rules:**

- ✋ If amount > ₹20,000 → “Daily limit exceeded”
- ❌ If amount is not a multiple of 100 → “Enter only multiple’s of 100’s”
- ❌ If amount > balance → “Insufficient Balance”
- ✅ Else → proceed with debit

**Code:**

```python
account_no = 12345
balance = 12000

debit_amount = int(input("Enter amount to withdraw: "))

if debit_amount > 20000:
    print("Daily limit exceeded")
elif debit_amount % 100 != 0:
    print("Enter only multiple’s of 100’s")
elif debit_amount > balance:
    print("Insufficient Balance")
else:
    balance -= debit_amount
    print(f"Transaction successful. New balance: ₹{balance}")
```

**Concepts:**

- Real-world simulation
- Compound condition checking
- Arithmetic and control flow

---

**4. 🔐 Strong Password Validator**

**Goal:**\
Validate if a password is strong using the following criteria:

1. Minimum length: 9 characters
1. At least one lowercase letter
1. At least one uppercase letter
1. At least one digit
1. At least one special character
1. Must not match the old password
1. Must not contain spaces

**Implementation:**

```python
import string

old_password = "tls@2014"

new_password = input("Enter new password: ")

if len(new_password) < 9:
    print("Password too short. Minimum 9 characters required.")
elif new_password == old_password:
    print("New password must be different from the old password.")
elif " " in new_password:
    print("Password must not contain spaces.")
elif not any(c.islower() for c in new_password):
    print("Password must include a lowercase letter.")
elif not any(c.isupper() for c in new_password):
    print("Password must include an uppercase letter.")
elif not any(c.isdigit() for c in new_password):
    print("Password must include a digit.")
elif not any(c in string.punctuation for c in new_password):
    print("Password must include a special character.")
else:
    print("Strong password!")
```

**Skills Applied:**

- String manipulation
- Character classification
- Defensive programming

---

**5. 🍽 Swiggy/Zomato Offer Calculator**

**Task:**\
Simulate the final bill for a Swiggy/Zomato user after applying:

- Platform charges
- Delivery fee
- Discounts (based on total)

**Rules:**

- If total ≥ ₹500 → 20% discount
- If total ≥ ₹300 → 10% discount
- Else → no discount
- Fixed delivery fee: ₹40
- Platform charges: 5% of total

**Code:**

```python
total = float(input("Enter order total: ₹"))

delivery_fee = 40
platform_charge = 0.05 * total

# Calculate discount
if total >= 500:
    discount = 0.20 * total
elif total >= 300:
    discount = 0.10 * total
else:
    discount = 0.0

final_amount = total + platform_charge + delivery_fee - discount

print(f"Subtotal: ₹{total}")
print(f"Platform charges: ₹{platform_charge:.2f}")
print(f"Delivery fee: ₹{delivery_fee}")
print(f"Discount applied: ₹{discount:.2f}")
print(f"Final amount to pay: ₹{final_amount:.2f}")
```

**Topics Touched:**

- Financial computation
- Percentage and conditional discounts
- Modular program structure

Great! Let's continue with the next major foundational topic:

**🔧 Functions in Python – Deep Dive & Formal Explanation**

---

**📌 What is a Function?**

A **function** is a reusable block of code that performs a specific task. Functions help in organizing code logically and reduce repetition by allowing tasks to be executed when called by name.

Python supports two main types of functions:

1. **Built-in Functions** – Predefined in Python (e.g., print(), len(), sum(), etc.)
1. **User-defined Functions** – Functions created by the programmer using the def keyword.

---

**🔹 Benefits of Using Functions**

- ✅ **Modularity**: Divides code into logical chunks
- ✅ **Reusability**: Write once, use many times
- ✅ **Maintainability**: Easy to debug and enhance
- ✅ **Scalability**: Can be tested and modified independently

---

**🧠 Syntax of a Function**

def function_name(parameters):

`    `"""

`    `Optional documentation string (docstring)

`    `"""

`    `# Block of statements

`    `return value

**Explanation:**

- def: Keyword to define a function
- function_name: Name of the function (must follow identifier rules)
- parameters: Input values passed to the function
- return: Optional, used to send result/output back to caller

---

**✅ Example: Simple Function Without Parameters**

```python
def greet():
    print("Hello, welcome to Python functions!")

greet()
```

---

**✅ Example: Function With Parameters and Return Value**

```python
def add(a, b):
    return a + b

result = add(5, 3)
print("The sum is:", result)
```

---

**📦 Types of Arguments in Functions**

1. **Positional Arguments**
1. **Keyword Arguments**
1. **Default Arguments**
1. **Variable-Length Arguments (\*args, \*\*kwargs)**

---

**1. Positional Arguments**

Values are passed in order and matched to parameters.

```python
def full_name(fname, lname):
    print("Full Name:", fname, lname)

full_name("John", "Doe")
```

---

**2. Keyword Arguments**

Arguments are passed using parameter names.

```python
full_name(fname="Jane", lname="Smith")
```

---

**3. Default Arguments**

Parameter takes a default value if not provided.

```python
def greet(name="Guest"):
    print("Hello", name)

greet()
greet("Alice")
```

---

**4. Variable-Length Arguments**

When the number of inputs is unknown, use:

- \*args: For any number of **positional arguments**
- \*\*kwargs: For any number of **keyword arguments**

```python
def sum_all(*args):
    print("Sum:", sum(args))

sum_all(2, 4, 6)

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key} = {value}")

print_info(name="Bob", age=25)
```

---

**🔁 Function Returning Multiple Values**

Python functions can return multiple values as a tuple.

```python
def operations(a, b):
    return a + b, a - b, a * b

add, sub, mul = operations(10, 5)

print(add, sub, mul)
```

---

**🧪 Function Scope – Local and Global Variables**

- **Local Variables**: Declared inside the function
- **Global Variables**: Declared outside and accessible throughout the program

```python
x = 10 # Global

def show():
    x = 5 # Local
    print("Inside:", x)

show()
print("Outside:", x)
```

---

**🧰 Lambda Functions (Anonymous Functions)**

- Single-expression functions
- Defined using lambda keyword
- Useful for short operations like filtering or mapping

```python
square = lambda x: x ** 2

print(square(4))
```

---

**📚 Docstrings – Documenting Functions**

```python
def multiply(a, b):
    """Returns the product of two numbers."""
    return a * b

print(multiply.__doc__)
```

---

**🛠 Real-World Program Example**

**Problem:** Write a program to calculate a student's total and average marks using a function.

```python
def compute_marks(marks):
    total = sum(marks)
    average = total / len(marks)
    return total, average

student_marks = [85, 78, 92, 88, 76]

total, average = compute_marks(student_marks)

print("Total:", total)
print("Average:", average)
```

**3) Banking Account Debit Program**

```python
# Banking Account Debit Program

acno = 12345
balance = 12000
daily_limit = 20000

debit_amount = int(input("Enter amount to debit: "))

if debit_amount > daily_limit:
    print("Daily limit exceeded")
elif debit_amount % 100 != 0:
    print("Enter only multiple’s of 100’s")
elif debit_amount > balance:
    print("Insufficient Balance")
else:
    balance -= debit_amount
    print(f"Amount debited successfully. Remaining balance: {balance}")
```

---

**4) Password Validation Program**

```python
import re

old_password = input("Enter your old password: ")
new_password = input("Enter your new password: ")

def is_strong_password(pwd, old_pwd):
    if len(pwd) <= 8:
        return False, "Password length must be more than 8"
    if ' ' in pwd:
        return False, "Password cannot contain spaces"
    if pwd == old_pwd:
        return False, "New password can't be same as old password"
    if not re.search(r"[A-Z]", pwd):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", pwd):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", pwd):
        return False, "Password must contain at least one digit"
    if not re.search(r"[!@#$%^&\*(),.?\":{}|<>]", pwd):
        return False, "Password must contain at least one special character"
    return True, "Strong Password"

valid, message = is_strong_password(new_password, old_password)

if valid:
    print("Password changed successfully. Your password is Strong.")
else:
    print(f"Weak Password: {message}")
```

---

**5) Swiggy/Zomato Offer Bill Calculation**

```python
# Sample program for bill calculation with offers and charges

bill_amount = float(input("Enter the total purchased bill amount: "))

# Example charges:
delivery_charge = 40 # fixed
tax_rate = 0.05 # 5% tax
discount = 0

# Offer: if bill > 500, 10% discount
if bill_amount > 500:
    discount = 0.10 * bill_amount

# Calculate tax on the amount after discount
tax = (bill_amount - discount) * tax_rate

final_amount = bill_amount - discount + tax + delivery_charge

print(f"Bill Amount: ₹{bill_amount:.2f}")
print(f"Discount: ₹{discount:.2f}")
print(f"Tax: ₹{tax:.2f}")
print(f"Delivery Charge: ₹{delivery_charge:.2f}")
print(f"Final Payable Bill: ₹{final_amount:.2f}")
```
