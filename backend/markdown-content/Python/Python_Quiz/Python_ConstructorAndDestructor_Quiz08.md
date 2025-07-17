### Question

What is the purpose of a constructor in Python?

- A) To delete objects
- B) To create class methods
- C) To initialize instance variables during object creation
- D) To compile Python code
  **Answer:** C

### Question

Which method is used to define a constructor in Python?

- A) **construct**()
- B) **start**()
- C) **init**()
- D) init()
  **Answer:** C

### Question

What happens when you define a class without a constructor in Python?

- A) You cannot create objects
- B) Python uses a default constructor
- C) The class cannot be executed
- D) The program will raise an error
  **Answer:** B

### Question

What is the role of self in a constructor?

- A) It refers to the class itself
- B) It stores static data
- C) It refers to the instance being created
- D) It is optional and can be skipped
  **Answer:** C

### Question

Which of the following statements is true about a parameterized constructor?

- A) It accepts no arguments
- B) It must be manually called
- C) It allows setting values during object creation
- D) It cannot contain instance variables
  **Answer:** C

### Question

What will the destructor method **del**() typically be used for?

- A) Creating new objects
- B) Allocating memory
- C) Cleaning up or releasing resources
- D) Overloading operators
  **Answer:** C

### Question

Which line in the code below will automatically call the destructor for p1?
p1 = Player("Mani")
del p1

- A) p1 = Player("Mani")
- B) viewName()
- C) del p1
- D) print(p1)
  **Answer:** C

### Question

Which of these is not true about destructors in Python?

- A) They can accept arguments
- B) They are called automatically when an object is deleted
- C) They are defined using **del**
- D) They are used for resource cleanup
  **Answer:** A

f1 = Font()

### Question

What is the output of the following code?
class Font:
def **init**(self):
self.size = 10
f1 = Font()
print(f1.size)

- A) 0
- B) Error
- C) 10
- D) None
  **Answer:** C

### Question

In the ATMCard example, what ensures every card has a unique card number?

- A) Random library
- B) Instance variable
- C) Class variable card_no_series
- D) User input
  **Answer:** C
