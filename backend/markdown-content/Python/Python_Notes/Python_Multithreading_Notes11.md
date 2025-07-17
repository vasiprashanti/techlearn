## OOP’s Principles – Multithreading (Python Notes)

### Multitasking

**Multitasking** refers to the ability of the CPU to execute multiple tasks or processes simultaneously. There are two types of multitasking:

#### 1. Process-Based Multitasking

- A **process** is an independently executing program.
- When multiple applications (processes) run simultaneously (like a web browser and a text editor), this is called process-based multitasking.

#### 2. Thread-Based Multitasking (Multithreading)

- A **thread** is the smallest unit of execution within a process.
- **Multithreading** allows multiple threads to execute within the same process, enabling parallel task execution within a program.

---

### Ways to Achieve Multithreading in Python

#### 1. Using `_thread` Module

The `_thread` module provides a simple mechanism to run functions concurrently using threads.

**Steps:**

1. Import `_thread` and `time` modules.
2. Define the functions you want to run in parallel.
3. Use `_thread.start_new_thread()` to launch each function with arguments.

```python
import _thread
import time

def numThr(n1, n2):
    for i in range(n1, n2):
        print(i, end=' ')
        time.sleep(1)

def alphaThr(n1, n2):
    for i in range(n1, n2):
        print(chr(i), end=' ')
        time.sleep(1)

_thread.start_new_thread(numThr, (65, 91))
_thread.start_new_thread(alphaThr, (65, 91))
```

---

#### 2. Using `threading` Module

This is the preferred way to work with threads in Python. It provides a `Thread` class with extensive thread management features.

**Thread Life Cycle:**

- **Born**: Thread object created.
- **Runnable**: Thread is started using `.start()`.
- **Running**: Thread begins execution via the `.run()` method.
- **Blocked**: Temporarily paused (e.g., due to I/O or sleep).
- **Dead**: Thread completes execution.

---

#### Creating Thread by Inheriting from `Thread` Class

```python
import threading
import time

class NumThr(threading.Thread):
    def __init__(self):
        super().__init__()

    def run(self):
        print('Thread started running')
        for i in range(5):
            print(i, end=' ')
            time.sleep(1)
        print('Thread stopped running')

t1 = NumThr()
t2 = NumThr()

t1.start()
t2.start()
```

**Output (sample):**

```
Thread started running
0 Thread started running
0 1 1 2 2 3 3 4 4 Thread stopped running
```

---

#### Creating Thread by Passing Function and Arguments

```python
import threading
import time

def numThr(n1, n2):
    for i in range(n1, n2):
        print(i, end=' ')
        time.sleep(1)

t1 = threading.Thread(target=numThr, args=(1, 10))

t1.start()
```

---

### Sharing Resources Between Threads

We can share a common instance (like a book) between multiple threads (students).

```python
import threading
import time

class Book:
    def __init__(self):
        self.content = 'This is python programming book'

    def read(self):
        for word in self.content.split():
            print(word)
            time.sleep(1)

class Student(threading.Thread):
    def __init__(self, name, book):
        super().__init__()
        self.name = name
        self.book = book

    def run(self):
        print(self.name + ' started reading the book')
        self.book.read()
        print(self.name + ' finished reading the book')

b = Book()
s1 = Student("Bharath", b)
s2 = Student("Raman", b)

s1.start()
s2.start()
```

**Output (sample, asynchronous):**

```
Bharath started reading the book
This Raman started reading the book
This is is python python programming programming book book
Raman finished reading the book
Bharath finished reading the book
```

---

### Synchronizing Threads Using Locks

When shared resources must be accessed one at a time, **Locks** ensure only one thread accesses the resource at a time.

```python
import threading
import time

lock = threading.Lock()

class Book:
    def __init__(self):
        self.content = 'This is python programming book'

    def read(self):
        print('Started reading the book')
        lock.acquire()
        print('Lock acquired before reading the book')
        for word in self.content.split():
            print(word, end='  ')
            time.sleep(1)
        print('\nLock released after reading the book')
        lock.release()

class Student(threading.Thread):
    def __init__(self, name, book):
        super().__init__()
        self.name = name
        self.book = book

    def run(self):
        print(self.name + ' started running')
        self.book.read()
        print(self.name + ' stopped running')

b = Book()
s1 = Student("Bharath", b)
s2 = Student("Raman", b)

s1.start()
s2.start()
```

**Output (synchronized):**

```
Bharath started running
Started reading the book
Lock acquired before reading the book
This  is  python  programming  book
Lock released after reading the book
Bharath stopped running
Raman started running
Started reading the book
Lock acquired before reading the book
This  is  python  programming  book
Lock released after reading the book
Raman stopped running
```

---

### Summary

- **Multithreading** allows concurrent execution of code segments.
- Python provides both `_thread` and `threading` modules.
- `threading.Thread` offers extensive tools for managing threads.
- Shared resources can be managed safely using synchronization primitives like `Lock`.
