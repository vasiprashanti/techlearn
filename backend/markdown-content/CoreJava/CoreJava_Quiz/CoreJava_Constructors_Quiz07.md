### Question: What is the primary purpose of a constructor in Java?

- A) To return a value from a method.
- B) To perform complex computations.
- C) To initialize a newly created object.
- D) To define static members of a class.
  **Answer:** C

### Question: How is a constructor invoked in Java?

- A) It is called explicitly by the programmer using its name.
- B) It is triggered automatically by the Java Virtual Machine (JVM) as soon as the new keyword is used to create an instance of a class.
- C) It is called only when an object's method is invoked.
- D) It is invoked by the main method only.
  **Answer:** B

### Question: Which of the following is a key characteristic of a constructor?

- A) It has a return type, usually void.
- B) It must have a different name than the class.
- C) It has the exact same name as the class it belongs to.
- D) It can be declared as static.
  **Answer:** C

### Question: What happens immediately after memory is allocated for a new object in Java?

- A) The object's methods are called.
- B) The constructor is automatically called.
- C) The main method starts execution.
- D) Garbage collection is performed.
  **Answer:** B

### Question: Which type of constructor is automatically provided by the Java compiler if no other constructor is explicitly defined in a class?

- A) Parameterized constructor
- B) Copy constructor
- C) Default constructor (Zero-Argument Constructor)
- D) Private constructor
  **Answer:** C

### Question: What is the primary use of the this keyword when parameter names in a constructor are the same as instance variable names?

- A) To declare a new local variable.
- B) To resolve naming conflicts between local and instance variables.
- C) To return a value from the constructor.
- D) To make the constructor static.
  **Answer:** B

### Question: Why can a constructor NOT be declared as static?

- A) Because constructors work with instance-level data and are called during object creation, whereas static members belong to the class, not to objects.
- B) Because static methods cannot access instance variables.
- C) Because constructors cannot return any value.
- D) Because static is a keyword for methods, not constructors.
  **Answer:** A

### Question: What is the significance of declaring a constructor as private?

- A) It allows the constructor to be inherited by subclasses.
- B) It prevents the object of that class from being created at all.
- C) It means the object of that class can only be created from within the same class, often used in Singleton Design Patterns or Factory Methods.
- D) It allows the constructor to be overloaded without restrictions.
  **Answer:** C

### Question: Consider a class Product with an instance variable pname. If a parameterized constructor Product(String pname) is defined, but this.pname = pname; is omitted and only pname = pname; is used, what would be the outcome regarding the pname instance variable?

- A) The pname instance variable would be correctly initialized with the passed pname value.
- B) The pname instance variable would remain with its default value (e.g., null for a String), as the assignment pname = pname; would refer to the local variable on both sides, causing the assignment to be ineffective.
- C) A compile-time error would occur due to ambiguity.
- D) The pname local variable would be assigned to itself, but the instance variable would receive a garbage value.
  **Answer:** B

### Question: In the context of the Font class example provided in the sources, what does the line Font f1 = new Font(); primarily illustrate regarding object creation and initialization?

- A) It shows explicit constructor calling and manual memory allocation by the programmer.
- B) It demonstrates that memory is allocated for the f1 object, the constructor is automatically invoked, and its instance variables are initialized (e.g., font_size = 10, font_face= "Aerial", font_style = "Regular").
- C) It proves that constructors can return the newly created Font object to the f1 reference.
- D) It suggests that f1 and f2 (created later using new Font()) share the same memory space and constructor invocation count.
  **Answer:** B
