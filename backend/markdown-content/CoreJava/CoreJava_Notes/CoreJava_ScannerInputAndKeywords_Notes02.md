**CORE JAVA NOTES – 02**

**Using the Scanner Class for Keyboard Input in Java**

Java provides a robust and structured way of handling input and output operations. Among various input mechanisms, the **Scanner class** stands out as a convenient utility for capturing user input from the keyboard.

To utilize the Scanner class, the first step is to import it into the program. This is done using the following statement:

```java
import java.util.Scanner;
```

Then, create a Scanner object:

```java
Scanner sc = new Scanner(System.in);
```

The Scanner class includes several methods tailored to read specific data types:

- `nextByte()`: Reads the next input as a byte.
- `nextShort()`: Reads the input as a short integer.
- `nextInt()`: Used to read an integer.
- `nextLong()`: Accepts input as a long integer.
- `nextFloat()`: Reads the input as a floating-point number.
- `nextDouble()`: Takes the input as a double-precision number.
- `nextBoolean()`: Interprets the input as a boolean value (true or false).

For string input, the Scanner class provides two main methods:

- `next()`: Reads a single word from the input. It terminates at whitespace.
- `nextLine()`: Reads an entire line of text until the new line character is encountered.

Here is a simple example demonstrating its usage:

```java
import java.util.Scanner;

public class InputExample {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter your name: ");
        String name = sc.nextLine();
        System.out.print("Enter your age: ");
        int age = sc.nextInt();
        System.out.print("Are you a student? (true/false): ");
        boolean isStudent = sc.nextBoolean();
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Student: " + isStudent);
    }
}
```

---

### Java Program to Calculate Area of a Rectangle

```java
import java.util.Scanner;

public class RectangleArea {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in); // Create Scanner object
        // Accepting length from user
        System.out.print("Enter the length of the rectangle: ");
        double length = sc.nextDouble();
        // Accepting breadth from user
        System.out.print("Enter the breadth of the rectangle: ");
        double breadth = sc.nextDouble();
        // Calculating area
        double area = length * breadth;
        // Displaying the result
        System.out.println("The area of the rectangle is: " + area);
    }
}
```

---

### Using the tokens() Method of the Scanner Class in Java

In Java, the Scanner class provides a powerful and flexible way to parse and extract input from various sources such as keyboard input, files, or strings. One particularly useful feature of the Scanner class is its ability to **split input based on custom delimiters** and process individual parts or **tokens**. The `tokens()` method of the Scanner class plays a central role in enabling such functionality.

Let us break down and explore the purpose and function of the `tokens()` method with the help of an example:

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        String names_list = "Rohith, Krishna, Pavani, Hari, Tanmaya, Sunil, Trisha";
        Scanner scan = new Scanner(names_list);
        scan.useDelimiter(",");
        scan.tokens();
        while (scan.hasNext()) {
            System.out.println(scan.next());
        }
        scan.close();
    }
}
```

---

## Java Keywords

Java keywords, also known as reserved words, are integral components of the Java programming language. These words have predefined meanings in the Java compiler, and therefore, cannot be used as identifiers such as variable names, class names, or object names. Each keyword serves a unique function and helps developers write syntactically correct and logically structured code.

1. **Abstract**: The `abstract` keyword is used to declare an abstract class, which cannot be instantiated directly. An abstract class can include both abstract methods (without implementation) and non-abstract methods (with implementation). It provides partial implementation of interfaces and serves as a base for other classes.
2. **Boolean**: The `boolean` keyword is used to declare a variable that can hold only two values: true or false. This keyword plays a fundamental role in conditional checks and logic operations.
3. **Break**: Used to terminate a loop or switch statement prematurely, the `break` keyword disrupts the normal flow of execution at specific conditions, allowing control to exit from the block in which it is contained.
4. **Byte**: The `byte` keyword is used to declare an 8-bit signed integer variable. It is primarily used when saving memory in large arrays where the memory savings matters.
5. **Case**: Within a switch statement, the `case` keyword is used to define various paths of execution based on the value of the expression being evaluated.
6. **Catch**: Paired with the try block, the `catch` keyword is used to handle exceptions. It allows the program to gracefully deal with runtime errors without crashing.
7. **Char**: The `char` keyword declares a variable that holds a single 16-bit Unicode character. It is used to store individual letters, symbols, or characters.
8. **Class**: The `class` keyword is used to declare a class in Java, which acts as a blueprint from which individual objects are created.
9. **Continue**: The `continue` keyword is used inside loops to skip the current iteration and move to the next cycle, bypassing any code below it in the loop body for that iteration.
10. **Default**: In switch statements, the `default` keyword marks the block of code that executes if no case matches the given value.
11. **Do**: The `do` keyword initiates a do-while loop. It ensures the loop body runs at least once before checking the condition.
12. **Double**: Used to declare variables that can store 64-bit floating-point numbers, the `double` keyword is ideal for precise calculations with decimal points.
13. **Else**: The `else` keyword defines the alternative path of execution when the condition in an if statement evaluates to false.
14. **Enum**: The `enum` keyword defines a fixed set of constants (enumeration). Constructors in an enum are implicitly private or have default access.
15. **Extends**: This keyword indicates inheritance. A class or interface uses `extends` to inherit properties and behaviors from a parent class or interface.
16. **Final**: The `final` keyword is used to declare constants. Once a variable is assigned a value using final, it cannot be changed. It also prevents method overriding and inheritance when used with methods or classes respectively.
17. **Finally**: Paired with a try-catch block, the `finally` keyword ensures that a block of code is always executed, whether an exception was thrown or caught.
18. **Float**: The `float` keyword declares a variable that stores a 32-bit floating-point number, suitable for saving memory in large arrays of decimal values.
19. **For**: The `for` keyword initializes a for loop, which executes a block of code a specific number of times. It is preferred when the number of iterations is known.
20. **If**: The `if` keyword checks a condition and executes the associated block if the condition evaluates to true.
21. **Implements**: This keyword is used by a class to implement an interface, ensuring that all the methods of the interface are defined in the class.
22. **Import**: The `import` keyword allows the use of other packages or classes in the current program file, making them accessible without full qualification.
23. **Instanceof**: The `instanceof` keyword tests whether an object is an instance of a particular class or implements a specific interface.
24. **Int**: The `int` keyword declares a variable that holds a 32-bit signed integer, which is the most used numeric data type.
25. **Interface**: The `interface` keyword is used to declare an interface, which can contain abstract methods that must be implemented by any class that uses it.
26. **Long**: The `long` keyword declares a variable that holds a 64-bit signed integer, suitable for large numerical values.
27. **Native**: Used to declare methods that are implemented in another language (usually C or C++) using the Java Native Interface (JNI), the `native` keyword marks the method as having native implementation.
28. **New**: The `new` keyword is used to create new objects or allocate memory dynamically during runtime.
29. **Null**: The `null` keyword represents a null reference, indicating that an object reference does not point to any memory location.
30. **Package**: This keyword is used to define a package, which is a namespace that organizes a set of related classes and interfaces.
31. **Private**: The `private` keyword is an access modifier indicating that the variable or method is accessible only within the class it is defined in.
32. **Protected**: A `protected` member is accessible within the same package and available to subclasses via inheritance, but not accessible to unrelated external classes.
33. **Public**: The `public` keyword is the most permissive access modifier, allowing unrestricted access to variables, methods, or classes from any other class or package.
34. **Return**: Used to return a value from a method and terminate its execution, the `return` keyword may return primitive types, objects, or nothing if the method is declared void.
35. **Short**: The `short` keyword declares a variable that can hold a 16-bit signed integer, useful for saving memory in large data structures.
36. **Static**: Used primarily for memory management, the `static` keyword indicates that a variable or method belongs to the class rather than to instances of the class.
37. **Strictfp**: The `strictfp` keyword ensures platform-independent floating-point computations, enforcing consistent results across different JVMs and hardware.
38. **Super**: The `super` keyword refers to the parent class and can be used to call the parent class’s methods or constructors.
39. **Switch**: The `switch` keyword allows conditional branching based on the value of a variable, comparing it with multiple case options.
40. **Synchronized**: The `synchronized` keyword is used in multithreading to ensure that only one thread at a time can access a method or block, thereby preventing race conditions.
41. **This**: The `this` keyword refers to the current object. It is used to resolve naming conflicts and to pass the current object as a parameter.
42. **Throw**: The `throw` keyword is used to explicitly throw an exception, either system-defined or user-defined, allowing for customized error handling.
43. **Throws**: This keyword is used in method declarations to specify exceptions that the method might throw, particularly checked exceptions.
44. **Transient**: The `transient` keyword is used in serialization. Fields marked as transient are not serialized, meaning their values are not saved during the object’s persistence.
45. **Try**: The `try` keyword starts a block of code that is tested for exceptions. It must be followed by either a catch or finally block.
46. **Void**: The `void` keyword specifies that a method does not return any value. It is used in method declarations.
47. **Volatile**: Used for variable declarations, the `volatile` keyword indicates that a variable may be modified asynchronously and prevents caching of its value by threads.
48. **While**: The `while` keyword initiates a loop that executes if the specified condition is true. It is best used when the number of iterations is not known in advance.
