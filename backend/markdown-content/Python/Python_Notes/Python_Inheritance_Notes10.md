# OOP’s Principles - Inheritance (Detailed Python Notes)

---

## Object-Oriented Programming (OOP) Principles

1. **Inheritance**
2. **Polymorphism**
3. **Encapsulation**
4. **Abstraction**

---

## Inheritance

Inheritance is a powerful feature of object-oriented programming that allows one class (child/subclass) to inherit properties and methods from another class (parent/superclass). This promotes **code reusability**, **extensibility**, and **maintainability**.

---

## Polymorphism

Polymorphism allows objects of different classes to be treated as objects of a common superclass. It enables the same interface to represent different underlying data types and behaviors.

### Types of Polymorphism

#### 1) Static Polymorphism

Static Polymorphism refers to behavior that is determined at **compile-time**. In Python, static polymorphism is achieved through **operator overloading**.

### Operator Overloading

Operator Overloading means redefining the way operators work for user-defined types (classes). Python provides a special method syntax (called dunder methods) to achieve this.

The same operator behaves differently based on the type of operands:

```python
# Example: '+' operator

# a) With integers - arithmetic addition
x = 5
y = 10
z = x + y
print(z)  # Output: 15

# b) With strings - string concatenation
s1 = 'tech'
s2 = 'learn'
s3 = s1 + s2
print(s3)  # Output: techlearn

# c) With lists - list concatenation
list1 = [1, 2, 3]
list2 = [4, 5]
combined = list1 + list2
print(combined)  # Output: [1, 2, 3, 4, 5]
```

Python allows overloading of various operator categories through special methods:

#### Comparison Operators

| **Operator** | **Method**            |
| :----------- | :-------------------- |
| `<`          | `__lt__(self, other)` |
| `>`          | `__gt__(self, other)` |
| `<=`         | `__le__(self, other)` |
| `>=`         | `__ge__(self, other)` |
| `==`         | `__eq__(self, other)` |
| `!=`         | `__ne__(self, other)` |

#### Assignment Operators

| **Operator** | **Method**                   |
| :----------- | :--------------------------- |
| `+=`         | `__iadd__(self, other)`      |
| `-=`         | `__isub__(self, other)`      |
| `*=`         | `__imul__(self, other)`      |
| `/=`         | `__idiv__(self, other)`      |
| `//=`        | `__ifloordiv__(self, other)` |
| `%=`         | `__imod__(self, other)`      |
| `**=`        | `__ipow__(self, other)`      |

#### Unary Operators

| **Operator** | **Method**         |
| :----------- | :----------------- |
| `-`          | `__neg__(self)`    |
| `+`          | `__pos__(self)`    |
| `~`          | `__invert__(self)` |

---

### Example 1: Overloading `+` Operator for a Custom Line Class

```python
class Line:
    def __init__(self, length):
        self.length = length

    def __str__(self):
        return str(self.length)

    def __add__(self, other):
        temp = Line(self.length + other.length)
        return temp

    def drawLine(self):
        for _ in range(self.length):
            print('-', end='')
        print()

x = Line(5)
y = Line(10)
z = x + y  # invokes __add__

print(x, y, z)  # Output: 5 10 15

x.drawLine()
y.drawLine()
z.drawLine()
```

**Output:**

```
5 10 15
-----
----------
---------------
```

---

### Example 2: Overloading `<` Operator for Rectangle Class

```python
class Rectangle:
    def __init__(self, d1, d2):
        self.d1 = d1
        self.d2 = d2
        self.area = 0

    def findArea(self):
        self.area = self.d1 * self.d2

    def __lt__(self, other):
        return self.area < other.area

r1 = Rectangle(5, 4)
r2 = Rectangle(4, 6)

r1.findArea()
r2.findArea()

print("r1 area:", r1.area)  # Output: 20
print("r2 area:", r2.area)  # Output: 24

print(r1 < r2)               # True
print(r2 < r1)               # False
```

**Output:**

```
r1 area: 20
r2 area: 24
True
False
```

This showcases how custom logic can be defined to change operator behavior based on object data, making code cleaner and intuitive.

---

#### 2) Dynamic Polymorphism

Dynamic Polymorphism is a form of polymorphism where method calls are resolved **at runtime**. This is commonly achieved in Python through **method overriding** in an inheritance hierarchy.

### Method Overriding

When a subclass provides a specific implementation of a method that is already defined in its superclass, this is called **method overriding**. The overriding method in the child class must have the same name, parameters, and signature.

This enables dynamic behavior: the method that gets called is determined by the type of the object at runtime.

**Example:**

```python
class Animal:
    def sound(self):
        print("Animal makes sound")

class Dog(Animal):
    def sound(self):
        print("Dog barks")

class Cat(Animal):
    def sound(self):
        print("Cat meows")

animals = [Dog(), Cat(), Animal()]

for a in animals:
    a.sound()  # method called is based on the object type at runtime
```

**Output:**

```
Dog barks
Cat meows
Animal makes sound
```

### Use Case

Dynamic polymorphism is useful in scenarios where different subclasses are expected to behave differently while sharing a common interface. For example, in GUI frameworks, each UI component like Button, Textbox, Dropdown might override a `render()` method, which behaves uniquely for each.

---

## Summary

- **Static Polymorphism** is achieved using **operator overloading**, resolved during compile-time.
- **Dynamic Polymorphism** is achieved through **method overriding**, resolved at runtime.
- Polymorphism enhances flexibility, code reuse, and scalability in object-oriented systems.
