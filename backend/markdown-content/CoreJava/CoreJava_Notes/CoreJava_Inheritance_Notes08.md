**CORE JAVA NOTES - 08**

**OOPS - INHERITANCE**

### Definition

Inheritance is an object-oriented concept where a **child class** (subclass) inherits fields and methods from a **parent class** (superclass), promoting **code reuse** and **modularity**.

### Syntax

```java
class Vehicle {
    void drive() {
        System.out.println("Driving...");
    }
}

class Car extends Vehicle {
    void honk() {
        System.out.println("Honking...");
    }
}
```

Java uses the `extends` keyword for inheritance.

### Why Use Inheritance?

1. **Code Reusability** – Avoids duplication by allowing child classes to reuse methods and fields of the parent.
2. **Enhancement via Overriding** – Child classes can provide specialized behavior by overriding inherited methods.
3. **Maintainability** – If logic is updated in the parent class, all child classes benefit from the change automatically.
4. **IS-A Relationship** – Helps in modeling real-world hierarchies (e.g., a Dog **is-a** Animal).

### Example: Basic Shape Hierarchy

```java
class Shape {
    void display() {
        System.out.println("This is a shape.");
    }
}

class Circle extends Shape {
    void draw() {
        System.out.println("Drawing a circle.");
    }
}

class Rectangle extends Shape {
    void draw() {
        System.out.println("Drawing a rectangle.");
    }
}

public class Main {
    public static void main(String[] args) {
        Circle c = new Circle();
        c.display();
        c.draw();

        Rectangle r = new Rectangle();
        r.display();
        r.draw();
    }
}
```

### Real-Life Use Case in Code

#### Scenario: Company Employee Management System

```java
class Employee {
    String name;
    int id;

    void login() {
        System.out.println(name + " logged in.");
    }
}

class Manager extends Employee {
    void approveLeave() {
        System.out.println(name + " approved leave.");
    }
}

class Developer extends Employee {
    void writeCode() {
        System.out.println(name + " is writing code.");
    }
}

public class Company {
    public static void main(String[] args) {
        Manager m = new Manager();
        m.name = "Alice";
        m.login();
        m.approveLeave(); // Manager-specific

        Developer d = new Developer();
        d.name = "Bob";
        d.login();
        d.writeCode();
    }
}
```

### Method Overriding in Java

#### Definition

**Method Overriding** is the process by which a **child class redefines a method** that it inherits from a **parent class**. The overridden method in the child class must have the **same name, return type, and parameters** as the method in the parent class.

#### Purpose of Method Overriding

- **Custom Behavior**: To provide a more specific or appropriate version of a method for the subclass.
- **Runtime Polymorphism**: Enables the program to decide at runtime which method to invoke (parent’s or child’s).
- **Enhancement**: To enhance or modify the logic of an inherited method.
- **Readability**: Keeps the hierarchy clean and readable while reusing the interface and changing implementation.

#### Rules of Method Overriding

1. **Same method signature**:
   - Method name must be identical.
   - Parameter types, order, and count must be the same.
   - Return type must be the same (or covariant in case of objects).
2. **Access modifier**:
   - Can be same or **more accessible** (wider visibility).
   - Example: from protected to public is allowed.
3. **Not static, final, or private**:
   - These cannot be overridden.
   - Static methods result in **method hiding**, not overriding.
4. **Exceptions**:
   - If the parent method throws checked exceptions, the child can throw the same or **narrower** exceptions.
   - Cannot throw broader or new checked exceptions.
5. **@Override annotation** (optional but recommended):
   - Helps catch errors at compile time.
   - Ensures the method is indeed overriding something.

#### Example: Method Overriding

```java
class Employee {
    void manual() {
        System.out.println("General instruction manual for all employees.");
    }
}

class Manager extends Employee {
    @Override
    void manual() {
        System.out.println("General instruction manual with added leadership responsibilities for managers.");
    }
}

public class Company {
    public static void main(String[] args) {
        Employee emp = new Employee();
        emp.manual();

        Manager mgr = new Manager();
        mgr.manual();

        Employee ref = new Manager();
        ref.manual();
    }
}
```

### Role of `super` in Constructor Chaining

#### Rules for `super`

1. `super()` Must Be the First Statement in Child Constructor.
2. `super` Can Only Be Used in Child Class Constructors and Non-Static Methods.
3. `super` Can Be Used to Access Parent Class Members.

#### Example: Calling Parent Method Using `super`

```java
class BankNotification {
    void sendNotification() {
        System.out.println("Dear customer, your bank account has been updated.");
    }
}

class SMSNotification extends BankNotification {
    @Override
    void sendNotification() {
        super.sendNotification(); // Call parent method
        System.out.println("SMS Sent: Check your latest transaction in the mobile app.");
    }
}

public class Main {
    public static void main(String[] args) {
        SMSNotification sms = new SMSNotification();
        sms.sendNotification();
    }
}
```

### Practical Questions

#### Basic Understanding & Conceptual Questions

1. In Java inheritance, why is the `super()` constructor call required to be the first statement in a child class constructor? What could go wrong if it isn’t?
2. How does the `super` keyword help in differentiating between the parent and child class methods or variables when they have the same name?
3. What would happen if the parent class has only a parameterized constructor, and you forget to use `super(parameters)` in the child class? Will the code compile?
4. Can the `super` keyword be used inside a static context? If not, why is it restricted to instance-level contexts?
5. Explain how Java internally creates references like `this` and `super` in a child object during runtime. What purpose do these references serve?

#### Application-Based & Real-Life Scenario Questions

6. Imagine you’re designing an Employee Management System where all employees inherit from a base Employee class. How would you use `super` in constructors when a Manager class has additional fields like `teamSize`?
7. In a real-world GUI application, suppose there’s a base class `Component` with a method `draw()`, and subclasses like `Button` and `TextField` override it. When and why might you call `super.draw()` from within the overridden method?
8. In a banking application, both `SavingsAccount` and `CurrentAccount` extend `Account`. How can `super` help you in reusing validation logic in methods like `deposit()` or `withdraw()`?
9. Consider a situation where a subclass method must do extra work **in addition to** what the parent class already does. How does `super` make this extension easier and cleaner?
10. You’re working on a game where `Character` is a superclass, and `Warrior` is a subclass. How could `super` help in reusing base health initialization logic in the child constructor?

#### Edge Case & Behavior Questions

11. If both parent and child classes have a method named `display()` and a variable named `name`, how do you use `super` to access the parent’s `name` and `display()` inside the child?
12. What would happen if you accidentally override a method in the child class but forget to call `super.methodName()` even though it is essential for core logic defined in the parent?
13. If a method is marked as `final` in the parent class, can you still use `super` to call it in the child class? Justify your answer.
14. If a child class constructor doesn’t explicitly call `super()`, and the parent has no default constructor, what will be the outcome during compilation?
15. How does using `super` impact the readability and maintainability of a codebase that heavily relies on inheritance?
