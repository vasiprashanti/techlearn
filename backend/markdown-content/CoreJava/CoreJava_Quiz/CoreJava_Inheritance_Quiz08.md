### Question: What is the primary purpose of inheritance in Object-Oriented Programming (OOP) according to the sources?

- A) To restrict access to class members
- B) To allow a new class to acquire properties and behaviors of an existing class, promoting code reusability
- C) To define multiple methods with the same name in a single class
- D) To convert an object from one type to another
  **Answer:** B

### Question: Which keyword is used in Java to implement inheritance, signifying that one class acquires properties and behaviors from another?

- A) implements
- B) inherits
- C) extends
- D) inheritsFrom
  **Answer:** C

### Question: In the context of inheritance, what kind of relationship does it help to model?

- A) HAS-A relationship
- B) IS-A relationship
- C) PART-OF relationship
- D) USES-A relationship
  **Answer:** B

### Question: What happens to non-private members of a parent class when a child class extends it?

- A) They are ignored by the child class
- B) They are inherited by the child class
- C) They become private in the child class
- D) They are automatically overridden by the child class
  **Answer:** B

### Question: Which of the following is a key rule for method overriding in Java?

- A) The method name must be different in the child class
- B) The return type must be different in the child class
- C) The access modifier in the child class can be the same or more accessible than in the parent class
- D) The overridden method can throw broader or new checked exceptions
  **Answer:** C

### Question: What is the primary purpose of method overriding, as described in the sources?

- A) To hide the parent's method completely
- B) To prevent the child class from using the parent's method
- C) To allow a subclass to provide its own specific implementation of a method defined in its superclass
- D) To create a new method that is entirely unrelated to the parent's method
  **Answer:** C

### Question: What is the purpose of the @Override annotation, even though it's optional?

- A) It makes the method run faster
- B) It ensures the method is indeed overriding something and helps catch errors at compile time
- C) It changes the method's access level to public
- D) It automatically calls the parent's version of the method
  **Answer:** B

### Question: When can the super keyword be used?

- A) Only inside static methods
- B) Only to access private members of the parent class
- C) Inside a child class's constructors and non-static methods
- D) To declare a new parent class
  **Answer:** C

### Question: Why is super() required to be the first statement in a child class constructor, if explicitly called?

- A) To ensure proper memory allocation for the child object before the parent is initialized
- B) To ensure that the parent’s constructor is called first, initialising parent's instance variables and methods before the child's constructor executes
- C) To prevent method overloading issues
- D) It's a syntactic rule without a specific functional reason
  **Answer:** B

### Question: Which types of methods cannot be overridden in Java, and why?

- A) public methods, because they are globally accessible
- B) static, final, or private methods; static methods result in hiding, private methods are not inherited, and final methods are locked
- C) Methods with a void return type, as they don't return a value
- D) Methods that throw checked exceptions, to avoid runtime errors
  **Answer:** B

### Question: If a parent class has only a parameterized constructor, and a child class's constructor does not explicitly call super(parameters), what will be the outcome during compilation?

- A) The code will compile successfully, and Java will automatically call the default parent constructor
- B) A compile-time error will occur because the parent's parameterized constructor must be explicitly invoked
- C) A runtime error will occur when creating an object of the child class
- D) The child class will inherit the parent's parameterized constructor automatically
  **Answer:** B

### Question: During object creation of a child class, Java internally creates two reference variables: this and super. What specific purpose does the super reference serve?

- A) It refers to the current object (child)
- B) It refers to the parent's part of the object, providing access to parent’s properties, methods, and constructors
- C) It's used for creating static instances of the parent class
- D) It's used to define new methods in the parent class from the child class
  **Answer:** B
