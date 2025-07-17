**CORE JAVA NOTES - 11**

**MULTITHREADING**

### Definition

Multithreading is a feature of Java that allows the concurrent execution of two or more parts of a program for maximum utilization of CPU. Each part of such a program is called a **thread**, which is a **lightweight sub-process**. All threads within a process share the same memory space but execute independently.

**Key Concept:**

A multithreaded program contains two or more threads that can run **simultaneously**. For example, while one thread is **writing content to a file**, another thread can **perform spell checking**—both operations happening concurrently.

### Threads in Java

- A **thread** in Java is represented by an instance of the Thread class.
- Like any other object in Java, a thread object is created and managed using standard class mechanisms.
- However, the **thread of execution** (the actual unit of work) is distinct—it has its **own call stack**.
- When multiple threads run concurrently, each thread maintains **its own execution context** (call stack), although they may share objects and resources.

![thread call stack](/CoreJava_Images/Aspose.Words.ca7bdb30-9d3a-4662-b6b3-a71cea3fd0ef.001.png)

### The Main Thread in Java

Even if no threads are explicitly created, every Java program starts with a **main thread** by default. It is the first thread that begins execution.

**Key Points:**

- The main thread is automatically created when the program starts.
- You can access it using: `Thread.currentThread()`.
- It serves as the **parent thread**—other threads are typically spawned from it.
- The **main thread should be the last to finish** to ensure all child threads complete their execution.

```java
public class MainThreadExample {
    public static void main(String[] args) {
        Thread mainThread = Thread.currentThread();
        System.out.println("Current Thread: " + mainThread.getName());
        System.out.println("Priority: " + mainThread.getPriority());
        System.out.println("Thread Group: " + mainThread.getThreadGroup().getName());
    }
}
```

### Life cycle of a Thread

![thread life cycle](/CoreJava_Images/Aspose.Words.ca7bdb30-9d3a-4662-b6b3-a71cea3fd0ef.002.png)

1. **New/Born:** A thread begins its life cycle in the new state. It remains in this state until the `start()` method is called on it.
2. **Runnable:** After invocation of `start()` method on new thread, the thread becomes runnable.
3. **Running:** A method is in running thread if the thread scheduler has selected it.
4. **Waiting:** A thread is waiting for another thread to perform a task. In this stage the thread is still alive.
5. **Dead/Terminated:** A thread enters the terminated state when it completes its task.

### Thread Priorities

Every thread has a priority that helps the operating system determine the order in which threads are scheduled for execution. In Java, thread priority ranges between:

- **MIN_PRIORITY (1)**
- **MAX_PRIORITY (10)**

By default every thread is given a **NORM_PRIORITY (5)**. The **main** thread always has **NORMAL_PRIORITY**.

### Thread Class in Java

The Thread class is the core of Java’s multithreading system. It is used to create and manage threads. You can create a thread by either:

- **Extending the Thread class**, or
- **Implementing the Runnable interface**

Both approaches let you define what the thread should do in the `run()` method.

**Common Methods of Thread Class:**

| Method        | Description                          |
| :------------ | :----------------------------------- |
| start()       | Starts the thread (calls run())      |
| run()         | Entry point for thread logic         |
| sleep(ms)     | Pauses thread for given milliseconds |
| join()        | Waits for a thread to finish         |
| isAlive()     | Checks if thread is still running    |
| setName()     | Sets thread’s name                   |
| getName()     | Gets thread’s name                   |
| getPriority() | Gets thread’s priority               |

### Creating a Thread by Extending Thread Class

One way to create a thread in Java is by extending the Thread class and overriding its `run()` method.

**Steps:**

1. Create a class that **extends Thread**.
2. Override the **run()** method with the code you want the thread to execute.
3. In the `main()` method, create an object of your class.
4. Call the **start()** method to begin execution of the thread.

The `start()` method internally calls `run()` and starts a new thread of execution.

**Example:**

```java
class MyThread extends Thread {
    public void run() {
        System.out.println("Thread is running...");
    }

    public static void main(String[] args) {
        MyThread t = new MyThread(); // create thread object
        t.start(); // start the thread
    }
}
```

### Creating a Thread by Implementing Runnable Interface

An alternative and often preferred way to create a thread in Java is by implementing the Runnable interface. This keeps your class free to extend other classes.

**Steps:**

1. Create a class that **implements Runnable**.
2. Override the **run()** method with the thread logic.
3. Create an object of your class.
4. Pass that object to a new **Thread** instance.
5. Call **start()** on the Thread object to begin execution.

```java
class MyRunnable implements Runnable {
    public void run() {
        System.out.println("Thread is running...");
    }

    public static void main(String[] args) {
        MyRunnable r = new MyRunnable(); // Create Runnable object
        Thread t = new Thread(r); // Pass it to a Thread
        t.start();
    }
}
```

**Points to Remember:**

1. When we extend Thread class, we cannot override **setName()** and **getName()** functions, because they are declared final in Thread class.
2. We should only call `start()` of the Thread class but not the `run()` method directly, as `start()` internally calls the `run()`, which leads to multitasking or multithreading.
3. While using **sleep()**, always handle the exception it throws.

   ```java
   static void sleep(long milliseconds) throws InterruptedException
   ```

### What Happens If We Call run() Directly Instead of start()?

If you call the `run()` method **directly** (like a normal method call), it will **not** start a new thread. Instead, it will execute in the **current thread**, just like a regular method call.

```java
public class MyThread extends Thread {
    public void run() {
        System.out.println("Running in: " + Thread.currentThread().getName());
    }

    public static void main(String[] args) {
        MyThread t = new MyThread();
        t.run(); // Executes in main thread
    }
}
```

![calling run without start method](/CoreJava_Images/Aspose.Words.ca7bdb30-9d3a-4662-b6b3-a71cea3fd0ef.003.png)

### Can we Start a thread twice?

No, a thread cannot be started twice. If you try to do so, **IllegalThreadStateException** will be thrown.

```java
class MyThread extends Thread {
    public void run() {
        System.out.println("Thread running...");
    }
}

public class IllegalStateEx {
    public static void main(String args[]) {
        MyThread mt = new MyThread();
        mt.start();
        mt.start(); // Exception thrown
    }
}
```

### Joining Threads in Java

Sometimes, one thread needs to wait for another thread to finish before continuing. Java provides two methods for this purpose:

#### isAlive()

Checks if a thread is still running.

```java
final boolean isAlive()
```

- Returns true if the thread is still active.
- Returns false if the thread has finished.

#### join()

Waits for a thread to **die** (complete execution).

```java
final void join() throws InterruptedException
```

- Causes the current thread to pause execution until the specified thread finishes.
- Overloaded versions allow specifying a **maximum wait time** in milliseconds.

**Example Using isAlive() Method:**

```java
class MyThread extends Thread {
    public void run() {
        try {
            for (int i = 1; i <= 5; i++) {
                System.out.println("Child Thread: " + i);
                Thread.sleep(500);
            }
        } catch (InterruptedException e) {
            System.out.println("Child interrupted.");
        }
    }
}

public class IsAliveExample {
    public static void main(String[] args) throws InterruptedException {
        MyThread t = new MyThread();
        t.start();
        System.out.println("Is child thread alive? " + t.isAlive());
        t.join();
        System.out.println("Is child thread alive? " + t.isAlive());
        System.out.println("Main thread ends.");
    }
}
```

**Example Using join() Method in Java:**

```java
class MyThread extends Thread {
    public void run() {
        try {
            for (int i = 1; i <= 3; i++) {
                System.out.println("Child Thread: " + i);
                Thread.sleep(500); // Sleep for half a second
            }
        } catch (InterruptedException e) {
            System.out.println("Child Thread interrupted.");
        }
    }
}

public class JoinExample {
    public static void main(String[] args) throws InterruptedException {
        MyThread t = new MyThread();
        t.start(); // Start the child thread
        t.join(); // Main thread waits here
        System.out.println("Main Thread resumes after child thread completes.");
    }
}
```

#### Specifying time with join()

If in the above program, we specify time while using `join()` with `t1`, then `t1` will execute for that time, and then **t2** and **t3** will join it.

```java
t1.join(1500);
```

Doing so, initially m1 will execute for 1.5 seconds, after which m2 and m3 will join it.

### Synchronization in Java

When **multiple threads** access **shared resources**, we must ensure that **only one thread** accesses the critical section at a time. This is called **synchronization**.

**Why?**

To **prevent data inconsistency** or **race conditions** during multithreaded access.

---

**Two Ways to Achieve Synchronization:**

#### 1. Synchronized Block

Synchronizes only **a specific portion** of code.

```java
synchronized (object) {
    // critical section
}
```

#### 2. Synchronized Method

Locks the **entire method**.

```java
synchronized void methodName() {
    // critical section
}
```

**Example: Synchronized Block**

```java
class Printer {
    void printPages(String user) {
        synchronized (this) {
            for (int i = 1; i <= 3; i++) {
                System.out.println(user + " is printing page " + i);
                try {
                    Thread.sleep(500); // Simulate printing time
                } catch (InterruptedException e) {
                    System.out.println("Printing interrupted.");
                }
            }
        }
    }
}

class UserThread extends Thread {
    Printer printer;
    String userName;
    UserThread(Printer p, String name) {
        printer = p;
        userName = name;
    }
    public void run() {
        printer.printPages(userName);
    }
}

public class SynchronizedBlockExample {
    public static void main(String[] args) {
        Printer sharedPrinter = new Printer();
        UserThread u1 = new UserThread(sharedPrinter, "Alice");
        UserThread u2 = new UserThread(sharedPrinter, "Bob");
        u1.start();
        u2.start();
    }
}
```

**Example: Synchronized Method**

```java
class Printer {
    // Synchronized method
    synchronized void printPages(String user) {
        for (int i = 1; i <= 3; i++) {
            System.out.println(user + " is printing page " + i);
            try {
                Thread.sleep(500); // Simulate time taken to print
            } catch (InterruptedException e) {
                System.out.println("Printing interrupted.");
            }
        }
    }
}

class UserThread extends Thread {
    Printer printer;
    String userName;
    UserThread(Printer p, String name) {
        printer = p;
        userName = name;
    }
    public void run() {
        printer.printPages(userName);
    }
}

public class SynchronizedMethodExample {
    public static void main(String[] args) {
        Printer sharedPrinter = new Printer();
        UserThread u1 = new UserThread(sharedPrinter, "Alice");
        UserThread u2 = new UserThread(sharedPrinter, "Bob");
        u1.start();
        u2.start();
    }
}
```

### Deadlock in Java

**Definition:**

Deadlock is a situation where **two or more threads are blocked forever**, each waiting for the other to release a lock.

This happens when:

- **Thread-1** locks **Resource-A** and waits for **Resource-B**,
- While **Thread-2** locks **Resource-B** and waits for **Resource-A**.

Since both are waiting for each other, **neither can proceed**, leading to a **deadlock**.

**Deadlock Example in Java:**

```java
class Resource {
    String name;
    Resource(String name) {
        this.name = name;
    }
}

class DeadlockExample {
    public static void main(String[] args) {
        Resource r1 = new Resource("Resource-A");
        Resource r2 = new Resource("Resource-B");
        Thread t1 = new Thread(() -> {
            synchronized (r1) {
                System.out.println("Thread-1 locked " + r1.name);
                try { Thread.sleep(100); } catch (Exception e) {}
                synchronized (r2) {
                    System.out.println("Thread-1 locked " + r2.name);
                }
            }
        });
        Thread t2 = new Thread(() -> {
            synchronized (r2) {
                System.out.println("Thread-2 locked " + r2.name);
                try { Thread.sleep(100); } catch (Exception e) {}
                synchronized (r1) {
                    System.out.println("Thread-2 locked " + r1.name);
                }
            }
        });
        t1.start();
        t2.start();
    }
}
```

**How to Prevent Deadlock?**

- Always acquire locks in a **fixed, consistent order**.
- Use **tryLock()** (from ReentrantLock) with timeout.
- Minimize use of nested synchronized blocks.

### Daemon Threads in Java

**Daemon threads** are low-priority threads that run in the background to provide **services** to user threads.

They are also called **service provider threads**, used for:

- **Garbage collection (JVM)**
- **Background music in games**
- **Auto-saving, monitoring, cleanup tasks**, etc.

**Key Characteristics:**

- Runs **in the background** and dies **automatically** when all user (non-daemon) threads finish.
- Default nature of a thread is **non-daemon**.
- Must set as daemon **before starting** the thread.

**Steps to Create a Daemon Thread:**

1. Create a class extending Thread.
2. Create an instance of the class.
3. Call `setDaemon(true)` **before** `start()`.
4. Start the thread with `start()`.

**Example: Daemon Thread**

```java
class MyDaemon extends Thread {
    public void run() {
        while (true) {
            System.out.println("Daemon thread running...");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                System.out.println("Interrupted");
            }
        }
    }
}

public class DaemonExample {
    public static void main(String[] args) {
        MyDaemon t = new MyDaemon();
        t.setDaemon(true); // Must be set before start()
        t.start();
        System.out.println("Main thread ends after 3 seconds...");
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {}
        System.out.println("Main thread finished.");
    }
}
```

### Interthread Communication in Java

Java provides a mechanism for threads to **communicate and cooperate** with each other. This avoids **busy waiting** and helps manage **thread coordination** efficiently.

It is implemented using three methods of the **Object class**:

| Method      | Description                                                                                                                                          |
| :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| wait()      | Makes the current thread **release the lock** and enter the **waiting state** until another thread calls notify() or notifyAll() on the same object. |
| notify()    | Wakes up **one** thread that’s waiting on the object.                                                                                                |
| notifyAll() | Wakes up **all** threads waiting on the object.                                                                                                      |

#### Difference Between wait() and sleep()

| Feature            | wait()                                                        | sleep()                                                   |
| :----------------- | :------------------------------------------------------------ | :-------------------------------------------------------- |
| Synchronized Block | Must be called **within a synchronized block or method**      | No such requirement                                       |
| Lock Handling      | **Releases the monitor** (lock) when waiting                  | **Does not release the monitor**                          |
| Wake-up Condition  | Wakes up **only when notify() or notifyAll()** is called      | Wakes up **automatically after the specified time**       |
| Defined In         | Defined in **Object class**                                   | Defined in **Thread class** (as a static method)          |
| Usage Purpose      | Used for **inter-thread communication**                       | Used to **pause execution** for a specific time           |
| General Use Case   | Used when thread waits on a **condition**                     | Used for **delaying** a thread temporarily                |
| Wake-up Control    | Thread resumes **only when notified** through the same object | Thread resumes **after sleep time elapses** automatically |

**Example on Interthread Communication:**

```java
class CountryCapital {
    String[] countries = {"India", "France", "Japan", "Germany"};
    String[] capitals = {"New Delhi", "Paris", "Tokyo", "Berlin"};
    boolean isCountryTurn = true;

    synchronized void printCountry(int index) {
        try {
            while (!isCountryTurn)
                wait();
            System.out.println("Country: " + countries[index]);
            isCountryTurn = false;
            notify();
        } catch (InterruptedException e) {
            System.out.println("Country thread interrupted");
        }
    }

    synchronized void printCapital(int index) {
        try {
            while (isCountryTurn)
                wait();
            System.out.println("Capital: " + capitals[index]);
            isCountryTurn = true;
            notify();
        } catch (InterruptedException e) {
            System.out.println("Capital thread interrupted");
        }
    }
}

class CountryThread extends Thread {
    CountryCapital cc;
    CountryThread(CountryCapital cc) {
        this.cc = cc;
    }
    public void run() {
        for (int i = 0; i < cc.countries.length; i++) {
            cc.printCountry(i);
        }
    }
}

class CapitalThread extends Thread {
    CountryCapital cc;
    CapitalThread(CountryCapital cc) {
        this.cc = cc;
    }
    public void run() {
        for (int i = 0; i < cc.capitals.length; i++) {
            cc.printCapital(i);
        }
    }
}

public class InterThreadCommunicationExample {
    public static void main(String[] args) {
        CountryCapital cc = new CountryCapital();
        CountryThread country = new CountryThread(cc);
        CapitalThread capital = new CapitalThread(cc);
        country.start();
        capital.start();
    }
}
```
