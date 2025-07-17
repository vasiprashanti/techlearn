### Question

Which of the following statements is true about a Concrete Class?

- A) It cannot be instantiated directly.
- B) It must contain at least one abstract method.
- C) It contains fully defined methods with complete method bodies.
- D) It cannot be used as a parent class via inheritance.
  **Answer:** C

### Question

What is a key characteristic of an Abstract Class regarding instantiation?

- A) It can be instantiated directly if all its methods are concrete.
- B) It cannot be instantiated directly.
- C) It can be instantiated directly if it has no abstract methods.
- D) It is instantiated using the new keyword followed by the abstract class name.
  **Answer:** B

### Question

In Java, how must an abstract class be declared?

- A) Using the class keyword only.
- B) Using the abstract keyword.
- C) Using the interface keyword.
- D) It doesn't require any special keyword.
  **Answer:** B

### Question

According to the provided notes, what type of methods are implicitly public and abstract in an interface (prior to Java 8's default/static methods)?

- A) Only concrete methods.
- B) All methods.
- C) Static methods.
- D) Private methods.
  **Answer:** B

### Question

What keyword is used by a class to use an interface?

- A) extends.
- B) uses.
- C) implements.
- D) inherits.
  **Answer:** C

### Question

If a subclass extends an abstract class but does not provide implementations for all of the abstract methods from its parent, what must be true about the subclass?

- A) It must declare all its own methods as abstract.
- B) It will automatically inherit concrete versions of the abstract methods.
- C) It too must be declared abstract.
- D) It will result in a compile-time error, as this is not allowed.
  **Answer:** C

### Question

Which of the following is true regarding variables within an interface (prior to Java 8's default/static methods)?

- A) They can be instance variables.
- B) They can be private static variables.
- C) They must be public static final constants and initialized at the time of declaration.
- D) They can be any type of variable, as long as they are static.
  **Answer:** C

### Question

Why might it be better to use an Abstract Class when a base class's method body is rarely used and mostly overridden by subclasses?

- A) To prevent the base class from being instantiated.
- B) To leave out the method body, enforcing subclasses to provide their own implementation.
- C) To make the base class final and prevent further inheritance.
- D) To allow multiple inheritance directly.
  **Answer:** B

### Question

Which statement accurately describes constructors in abstract classes?

- A) Abstract classes cannot have constructors.
- B) Abstract classes must have only private constructors.
- C) Abstract class constructors are called directly when the abstract class is instantiated.
- D) Abstract classes can have constructors, which are called via the subclass constructor.
  **Answer:** D

### Question

How does Java achieve the concept similar to multiple inheritance, which is not directly supported for classes?

- A) Through the use of static methods in abstract classes.
- B) By allowing a class to implement multiple interfaces.
- C) By allowing a class to extend multiple parent classes.
- D) By making all methods in a class private.
  **Answer:** B

### Question

What is a primary purpose of an abstract class in enforcing custom behavior for child classes?

- A) To allow direct object creation for common behaviors.
- B) To prevent any method from having a body in the base class.
- C) To provide common behavior (concrete methods) and enforce custom behavior (abstract methods) for all child classes.
- D) To restrict subclasses from overriding any methods.
  **Answer:** C

### Question

Why can an abstract class _not_ be declared final in Java?

- A) Because final classes cannot have abstract methods.
- B) Because final classes can’t be extended, which contradicts the purpose of an abstract class as a blueprint for subclasses.
- C) Because final classes can only contain static members.
- D) Because abstract classes are implicitly final.
  **Answer:** B

### Question

How do interfaces contribute to "loose coupling" in Java design?

- A) By enforcing an inheritance link between the interface and implementing class.
- B) By requiring all methods to be static.
- C) By defining a common protocol without requiring an inheritance link between the interface and implementing class.
- D) By allowing only private members.
  **Answer:** C

### Question

Consider the Figure abstract class and its subclasses Rectangle and Triangle from the example. If Rectangle were defined without implementing the area() method, what would be the consequence?

- A) The Rectangle class would automatically inherit a default area() implementation.
- B) The Rectangle class would need to be declared as an abstract class itself.
- C) A runtime error would occur when Rectangle is instantiated.
- D) The Figure class would automatically become a concrete class.
  **Answer:** B

### Question

Based on the scenarios provided in the notes, which problem would be most appropriately solved using an Interface rather than an Abstract Class, given the specific characteristics mentioned?

- A) A zoo simulation where different animals make different sounds but all animals eat in a common way.
- B) An organization with different types of employees (Manager, Developer, Intern) where all have calculateSalary() logic, but it differs based on the role, and some share default behavior like checkIn().
- C) A shopping website supporting multiple payment methods (Credit Card, UPI), where each payment type has different steps to process.
- D) A smart home system where different appliances (like Fans, Lights) can be turned on or off, but how they operate differs.
  **Answer:** C
  **Answer:** C
