CORE JAVA NOTES -07

Constructors

In Java, a **constructor** is a special method automatically invoked when an object is created using the new keyword. Its primary purpose is to **initialize instance variables** and set the object to a valid state.

### Key Features:

- Has the **same name** as the class.
- **No return type**, not even void.
- Called **automatically** by the JVM.
- Used to assign **default or custom values** to an object.

### Types of Constructors:

1. **Default Constructor**: Takes no arguments, initializes with default values.
1. **Parameterized Constructor**: Takes arguments for customized initialization.
1. **Constructor Overloading**: Multiple constructors with different parameters for flexible object creation.

**Phase 1: Memory Allocation**

When you write:

![A black and white background with purple letters

AI-generated content may be incorrect.](/CoreJava_Images/Aspose.Words.a7c2e997-95ce-4551-a647-2e0841eec8ee.001.png)

Java performs:

- **Step 1:** Allocate memory for the Font object. This includes space for its **instance variables**:
  - int font_size → 4 bytes
  - String font_face → reference (usually 4 or 8 bytes)
  - String font_style → reference

This block of memory becomes the **object in heap memory**, and a reference (f1) is created in the **stack memory** pointing to it.

**Phase 2: Constructor Invocation (Instantiation)**

After the object memory is created, **Java automatically calls the constructor**:

![A black background with text

AI-generated content may be incorrect.](/CoreJava_Images/Aspose.Words.a7c2e997-95ce-4551-a647-2e0841eec8ee.002.png)

So, this constructor:

- Initializes the **instance variables** of the object just created.
- Prints a message to confirm construction.

At this point:

- f1.font_size = 10
- f1.font_face = "Aerial"
- f1.font_style = "Regular"

**2. The Font Class: Complete Breakdown**

- Here’s the provided class for reference:

![](/CoreJava_Images/Aspose.Words.a7c2e997-95ce-4551-a647-2e0841eec8ee.003.png)

**Step-by-Step Execution**

` `**Line:**

**Font f1 = new Font();**

- Memory allocated for object f1.
- Constructor is invoked.
- Outputs: "Font is constructed"
- font_size = 10, font_face = "Aerial", font_style = "Regular"

` `**Line:**

**f1.viewFont();**

- Outputs: 10   Aerial   Regular

**Line:**

**Font f2 = new Font();**

- New memory allocated for f2.
- Constructor is invoked again (new object).
- Outputs: "Font is constructed"

**Line:**

**f2.viewFont();**

- Outputs: 10   Aerial   Regular

**Key Concepts Illustrated by This Code**

| **Concept**          | **Explanation**                                                                                         |
| :------------------- | :------------------------------------------------------------------------------------------------------ |
| **Constructor**      | The method Font() is automatically called to initialize the object.                                     |
| **Object Creation**  | Each new Font() creates a **separate object in memory**.                                                |
| **Initialization**   | All instance variables are initialized via constructor.                                                 |
| **Reusability**      | The same constructor is used for both f1 and f2.                                                        |
| **Automatic Call**   | You never call the constructor explicitly—it runs **immediately after object creation**.                |
| **Multiple Objects** | You can create many objects, and each will be initialized using the same constructor unless overloaded. |

**Key Characteristics of Constructors**

A constructor differs from regular methods in several important ways:

1. **Same Name as Class:** A constructor must have the **exact same name** as the class it belongs to. This unique trait distinguishes it from normal methods.
1. **No Return Type:** Unlike methods, a constructor **does not have a return type**, not even void. Its sole purpose is object initialization, not returning values.
1. **Called Once per Object:** A constructor is invoked **only once** per object—at the time of object creation. Once an object is initialized, the constructor is not used again for that object.
1. **Automatic Invocation:** When an object is created using the new keyword, the constructor is **automatically called**. Programmers do not need to invoke it explicitly.
1. **Cannot Be Static:** Since constructors work with instance-level data and are called during object creation, they **cannot be static**. Static members belong to the class, not to objects.
1. **Cannot Be Final:** Constructors **cannot be declared as final** because they are not inherited or overridden. The concept of preventing overriding does not apply to them.
1. **Can Be Private:** A constructor can be declared **private**, which means the object of that class can only be created **from within the same class**. This is often used in **Singleton Design Patterns** or **Factory Methods**. Also, a class with a private constructor **cannot be inherited**, since its members are inaccessible outside the class.

**Types of Constructors in Java**

Java provides two main types of constructors to handle different scenarios of object creation:

**1. Default Constructor (Zero-Argument Constructor)**

A **default constructor** is a constructor that **takes no parameters**. If the programmer does not explicitly define any constructor in a class, the Java compiler **automatically provides a default constructor**. Its purpose is to assign default values to the instance variables.

**Features of Default Constructor:**

- Automatically provided if no other constructor is defined.
- Allows object creation without passing arguments.
- Initializes variables with default values (e.g., 0 for int, null for objects).

Every object created using the default constructor will have the **same initial values**.

_Note: Java does not allow garbage values; default values are automatically assigned._

**2. Parameterized Constructor**

A **parameterized constructor** is defined **explicitly by the programmer** and takes one or more parameters. It is used when each object needs to be initialized with **different values**.

**Features of Parameterized Constructor:**

- Must be explicitly written by the programmer.
- Used for **custom initialization**.
- Allows objects to hold **unique data**.

**3. Constructor Overloading**

Constructor overloading is a concept where a class can have **more than one constructor**, each with a **different parameter list**. This provides flexibility, allowing objects to be created in multiple ways based on available data.class Student {

String first_name, middle_name, last_name;

Student (String first_name, String middle_name, String last_name) {

this.first_name = first_name;

this.middle_name = middle_name;

this. last_name = last_name;｝

Student (String first_name, String last_name) {

this. first_name = first_name;

this. last_name = last_name;}}

**Understanding the this Keyword in Java**

**Definition**:

this is a special reference variable in Java that refers to the **current object** — the one on which a method or constructor is being invoked. It helps distinguish between **instance variables** and **local variables**, especially when they have the same name.

**How this Works Internally**:

1. **Memory Allocation**: When an object is created with new, memory is allocated in the **heap** for its instance variables.
1. **Creation of this**: The JVM creates an implicit reference (this) inside the object to store its **memory address**.
1. **Purpose**: this is used to access the **current object’s members** (fields, methods, constructors) from within the class.

**Key Characteristics of this Keyword**

| **#** | **Characteristic**                                                                              |
| :---- | :---------------------------------------------------------------------------------------------- |
| 1     | It is a **reference variable** available inside every non-static method and constructor.        |
| 2     | It **refers to the current object** (i.e., the object that invoked the method or constructor).  |
| 3     | It is **automatically initialized** with the object’s memory address when an object is created. |
| 4     | It is used mainly to **resolve naming conflicts** between local and instance variables.         |
| 5     | It can only be used inside **instance methods or constructors** (not in static methods).        |
| 6     | It is valid **only within the same class** where it’s used.                                     |
| 7     | If printed, this returns: ClassName@HexadecimalHashCode.                                        |

**Memory Visualization**

| **Variable**                    | **Points To**            |
| :------------------------------ | :----------------------- |
| p1                              | Product Object 1 in Heap |
| this inside constructor/methods | Same Product Object      |

**Key Uses of this in Java**

| **Use Case**             | **Description**                         |
| :----------------------- | :-------------------------------------- |
| this.variable = variable | Resolves name clash                     |
| this()                   | Calls another constructor in same class |
| return this              | Returns current object                  |
| System.out.println(this) | Prints reference to current object      |

### **Q. Using Constructors in Real-Life Scenarios**

### 1\. Smartwatch Tracker App

**Problem:** Create a class Smartwatch with properties: brand, steps, and heartRate.

Use a **parameterized constructor** to initialize each watch with specific details.

Create objects for Fitbit and Apple Watch and display their details.

### 2\. Food Delivery App – Order System

**Problem:** Design a class Order with properties: orderId, restaurantName, totalAmount, and deliveryTime.

Use a **constructor** to initialize an order.

Display the order details using a method.

` `Real-world use: Constructors are used when loading a new order into memory from a database or UI form input.

### 3\. Library Management System

**Problem:**

Create a class Book with attributes: bookId, title, author, availability.

Use both a **default** and a **parameterized constructor**.

Show how default books can be created with placeholders, and real books with full info.

### 4\. Online Course Registration Portal

**Problem:**

Create a Student class with properties: name, email, and enrolledCourse.

Add a parameterized constructor that uses the this keyword to initialize instance variables.

Demonstrate student registration with two objects.

### 5\. Budget Expense Tracker App

**Problem:**

Create a class Expense with name, amount, category.

Create multiple constructors: one to only enter name, and another to enter all three fields using **constructor overloading**.

### Q. Using this Keyword in Practical Scenarios

### 6\. Online Shopping Cart – Product Class

**Problem:** Create a Product class with id, name, price.

Add a constructor and a setPrice() method that uses this.price = price to update prices.

Display product info and verify updated price.

### 7\. Ride Booking App (Uber/Ola)

**Problem:** Create a class Ride with details like pickup, drop, fare.

Use a parameterized constructor and a method to **update the fare** using this.

Print ride details and show how changes are reflected.

### 8\. ATM Banking System

**Problem:** Define a class BankAccount with accountNumber, holderName, balance.

Use a constructor to initialize values and a method deposit() to add money using this.balance += amount.

### 9\. Hotel Booking App

**Problem:** Create a Room class with roomNumber, type, isBooked.

Add a constructor to initialize the room, and a bookRoom() method using this to change booking status.

### 10\. Fitness App – User Profile

**Problem:** Create a UserProfile class with username, age, and goal.

Use this in a setter method to update goals dynamically.

Print user progress report showing updated goals.

### 11\. Constructor Overloading in Movie Ticket System

**Problem:**Create a class MovieTicket with overloaded constructors:

- One with only movieName
- Another with movieName, seatNo, price

Use both ways to book tickets and show how overloading offers flexibility in booking.

### 12. Private Constructor in Singleton Logger

**Problem:** Create a `Logger` class with a **private constructor** and a static method `getInstance()`.

Ensure only one object of `Logger` is created and used in multiple parts of an application.

```java
public class Logger {
    private static Logger instance;

    private Logger() {
        // Private constructor
    }

    public static Logger getInstance() {
        if (instance == null) {
            instance = new Logger();
        }
        return instance;
    }

    public void log(String message) {
        System.out.println("Log: " + message);
    }
}

class Main {
    public static void main(String[] args) {
        Logger logger = Logger.getInstance();
        logger.log("Application started");
    }
}
```

---

### 13. IoT Smart Home Devices

**Problem:** Create a `SmartDevice` class for controlling devices like lights, AC, etc.

Use this to update device state (ON/OFF) and show output through `printStatus()` method.

```java
public class SmartDevice {
    private String deviceName;
    private boolean isOn;

    public SmartDevice(String deviceName) {
        this.deviceName = deviceName;
        this.isOn = false; // Default state is OFF
    }

    public void turnOn() {
        this.isOn = true;
    }

    public void turnOff() {
        this.isOn = false;
    }

    public void printStatus() {
        System.out.println(deviceName + " is " + (isOn ? "ON" : "OFF"));
    }

    public static void main(String[] args) {
        SmartDevice light = new SmartDevice("Light");
        light.turnOn();
        light.printStatus();

        SmartDevice ac = new SmartDevice("AC");
        ac.turnOff();
        ac.printStatus();
    }
}
```

---
