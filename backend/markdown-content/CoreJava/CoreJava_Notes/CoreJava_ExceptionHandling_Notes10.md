**CORE JAVA NOTES - 10**

**EXCEPTION HANDLING**

### What is Exception Handling?

Exception Handling is a way to deal with **unexpected problems (errors)** that occur while a program runs — like trying to open a missing file, divide by zero, or access a null object.

### What is an Exception?

An **Exception** is a Java object that **represents an error** or **abnormal event** that disrupts the normal flow of a program.

- When something goes wrong, **Java throws** (creates and sends) an exception.
- The code that **deals with the error** is called the **exception handler**.

![Exception Handling in Java](/CoreJava_Images/Aspose.Words.29c8aaf6-78b7-40f1-9928-f63d3abc355b.001.png)

### Java Exception Class Hierarchy

All exception types in Java are subclasses of **Throwable**, which has two main branches:

#### 1. Checked Exceptions (Compile-Time Exceptions)

- **Handled at compile-time** — must be caught or declared.
- Represent predictable issues like file I/O or database access.
- **Examples**: `IOException`, `SQLException`, `InterruptedException`.

#### 2. Unchecked Exceptions (Runtime Exceptions)

- **Handled at runtime** — not checked by the compiler.
- Caused by programming mistakes like bad logic or null references.
- **Examples**: `ArithmeticException`, `NullPointerException`, `ArrayIndexOutOfBoundsException`.

#### 3. Errors

- Represent **serious problems** that **can’t be recovered from**.
- Not meant to be caught or handled in code.
- **Examples**: `StackOverflowError`, `OutOfMemoryError`.

### Examples of Exceptions

#### 1. Compile-Time Exception: InterruptedException

```java
public class CompileTimeExample {
    public static void main(String[] args) {
        try {
            System.out.println("Sleeping for 2 seconds...");
            Thread.sleep(2000); // May throw InterruptedException
            System.out.println("Awake!");
        } catch (InterruptedException e) {
            System.out.println("Thread was interrupted!");
        }
    }
}
```

#### 2. Runtime Exception: ClassCastException

```java
public class RuntimeExample {
    public static void main(String[] args) {
        Object obj = "Hello";
        Integer num = (Integer) obj;
    }
}
```

#### 3. Error: StackOverflowError

```java
public class ErrorExample {
    public static void main(String[] args) {
        recurse();
    }

    public static void recurse() {
        recurse(); // No stopping condition
    }
}
```

### Uncaught Exceptions in Java – Simplified

An **uncaught exception** is an exception that **is thrown but not handled** using a try-catch block or not declared with throws. This causes the program to **terminate abruptly** and may print a **stack trace**.

#### Example

```java
public class UncaughtExample {
    public static void main(String[] args) {
        int result = 10 / 0; // No try-catch block — exception is uncaught
        System.out.println("Result: " + result);
    }
}
```

**Real-Life Analogy:**

Imagine a train without brakes — if an obstacle (exception) comes and nothing stops it (no handler), it **crashes** (program terminates).

![Uncaught Exception in java](/CoreJava_Images/Aspose.Words.29c8aaf6-78b7-40f1-9928-f63d3abc355b.002.png)

### Java Exception Handling

Java handles exceptions using five main keywords:

#### 1. try

- Wraps code that might throw an exception.
- If an exception occurs, it **jumps to the catch block**, skipping the rest of try.

```java
try {
    // risky code
}
```

#### 2. catch

- **Catches and handles** exceptions thrown by the try block.
- Takes an Exception type parameter to match the thrown exception.

```java
catch (Exception e) {
    // handle exception
}
```

#### 3. throw

- Used to **explicitly throw** an exception object (either custom or predefined).

```java
throw new ArithmeticException("Divide by zero");
```

**Note:** throw keyword is mostly used with some user-defined exception or to throw an exception according to the programmer’s choice.

#### 4. throws

- Declares exceptions that a method might throw, allowing caller to handle them.

```java
public void readFile() throws IOException {
    // code
}
```

#### 5. finally

- Always executes after try (with or without catch).
- Used for **cleanup** tasks like closing files, DB connections, etc.

```java
finally {
    // cleanup code
}
```

![finally clause in exception handling in java](/CoreJava_Images/Aspose.Words.29c8aaf6-78b7-40f1-9928-f63d3abc355b.003.png)

#### Example using try and catch Handling Division by Zero

```java
public class TryCatchExample {
    public static void main(String[] args) {
        int a = 10;
        int b = 0;
        try {
            int result = a / b; // This line throws ArithmeticException
            System.out.println("Result: " + result); // Skipped if exception occurs
        } catch (ArithmeticException e) {
            System.out.println("Error: Cannot divide by zero!");
        }
        System.out.println("Program continues normally after the catch block.");
    }
}
```

#### Using finally to Close a Resource

```java
public class FinallyExample {
    public static void main(String[] args) {
        java.io.BufferedReader reader = null;
        try {
            reader = new java.io.BufferedReader(new java.io.FileReader("example.txt"));
            String line = reader.readLine();
            System.out.println("First line: " + line);
        } catch (java.io.IOException e) {
            System.out.println("File not found or error reading the file.");
        } finally {
            try {
                if (reader != null) {
                    reader.close(); // Always executes
                    System.out.println("File closed successfully.");
                }
            } catch (java.io.IOException e) {
                System.out.println("Error closing the file.");
            }
        }
        System.out.println("Program continues...");
    }
}
```

### Important Points on try and catch

1. A try block **cannot stand alone** — it must be followed by at least one catch or a finally block.
2. You can use **multiple catch blocks** to handle different exception types with custom messages.
3. When using multiple catch blocks, place **more specific (child) exceptions first**, and **general (parent) exceptions last** to avoid unreachable code.
4. **Nested try blocks** are allowed — useful when different parts of a block may throw different exceptions.
   - If the **inner try doesn’t catch** an exception, the **outer try-catch** is checked.

#### Example: Using throw to Manually Throw an Exception

```java
public class ThrowExample {
    public static void main(String[] args) {
        int age = 15;
        try {
            checkAge(age); // Call method that may throw an exception
        } catch (IllegalArgumentException e) {
            System.out.println("Caught Exception: " + e.getMessage());
        }
        System.out.println("Program continues...");
    }

    public static void checkAge(int age) {
        if (age < 18) {
            throw new IllegalArgumentException("Age must be 18 or above to vote.");
        } else {
            System.out.println("You're eligible to vote!");
        }
    }
}
```

### User-Defined Exception (Custom Exception) in Java

You can create your own exception by:

- Extending the Exception class (for **checked exceptions**)
- Extending the RuntimeException class (for **unchecked exceptions**)

You can:

- Define constructors (optional)
- Override toString() or getMessage() to show custom messages

#### Example: Custom Checked Exception

```java
class UnderAgeException extends Exception {
    public UnderAgeException(String message) {
        super(message);
    }

    @Override
    public String toString() {
        return "Custom Exception - " + getMessage();
    }
}

public class CustomExceptionDemo {
    public static void main(String[] args) {
        int age = 16;
        try {
            validateAge(age);
        } catch (UnderAgeException e) {
            System.out.println(e); // Calls overridden toString()
        }
    }

    static void validateAge(int age) throws UnderAgeException {
        if (age < 18) {
            throw new UnderAgeException("Age is below 18 – not eligible.");
        }
        System.out.println("Age is valid – access granted.");
    }
}
```

### throws Keyword

Any method capable of causing any Checked/ Compile-time exceptions, must list all the exceptions possible during its execution beside the function signature, so that anyone calling that method, gets a prior knowledge about which exceptions to handle at the time of compilation. A method can do so by using the **throws** keyword followed by all the Checked Exception class names(one or more).

#### Syntax:

```java
type method_name(parameter_list) throws exception_list {
    // definition of method
}
```

**NOTE:** It is necessary for all exceptions, except the exceptions of type **Error** and **RuntimeException**, or any of their subclass.

#### Example demonstrating throws Keyword

```java
class Ex7 {
    static void check() throws InterruptedException, ClassNotFoundException {
        System.out.println("Inside check function");
        Class.forName("ABC");
        System.out.println("execution delayed for 5 seconds");
        Thread.sleep(5000);
        System.out.println("check function ends successfully");
    }

    public static void main(String args[]) {
        try {
            check();
        } catch (InterruptedException | ClassNotFoundException e) {
            System.out.println("Caught: " + e);
        }
    }
}

// Uncomment the below ABC class to handle the ClassNotFoundException
/*
class ABC {
}
*/
```

### Try-with-Resources

#### Definition:

A **try-with-resources** statement is used for **automatic resource management** — it ensures that resources like files, streams, DB connections, etc., are **automatically closed** after use, without needing a finally block.

#### Key Points:

- Introduced in **JDK 7**
- Works with any object that implements **AutoCloseable** (like Closeable and BufferedReader)
- Resources are **closed automatically** when try block finishes (even on exception)

#### Syntax:

```java
try (ResourceType name = new ResourceType()) {
} catch (Exception e) {
    // handle exception
}
```

#### Example: Reading a File Using Try-with-Resources

```java
import java.io.*;

public class TryWithResourcesExample {
    public static void main(String[] args) {
        try (BufferedReader reader = new BufferedReader(new FileReader("sample.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
```

### Method Overriding & throws – Rules

1. If the **parent method declares exceptions using throws**, the **child method can:**
   - Declare the **same exceptions**, or
   - Declare **subclasses** of those exceptions, or
   - **Handle them internally** (no throws needed)
2. The **child method cannot declare new or broader exceptions** (i.e., exceptions not declared by the parent).
3. If the parent method declares checked exceptions, the child:
   - Must either **declare the same or narrower exceptions**
   - Or **handle them with try-catch** (and skip throws)

#### Example:

```java
class Parent {
    void show() throws IOException {
        System.out.println("Parent method");
    }
}

class Child extends Parent {
    @Override
    void show() { // No throws — handled internally or no exception
        System.out.println("Child method");
    }
}
```
