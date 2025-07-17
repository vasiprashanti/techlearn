**CORE JAVA NOTES - 06**

**STORAGE TYPES**

### Understanding JVM Memory Areas

The Java Virtual Machine (JVM) is the engine behind the execution of Java programs. One of its most vital roles is **memory management**, where it allocates, uses, and reclaims memory across different runtime components. To ensure effective program execution and memory optimization, the JVM organizes its memory into **five major storage areas**. Each area serves a unique purpose based on the type of data it handles. These are:

Java uses **5 main memory areas** to load program/class data depending on the variable’s type:

1. **Method Area (Context Area)**
   - Stores: **Static (Class) variables**, method metadata, constants
   - Shared across all threads
2. **Heap Area**
   - Stores: **Instance (Non-static) variables** and objects
   - Shared among all threads
3. **Stack Area**
   - Stores: **Local variables**, method calls, intermediate computations
   - Each thread has its **own stack**
4. **Native Method Stack**
   - Used for methods written in **native languages** (C/C++) via JNI
   - Platform-specific
5. **Program Counter (PC) Register**
   - Keeps track of the **current instruction** being executed in a thread
   - Each thread has its **own PC register**

### Storage Types Visualization

![StorageTypesVisualization](/CoreJava_Images/StorageTypesVisualization.6.1.png)

### Variable Types in Java

#### 1. Local Variables

- Declared inside methods, constructors, or blocks
- Created when the method is invoked
- Destroyed when the method ends

#### 2. Instance Variables

- Declared inside the class but **outside methods**
- Each object has its own copy
- Initialized when the object is created

#### 3. Class Variables

- Declared with static keyword inside a class, **outside methods**
- Shared across all objects of the class

### Class Members

- **Static members**: Belong to the class (shared)
- **Non-static members**: Belong to object instances

### Methods can contain

- **Local variables**: Temporary, limited to the method/block scope

---

## Understanding Local, Instance, and Class Variables in Java

In Java, variables are the fundamental building blocks that store data. Depending on **where and how they are declared**, variables fall into **three primary categories**:

1. **Local Variables**
2. **Instance Variables**
3. **Class Variables (Static Variables)**

Each of these plays a specific role in memory management and program behavior. Let’s understand each in detail.

### 1. Local Variables

1. Variables which are declared inside the method block are called as Local variables.
2. Their visibility/scope is only within the same method.
3. Their lifetime is, from the time the method begins its execution, till the time its execution is over.
4. They can’t be referred outside the method definition.
5. They must be initialized within the same block at least before using it, otherwise a compile time error will be thrown i.e. they must be initialized at the time of declaration or before use.
6. If you don’t want to assign any values, then you must place them as the function parameters in the methods parenthesis, which gets initialized automatically at run time by call by value.
7. We can’t declare the local variables with static/public/private/protected modifiers.
8. We can declare a local variable as a final variable within the block it must be initialized at the declaration time otherwise must be declared in the function parameters list.

**Example on Local variable:**

```java
public class LocalExample {
    public void greet(String name) {
        final String message = "Hello, " + name + "!";
        System.out.println(message);
    }
    public static void main(String[] args) {
        LocalExample obj = new LocalExample();
        obj.greet("Aanya");
    }
}
```

---

### 2. Instance Variables

#### 1. Instance Variables

Instance variables are declared **inside a class but outside any method**, and they are loaded into the **Heap Area** of the JVM when an object is created using the new keyword. These variables are object-specific, meaning each object maintains its own copy. Unlike static variables, instance variables are **re-initialized with each object creation**. Once the object is no longer in use or accessible, these variables are removed from memory by the **Garbage Collector**, a background daemon thread that helps manage memory automatically.

#### 2. Access and Scope

The scope of instance variables is within the same class—accessible from **non-static methods and constructors**, but **not from static methods or blocks directly**. To access instance members from a static context (like main), you must create an object and access them using `objectName.memberName`.

#### 3. Relationship with Methods

Instance methods can access **both instance and static members**, since they operate on a specific object that already exists. These methods often use the `this` keyword to refer to the current object, or `super` to refer to parent class members—both of which are valid only in non-static contexts.

#### 4. Initialization & Usage

Instance variables can be:

- **Early-initialized**: at the point of declaration.
- **Lazily-initialized**: inside the constructor.

  They can also be marked as final, in which case they must be initialized **exactly once**.

If you don’t explicitly initialize an instance variable, the JVM assigns it a **default value** (e.g., 0 for int, null for objects).

#### 5. Best Practices

- Commonly declared private or protected for **data security**, with access provided via **getters and setters**.
- Should be used to represent **state or properties of an object**, such as name, age, balance, etc.
- **Non-static blocks** can be used to initialize them, but this is rare and not preferred. Initialization logic is typically placed inside constructors.

#### 6. Summary

Instance members are tied to object creation. They:

- Reside in heap memory.
- Exist as long as the object exists.
- Are accessed through object references.
- Can interact with both static and non-static parts of the program.
- Provide dynamic, per-object data management in Java programs.

**Example:**

```java
public class Student {
    String name;
    int rollNumber;
    public Student(String name, int rollNumber) {
        this.name = name;
        this.rollNumber = rollNumber;
    }
    public void displayDetails() {
        System.out.println("Name: " + name);
        System.out.println("Roll Number: " + rollNumber);
    }
    public static void main(String[] args) {
        Student s1 = new Student("Aarav", 101);
        Student s2 = new Student("Mira", 102);
        s1.displayDetails();
        System.out.println("-----------");
        s2.displayDetails();
    }
}
```

---

### 3. Class Variables (Static Variables)

1. **Defined with the static keyword** and loaded into the **Method Area (Context Area)** when the class is loaded by the JVM.
2. **Memory Allocation:** Occurs only once during the program’s lifetime—at class loading.
3. **Execution Order:**
   - Static block (if any) executes first.
   - Then static variables are initialized.
   - Then the main() method starts.
4. **Access Scope:**
   - Can be accessed anywhere in the same class (static or non-static methods).
   - Outside the class, use: `ClassName.memberName`.
5. **Association:**
   - **With the class**, not with object instances.
   - That’s why main() is declared static—it can run without object creation.
6. **Limitations in Static Context:**
   - Cannot use `this` or `super` (these are instance-specific).
   - Static methods **can only directly access other static members**, not instance members.
7. **Static Blocks:**
   - Used for **static initialization logic**. They execute once at class loading.
8. **Static Classes:**
   - Only **inner classes** can be declared static. Top-level classes **cannot** be static.
9. **Keyword Placement:**
   - `static` can appear **before or after** access modifiers (public, private, etc.).
10. **Constants:**
    - Usually declared as `public static final`.
    - Named in **UPPERCASE** (e.g., PI, MAX_LIMIT).
    - Values don’t change once initialized.
11. **Visibility:**
    - Static variables are **visible in all methods** of the class.
12. **Restrictions:**
    - Cannot declare static variables inside a method body (they’re not local).

**Example:**

```java
public class School {
    static int totalStudents = 0;
    static {
        System.out.println("Class Loaded! Static block executed.");
    }
    static void showSchoolInfo() {
        System.out.println("Total Students: " + totalStudents);
    }
    public static void main(String[] args) {
        School.totalStudents = 120;
        School.showSchoolInfo();
    }
}
```
