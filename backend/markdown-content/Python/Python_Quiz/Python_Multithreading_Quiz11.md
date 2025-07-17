### Question

Which of the following best describes multitasking?

- A) Running a single task multiple times
- B) Running multiple tasks simultaneously
- C) Running tasks sequentially
- D) Using multiple CPUs for one task
  **Answer:** B

### Question

In process-based multitasking, what does each process represent?

- A) A thread inside a program
- B) A function inside a thread
- C) An independently executing program
- D) A shared memory block
  **Answer:** C

### Question

Which module is the preferred way to implement multithreading in Python?

- A) multiprocessing
- B) \_thread
- C) queue
- D) threading
  **Answer:** D

### Question

What is the first step in a thread’s life cycle?

- A) Runnable
- B) Running
- C) Blocked
- D) Born
  **Answer:** D

### Question

In the \_thread example, which function is used to start a new thread?

- A) run()
- B) start()
- C) start_new_thread()
- D) begin_thread()
  **Answer:** C

### Question

Which method is automatically called when a thread starts running?

- A) execute()
- B) start()
- C) run()
- D) launch()
  **Answer:** C

### Question

Which of the following is true about sharing resources between threads?

- A) Threads cannot share any resources.
- B) Each thread gets its own copy of the resource.
- C) Shared resources can be accessed simultaneously without issue.
- D) Synchronization is needed to avoid data inconsistency.
  **Answer:** D

### Question

Which class in Python is used to synchronize threads when accessing shared resources?

- A) Semaphore
- B) Queue
- C) Lock
- D) Event
  **Answer:** C

### Question

In the threading example with the Book and Student classes, what does the lock do?

- A) Stops threads from being created
- B) Forces all threads to run in parallel
- C) Ensures only one thread reads the book at a time
- D) Closes the thread after reading
  **Answer:** C

### Question

What happens if a lock is not released after acquiring it?

- A) All threads run faster
- B) Other threads may get blocked indefinitely
- C) Threads will ignore the lock
- D) It has no effect
  **Answer:** B
