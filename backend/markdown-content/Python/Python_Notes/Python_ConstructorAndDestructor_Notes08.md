# Python Notes - 08: Constructors and Destructors

---

## 1. Constructor

### Definition

A **constructor** is a special method in Python classes. It is invoked automatically when an object of the class is instantiated. Its primary purpose is to initialize instance variables (also known as object-level attributes) with either default or user-provided values.

In Python, constructors are defined using the special method name:

```python
def __init__(self):
```

The constructor is a part of object instantiation. When a class is called to create an object, Python internally allocates memory for the new object and then calls the `__init__()` method to initialize the object’s attributes.

---

### Key Characteristics of Constructors

1. **Automatic Invocation**: The constructor is automatically called as soon as an object is created.
2. **Only One Call per Object**: It is invoked only once for each object, during its lifetime.
3. **Cannot Be Manually Invoked**: Programmers cannot directly invoke the constructor like other methods. It is managed by Python's object creation flow.
4. **Can Accept Parameters**: The constructor can be defined to accept user-defined parameters for setting up instance-specific values during object creation.
5. **Mandatory Use of `self`**: The first parameter of the constructor must always be `self`, which refers to the instance being created.

---

### Types of Constructors in Python

Python supports two types of constructors:

#### 1. Default Constructor

A default constructor is one that takes only the `self` parameter and no additional arguments. It is used to initialize attributes with predefined default values.

**Use Case:**

Used when all objects of the class are to be initialized with the same set of values initially, which can be changed later using setter/mutator methods.

---

**Example: Font Configuration**

```python
class Font:
    def __init__(self):
        self.size = 10 # Default font size
        self.face = 'Aerial' # Default font face
        self.style = 'Regular' # Default font style

    def viewFont(self):
        print('Font size:', self.size)
        print('Font face:', self.face)
        print('Font style:', self.style)

    def format(self, size=10, face='Aerial', style='Regular'):
        self.size = size
        self.face = face
        self.style = style
        print('Font Changed')

# Object creation using default constructor
f1 = Font()

# View default font settings
f1.viewFont()

# Modify some font attributes
f1.format(size=14, face='Verdana')

# View updated settings
f1.viewFont()
```

**Explanation:**

- When `f1 = Font()` is executed, Python internally:
  - Allocates memory for the object `f1`
  - Calls `__init__(self)` and sets default values
- The `format()` method allows these default settings to be changed later.

---

#### 2. Parameterized Constructor

A parameterized constructor is defined to accept one or more arguments in addition to `self`. This allows object attributes to be initialized with custom values during object creation.

**Use Case:**

Used when every object of the class should be initialized with values provided at runtime.

---

**Example: ATM Card Issuance System**

```python
import random

class ATMCard:
    bank = 'ICICI' # Class variable (same for all instances)
    card_no_series = 1234567812345678 # Static series used to assign unique card numbers

    def __init__(self, card_type, date_from, date_to):
        self.card_no = ATMCard.card_no_series # Assign current series value
        ATMCard.card_no_series += 1 # Increment for next card
        self.card_type = card_type
        self.date_from = date_from
        self.date_to = date_to
        r = random.Random()
        self.pin = r.randrange(1000, 9999) # Random 4-digit PIN
        self.cvv = r.randrange(123, 987) # Random CVV

    def viewCard(self):
        print('Bank:', ATMCard.bank)
        print('Card No:', self.card_no)
        print('Card Type:', self.card_type)
        print('Valid From:', self.date_from, 'till', self.date_to)
        print('CVV:', self.cvv)

# Creating objects with user-specified values
card1 = ATMCard('VISA', '10-05-2024', '10-05-2034')
card1.viewCard()

card2 = ATMCard('MASTERCARD', '02-06-2024', '02-06-2034')
card2.viewCard()
```

**Explanation:**

- Each object is initialized with distinct card type and validity dates.
- The card number is auto-incremented by accessing and modifying a class-level variable (`card_no_series`).
- A random PIN and CVV are generated for each card instance.

---

## 2. Destructor

### Definition

A **destructor** is a special method in Python that is automatically called **when an object is about to be destroyed**. It is primarily used to perform cleanup tasks such as releasing memory, closing files, or resetting object values.

In Python, destructors are defined using the special method:

```python
def __del__(self):
```

---

### Key Characteristics of Destructors

1. **Automatic Invocation**: Destructors are called automatically when:
   - An object goes out of scope.
   - An object is explicitly deleted using the `del` keyword.
   - The Python program ends and memory is deallocated.
2. **Cannot Accept Arguments**: The destructor method can **only take `self`** as a parameter. Additional arguments are not allowed.
3. **Called Only Once per Object**: Like constructors, destructors are invoked just once for each object when it's about to be destroyed.
4. **Used for Cleanup Operations**: Typical use cases include:
   - Resetting instance attributes
   - Closing network or file connections
   - Logging object termination

---

**Example: Player Object Cleanup**

```python
class Player:
    def __init__(self, name):
        self.name = name
        print(self.name, "Player instance created")

    def __del__(self):
        print(self.name, "Player instance destructed")
        self.name = None # Reset the instance variable

    def viewName(self):
        print('Name:', self.name)

# Start of program
print('Program started...')

# Object creation
p1 = Player("Mani")
p2 = Player("Rohith")

# Access object methods
p1.viewName()
p2.viewName()

# Explicitly delete p1
del p1

# Continue with program
print('Program still running...')
print('Program ends')
```

**Explanation:**

- The constructor `__init__` prints a message when each object is created.
- The method `viewName()` allows reading object data.
- The destructor `__del__` prints a message and clears the data when the object is destroyed.

**Output:**

```
Program started...
Mani Player instance created
Rohith Player instance created
Name: Mani
Name: Rohith
Mani Player instance destructed
Program still running...
Program ends
Rohith Player instance destructed
```

When `del p1` is executed, the destructor is immediately invoked for the `p1` object.
When the program ends, Python automatically calls the destructor for `p2`.

---

### Default Constructor and Destructor Behavior in Python

If the programmer does **not explicitly define** a constructor or destructor in the class, Python provides a **default constructor** and **default destructor** that perform no custom logic but still allow object creation and destruction to occur correctly.

---

## Summary Table

| **Feature**               | **Constructor**                      | **Destructor**                      |
| :------------------------ | :----------------------------------- | :---------------------------------- |
| Method Name               | `__init__(self, ...)`                | `__del__(self)`                     |
| Purpose                   | Initialize instance variables        | Clean up before object is destroyed |
| Automatic Invocation      | Yes (on object creation)             | Yes (on object deletion)            |
| Takes Parameters          | Yes (`self` + optional user-defined) | No (only `self` is allowed)         |
| Custom Definition         | Optional                             | Optional                            |
| Default Provided          | Yes, if not explicitly defined       | Yes, if not explicitly defined      |
| Call Frequency            | Once per object                      | Once per object                     |
| Cannot Be Called Manually | True                                 | True                                |

---
