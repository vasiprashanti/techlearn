### Question

What is the definition of a Java Exception?

- A) A syntax error found by the compiler.
- B) A problem that occurs during the execution of a program.
- C) A compile-time warning that can be ignored.
- D) A keyword used to define a new class.
  **Answer:** B

### Question

Which of the following is an example of a Checked Exception?

- A) ArithmeticException.
- B) NullPointerException.
- C) InterruptedException.
- D) ArrayIndexOutOfBoundsException.
  **Answer:** C

### Question

What is the primary purpose of the finally block in Java exception handling?

- A) It executes only if an exception is caught.
- B) It executes only if no exception occurs in the try block.
- C) It ensures that cleanup statements or resource closing always execute, regardless of whether an exception occurred or was handled.
- D) It is used to declare new exceptions.
  **Answer:** C

### Question

What happens when an exception is "uncaught" in a Java program?

- A) The program continues execution normally from the next line.
- B) The exception is automatically converted into a compile-time warning.
- C) It leads to unexpected program termination, and the default handler prints the exception details on the terminal.
- D) The exception is silently ignored by the Java Virtual Machine (JVM).
  **Answer:** C

### Question

When using multiple catch blocks with a try statement, what is the correct order for defining them?

- A) Wider ones (Parent Exceptions) first, then Narrow ones (Child Exceptions).
- B) Narrow ones (Child Exceptions) first, then Wider ones (Parent Exceptions).
- C) The order does not matter as long as all exceptions are covered.
- D) Alphabetical order of the exception class names.
  **Answer:** B

### Question

What is the primary function of the throw keyword in Java?

- A) To declare which exceptions a method might throw.
- B) To explicitly create and throw an exception object.
- C) To handle an exception that has been caught.
- D) To indicate that a block of code expects an exception.
  **Answer:** B

### Question

In nested try statements, if an inner try block does not have a catch handler for a particular exception that occurs, what happens next?

- A) The program immediately terminates.
- B) The exception is ignored, and execution continues.
- C) The outer try block is checked for a matching catch handler.
- D) The finally block of the inner try handles the exception.
  **Answer:** C

### Question

What is the main advantage of using the try-with-resources statement (introduced in JDK 7)?

- A) It eliminates the need for any catch blocks in the program.
- B) It automatically ensures that any resource declared within its parentheses, which implements AutoCloseable or Closeable, is closed at the end of the statement.
- C) It allows throwing checked exceptions without needing to declare them with throws.
- D) It converts all runtime exceptions into checked exceptions.
  **Answer:** B

### Question

Consider a Parent class with a method: void fun() throws InterruptedException. If a Child class extends Parent, which of the following fun() method signatures is _not_ allowed when overriding the method, according to the rules for throws clause with method overriding?

- A) void fun().
- B) void fun() throws InterruptedException.
- C) void fun() throws ClassNotFoundException.
- D) void fun() throws InterruptedException, ClassNotFoundException.
  **Answer:** C

### Question

To create a user-defined exception subclass in Java, which of the following classes must it extend?

- A) java.lang.Object.
- B) java.lang.Throwable.
- C) java.lang.Error.
- D) java.lang.Exception or java.lang.RuntimeException.
  **Answer:** D
