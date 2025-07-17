### Question: What is the primary purpose of the Scanner class in Java?

- A) To perform complex mathematical calculations.
- B) To handle input and output operations, specifically capturing user input from the keyboard.
- C) To manage network connections.
- D) To display graphical user interfaces.
  **Answer:** B

### Question: In which package is the Scanner class located?

- A) java.io
- B) java.lang
- C) java.util
- D) java.net
  **Answer:** C

### Question: Which of the following is the correct way to create a Scanner object for reading keyboard input?

- A) Scanner sc = new Scanner("keyboard");
- B) Scanner sc = new Scanner(System.out);
- C) Scanner sc = new Scanner(System.in);
- D) Scanner sc = Scanner.createKeyboardInput();
  **Answer:** C

### Question: Which method of the Scanner class is used to read an integer from the input?

- A) readInt()
- B) getInt()
- C) nextInt()
- D) integerInput()
  **Answer:** C

### Question: To read a single word from the input, terminating at whitespace (space, tab, or newline), which Scanner method should be used?

- A) nextLine()
- B) nextWord()
- C) readWord()
- D) next()
  **Answer:** D

### Question: Which keyword is used to declare a class in Java, acting as a blueprint from which individual objects are created?

- A) object
- B) blueprint
- C) class
- D) structure
  **Answer:** C

### Question: Which keyword declares a variable that can hold only two values: true or false?

- A) integer
- B) string
- C) Boolean
- D) char
  **Answer:** C

### Question: To prematurely terminate a loop or switch statement, which keyword disrupts the normal flow of execution?

- A) exit
- B) break
- C) stop
- D) end
  **Answer:** B

### Question: Which keyword checks a condition and executes the associated block if the condition evaluates to true?

- A) loop
- B) if
- C) while
- D) check
  **Answer:** B

### Question: Inside a loop, which keyword is used to skip the current iteration and move to the next cycle, bypassing any code below it in the loop body?

- A) skip
- B) pass
- C) continue
- D) next
  **Answer:** C

### Question: What is the main difference between next() and nextLine() methods of the Scanner class for string input?

- A) next() reads numbers, while nextLine() reads strings.
- B) next() reads a single word, while nextLine() reads an entire line of text until a newline character.
- C) next() reads an entire line, while nextLine() reads a single word.
- D) next() is used for file input, while nextLine() is for keyboard input.
  **Answer:** B

### Question: When using the tokens() method of the Scanner class, what is its primary role related to input processing?

- A) To calculate the sum of numbers in the input.
- B) To identify and process individual parts or tokens based on custom delimiters.
- C) To convert the entire input into a single string.
- D) To determine the length of the input.
  **Answer:** B

### Question: In exception handling, what is the purpose of the catch keyword when paired with a try block?

- A) To initiate a block of code that might throw an exception.
- B) To define a block of code that is always executed, regardless of exceptions.
- C) To handle exceptions and allow the program to gracefully deal with runtime errors without crashing.
- D) To explicitly throw a new exception.
  **Answer:** C

### Question: What are the key uses of the final keyword in Java?

- A) To declare variables that can be changed later.
- B) To declare constants; it also prevents method overriding and inheritance when used with methods or classes respectively.
- C) To define an abstract class that cannot be instantiated.
- D) To ensure platform-independent floating-point computations.
  **Answer:** B

### Question: Which statement accurately describes an abstract class in Java?

- A) It can be instantiated directly.
- B) It can only include abstract methods without implementation.
- C) It provides partial implementation of interfaces and serves as a base for other classes, but cannot be instantiated directly.
- D) It is used to declare constants.
  **Answer:** C

### Question: How do extends and implements keywords typically relate to class and interface relationships in Java?

- A) extends is used by a class to implement an interface, and implements for inheritance between classes.
- B) extends indicates inheritance, where a class or interface inherits properties and behaviors from a parent class or interface, while implements is used by a class to fulfill an interface contract.
- C) Both extends and implements are used exclusively for interface definition.
- D) extends allows multiple inheritance, while implements does not.
  **Answer:** B

### Question: What is the characteristic of a public access modifier in Java?

- A) It makes a member accessible only within the same class.
- B) It makes a member accessible within the same package and to subclasses.
- C) It is the most permissive access modifier, allowing unrestricted access to variables, methods, or classes from any other class or package.
- D) It indicates that a variable is static.
  **Answer:** C

### Question: What is the characteristic of a private access modifier in Java?

- A) It allows unrestricted access to variables, methods, or classes from any other class or package.
- B) It indicates that the variable or method is accessible only within the class it is defined in.
- C) It makes a member accessible within the same package and to subclasses.
- D) It indicates that a variable is not serialized.
  **Answer:** B

### Question: What is the characteristic of a protected access modifier in Java?

- A) It allows unrestricted access to variables, methods, or classes from any other class or package.
- B) It makes a member accessible only within the class it is defined in.
- C) It makes a member accessible within the same package and available to subclasses via inheritance, but not accessible to unrelated external classes.
- D) It indicates that a variable is volatile.
  **Answer:** C

### Question: What is the new keyword primarily used for in Java?

- A) To declare new primitive variables.
- B) To define a new method.
- C) To create new objects or allocate memory dynamically during runtime.
- D) To import new packages.
  **Answer:** C

### Question: Although the tokens() method of Scanner can return a Stream of tokens, what traditional method is used in the provided example for processing input with custom delimiters?

- A) A for-each loop with ArrayList.
- B) A do-while loop with peek() method.
- C) A while loop combined with hasNext() and next() methods.
- D) Directly printing the result of scan.tokens().
  **Answer:** C

### Question: What is the purpose of the volatile keyword in Java, particularly concerning variable declarations?

- A) To ensure that a method is implemented in another language.
- B) To indicate that a variable may be modified asynchronously and prevents caching of its value by threads.
- C) To specify that a method does not return any value.
- D) To define a fixed set of constants.
  **Answer:** B

### Question: When used in serialization, what does the transient keyword indicate for a field?

- A) That the field must always be serialized.
- B) That the field's value will be saved automatically during object persistence.
- C) That the field is not serialized, meaning its value is not saved during the object’s persistence.
- D) That the field is static and belongs to the class.
  **Answer:** C

### Question: What is the role of the native keyword in Java method declarations?

- A) It declares a method that can only be called from within its own class.
- B) It marks the method as having native implementation, meaning it is implemented in another language (usually C or C++) using the Java Native Interface (JNI).
- C) It indicates that a method is a constructor for the class.
- D) It ensures the method operates only on primitive data types.
  **Answer:** B

### Question: In the context of multithreading, what does the synchronized keyword primarily achieve?

- A) It allows multiple threads to access a method or block simultaneously.
- B) It ensures that only one thread at a time can access a method or block, thereby preventing race conditions.
- C) It makes a method run faster by optimising its execution.
- D) It ensures that a method is executed only once.
  **Answer:** B

### Question: What is the primary function of the strictfp keyword?

- A) To enforce strict type checking for all variables.
- B) To ensure platform-independent floating-point computations, enforcing consistent results across different JVMs and hardware.
- C) To declare a final floating-point constant.
- D) To prevent floating-point numbers from being modified.
  **Answer:** B

### Question: When is the block of code associated with the finally keyword executed in a try-catch-finally structure?

- A) Only if an exception is thrown.
- B) Only if no exception is thrown.
- C) Only if an exception is caught.
- D) Always executed, whether an exception was thrown or caught.
  **Answer:** D

### Question: Which keyword is used to explicitly throw an exception, either system-defined or user-defined, allowing for customised error handling?

- A) catch
- B) throws
- C) throw
- D) finally
  **Answer:** C

### Question: What does the throws keyword in a method declaration signify?

- A) That the method will always throw an exception.
- B) That the method is capable of handling any exception that occurs within it.
- C) It specifies exceptions that the method might throw, particularly checked exceptions.
- D) It is used to rethrow an exception after catching it.
  **Answer:** C

### Question: The static keyword indicates that a variable or method belongs to whom, primarily for memory management?

- A) To an instance of the class.
- B) To the class itself, rather than to instances of the class.
- C) To the main method only.
- D) To a specific object created during runtime.
  **Answer:** B
