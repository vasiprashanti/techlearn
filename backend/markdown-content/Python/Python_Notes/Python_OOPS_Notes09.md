# Python Notes - 09

---

## Object-Oriented Programming Principles (OOP's)

The four fundamental principles of Object-Oriented Programming are:

1. **Inheritance**
2. **Polymorphism**
3. **Encapsulation**
4. **Abstraction**

---

## Inheritance

Inheritance is a core principle of OOP that allows one class (child) to acquire the properties and behaviors (methods and attributes) of another class (parent). It enables **code reusability**, **extensibility**, and the creation of **hierarchical relationships**.

### Key Concepts

- The class from which properties are inherited is called the **Parent** (or Super) class.
- The class that inherits is called the **Child** (or Sub) class.
- Inheritance implies an **IS-A** relationship (e.g., A Dog IS-A Animal).
- When a child object is created, the parent's constructor is implicitly called first.

### Syntax of Inheritance

```python
class Parent:
    # properties and methods

class Child(Parent):
    # inherits from Parent
    # can override or add new features
```

---

### Example 1: Standard vs Scientific Calculator

```python
import math

class StandardCalculator:
    def __init__(self):
        self.res = 0

    def viewRes(self):
        print('Result: ', round(self.res, 2))

    def add(self, n1, n2):
        self.res = n1 + n2

    def diff(self, n1, n2):
        self.res = n1 - n2
        self.viewRes()

    def div(self, n1, n2):
        self.res = n1 / n2
        self.viewRes()

    def mul(self, n1, n2):
        self.res = n1 * n2
        self.viewRes()

    def square(self, n1):
        self.res = n1 * n1
        self.viewRes()

class ScientificCalculator(StandardCalculator):
    def cos(self, n1):
        self.res = math.cos(n1)
        self.viewRes()

    def sin(self, n1):
        self.res = math.sin(n1)
        self.viewRes()

    def sqrt(self, n1):
        self.res = math.sqrt(n1)
        self.viewRes()

    def log(self, n1):
        self.res = math.log(n1)
        self.viewRes()
```

---

## Constructors in Inheritance

- Constructors are **not inherited**.
- The child class must explicitly call the parent's constructor using `super()`.

### Example 2: Default Constructor in Parent

```python
class Parent:
    def __init__(self):
        print('Parent is constructed')

class Child(Parent):
    def __init__(self):
        super().__init__()
        print('Child is constructed')
```

### Example 3: Parameterized Constructor in Parent

```python
class Parent:
    def __init__(self, x):
        self.x = x
        print('Parent is constructed with x =', x)

    def viewX(self):
        print('x =', self.x)

class Child(Parent):
    def __init__(self, n1):
        super().__init__(n1)
        print('Child is constructed with inherited value x =', self.x)
```

---

## Use Cases of Inheritance

- **Reusability**: Inherit methods and properties from parent.
- **Extensibility**: Add new methods and properties in child.
- **Customization**: Override existing methods to provide new behavior.

### Example 4: Payment Methods Extension

```python
class AmazonPayment:
    def debitCard(self):
        print('Payment using debit card')

    def creditCard(self):
        print('Payment using credit card')

    def netBanking(self):
        print('Payment with Netbanking')

class AmazonPayment2(AmazonPayment):
    def paytm(self):
        print('Payment with PAYTM')

    def UPI(self):
        print('Payment using UPI mode')

    def COD(self):
        print('Cash on Delivery')

    def amazonWallet(self):
        print('Payment by Amazon Wallet')
```

---

## Method Overriding

- When a child class redefines a method already present in the parent, it is called **Method Overriding**.
- It allows child class to implement parent methods with custom behavior.
- This demonstrates **Dynamic Polymorphism**.

### Example 5: Area of a Square

```python
class Shape:
    def __init__(self, d1):
        self.d1 = d1
        self.area = 0

    def findArea(self):
        print('No logic')

    def dispDim(self):
        print('D1 =', self.d1)

    def dispArea(self):
        print('Area =', self.area)

class Square(Shape):
    def __init__(self, d1):
        super().__init__(d1)

    def findArea(self):
        self.area = self.d1 ** 2
```

### Example 6: Area of a Rectangle with Overridden `dispDim()`

```python
class Shape:
    def __init__(self, d1):
        self.d1 = d1
        self.area = 0
        print('Shape is created')

    def dispDim(self):
        print('D1 =', self.d1)

    def dispArea(self):
        print('Area =', self.area)

class Rectangle(Shape):
    def __init__(self, d1, d2):
        super().__init__(d1)
        self.d2 = d2
        print('Rectangle is created')

    def dispDim(self):
        super().dispDim()
        print('D2 =', self.d2)

    def findArea(self):
        self.area = self.d1 * self.d2
```

---

## OOP’s PRINCIPLES - INHERITANCE (Detailed Python Notes)

**Object-Oriented Programming (OOP) Principles:**

1. Inheritance
2. Polymorphism
3. Encapsulation
4. Abstraction

---

## INHERITANCE

Inheritance is a powerful feature of object-oriented programming that allows one class (child/subclass) to inherit properties and methods from another class (parent/superclass). This promotes **code reusability**, **extensibility**, and **maintainability**.

---

### Example 7: Multilevel Inheritance with Cuboid

In this example, we demonstrate **multilevel inheritance**, where the class Shape is inherited by Rectangle, which is in turn inherited by Cuboid. The Cuboid class adds new behavior (volume) to the inherited functionality.

```python
class Shape:
    def __init__(self, d1):
        self.d1 = d1
        self.area = 0
        print('Shape is created')

    def dispDim(self):
        print('D1 =', self.d1)

    def dispArea(self):
        print("Area =", self.area)

class Rectangle(Shape):
    def __init__(self, d1, d2):
        super().__init__(d1)
        self.d2 = d2
        print('Rectangle is created')

    def dispDim(self):
        super().dispDim()
        print('D2 =', self.d2)

    def findArea(self):
        self.area = self.d1 * self.d2

class Cuboid(Rectangle):
    def __init__(self, d1, d2, d3):
        super().__init__(d1, d2)
        self.d3 = d3
        self.volume = 0
        print('Cube is created')

    def findArea(self):
        self.area = 2 * (self.d1*self.d2 + self.d2*self.d3 + self.d3*self.d1)

    def findVolume(self):
        self.volume = self.d1 * self.d2 * self.d3

    def dispVolume(self):
        print('Volume =', self.volume)

    def dispDim(self):
        super().dispDim()
        print('D3 =', self.d3)

c1 = Cuboid(5, 4, 3)
c1.dispDim()
c1.findArea()
c1.findVolume()
c1.dispArea()
c1.dispVolume()
```

**Output:**

```
Shape is created
Rectangle is created
Cube is created
D1 = 5
D2 = 4
D3 = 3
Area = 94
Volume = 60
```

---

## TYPES OF INHERITANCE

### 1) Single Inheritance

A child class inherits from a single parent class.

```python
class Editor:
    def open(self):
        self.text = ''

    def writeText(self, txt):
        self.text += txt
        print(self.text)

    def viewText(self):
        print(self.text)

class Paint(Editor):
    def drawLine(self):
        self.line = '------------------'
        print(self.line)

    def viewEditor(self):
        print(self.text)
        print(self.line)

p1 = Paint()
p1.open()
p1.writeText('hello welcome to techlearn')
p1.drawLine()
```

**Output:**

```
hello welcome to techlearn
------------------
```

### 2) Multiple Inheritance

A child class inherits from more than one parent class.

### 3) Multilevel Inheritance

A class inherits from a child class which itself is derived from another parent class.

### 4) Hierarchical Inheritance

More than one child class inherits from a single parent class.

```python
class Account:
    def __init__(self, acno, name, mobile, balance):
        self.acc_type = ' '
        self.acno = acno
        self.name = name
        self.mobile = mobile
        self.balance = balance

    def viewAccountDetails(self):
        print('Ac No: ', self.acno)
        print('Name: ', self.name)
        print('Mobile: ', self.mobile)
        print('Account Type: ', self.acc_type)
        print('***********************')

    def debit(self, amt):
        if amt <= self.balance:
            self.balance -= amt
            print('Collect your cash')
        else:
            print('Insufficient funds')

    def credit(self, amt):
        if amt < 100000:
            self.balance += amt
            print(amt, " deposited")
        else:
            print('Amount Limit exceeded')

    def checkBalance(self):
        print('Available balance: ', self.balance)

class SavingsAccount(Account):
    def __init__(self, acno, name, mobile, balance):
        super().__init__(acno, name, mobile, balance)
        self.acc_type = 'Savings Account'
        self.interest = 0.06

    def addQtrlyInterest(self):
        self.balance += self.balance * self.interest + self.balance
        print('Qtrly Interest Added')

class LoanAccount(Account):
    def __init__(self, acno, name, mobile, balance):
        super().__init__(acno, name, mobile, balance)
        self.acc_type = 'Loan Account'

    def applyLoan(self, loan_amt, no_of_instlmnts):
        self.loan_amt = loan_amt
        self.no_of_instlmnts = no_of_instlmnts

    def viewLoan(self):
        print('Loan amount: ', self.loan_amt)
        print('Number of Instalments: ', self.no_of_instlmnts)

sa = SavingsAccount(1234, 'Kumar', 9876, 12000)
sa.viewAccountDetails()

la = LoanAccount(1234, 'Pranay', 898989, 10000)
la.viewAccountDetails()

sa.checkBalance()
sa.credit(4500)
sa.checkBalance()

la.applyLoan(300000, 36)
la.viewLoan()
```

### 5) Hybrid Inheritance

This is a combination of multiple inheritance types, such as multilevel + hierarchical.

```python
class P:
    def __init__(self):
        self.a = 1
        print('P instance created')

class C1(P):
    def __init__(self):
        super().__init__()
        self.b = 2
        print('C1 instance created')

class C2(P):
    def __init__(self):
        super().__init__()
        self.c = 3
        print('C2 instance created')

class C3(C1, C2):
    def __init__(self):
        super().__init__()
        self.d = 4
        print('C3 instance created')

    def viewValues(self):
        print(self.a, self.b, self.c, self.d)

c = C3()
c.viewValues()
```

**Output:**

```
P instance created
C2 instance created
C1 instance created
C3 instance created
1 2 3 4
```

This shows **MRO (Method Resolution Order)** in Python's multiple inheritance mechanism, ensuring no duplication or ambiguity when calling constructors.
