### Question: Which of the following correctly lists the five major storage areas organised by the Java Virtual Machine (JVM) for memory management?

- A) Stack, Heap, Register, Cache, Buffer
- B) Method Area, Heap Area, Stack Area, Native Method Stack, Program Counter (PC) Register Area
- C) Program Stack, Data Heap, Code Cache, Metadata Store, Native Register
- D) Class Area, Object Area, Local Area, Global Area, Thread Area
  **Answer:** B

### Question: In which JVM memory area are local variables stored?

- A) Heap Area
- B) Method Area
- C) Stack Area
- D) Program Counter (PC) Register Area
  **Answer:** C

### Question: What is the primary purpose of the Heap Area in the JVM?

- A) To store metadata about classes and methods
- B) To store objects and instance (non-static) variables
- C) To store method call information and return addresses
- D) To store the address of the current instruction being executed by a thread
  **Answer:** B

### Question: Which of the following is not typically stored in the Method Area?

- A) Class-level data, such as the class name and parent class name
- B) Static variables (class variables)
- C) Instance fields of objects
- D) Constant pool information and compiled code of methods
  **Answer:** C

### Question: What is the key difference in lifetime between instance variables and class (static) variables?

- A) Instance variables exist as long as the method runs, while class variables exist as long as the object exists.
- B) Instance variables exist as long as the object exists, while class variables exist from the time the class is loaded until the JVM shuts down.
- C) Instance variables are destroyed once a method returns, while class variables are destroyed when the object is garbage collected.
- D) Instance variables are created when the class is loaded, while class variables are created when an object is instantiated.
  **Answer:** B

### Question: Which JVM memory area is prone to a StackOverflowError if a thread’s call stack grows beyond its allocated limit?

- A) Method Area
- B) Heap Area
- C) Stack Area
- D) Native Method Stack
  **Answer:** C

### Question: Why can't this or super keywords be used inside a static method in Java?

- A) Because static methods are loaded after objects are instantiated, so this and super would refer to undefined objects.
- B) Because this refers to the current object and super refers to the parent object, and static methods are not tied to any object.
- C) Because static methods operate on class-level data only, and this/super would attempt to access instance-level data.
- D) Because static methods are stored in the Method Area, while this/super relate to objects stored in the Heap Area, causing a memory conflict.
  **Answer:** B

### Question: In newer JVM versions (Java 8+), where is the Method Area primarily located and how does it relate to PermGen?

- A) It is part of the Heap Area, replacing PermGen entirely.
- B) It is part of Metaspace, which resides in native memory, whereas in older versions it was part of PermGen.
- C) It is stored in the Program Counter (PC) Register, with PermGen being deprecated.
- D) It is an entirely new memory area called Metaspace, separate from both PermGen and the Heap.
  **Answer:** B

### Question: Which type of variable in Java is not automatically initialized by default values and requires explicit assignment before use?

- A) Instance variables
- B) Class variables (Static variables)
- C) Local variables
- D) Both Instance and Class variables
  **Answer:** C
