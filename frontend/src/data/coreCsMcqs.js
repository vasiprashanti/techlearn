export const coreCsMcqs = [
  {
    id: 'cc-1',
    tag: 'OS',
    difficulty: 'Easy',
    question: 'Which of the following best describes a process in an operating system?',
    options: [
      'A program stored on disk',
      'A program in execution with its own state',
      'A CPU scheduling algorithm',
      'A memory page in RAM',
    ],
    correctIndex: 1,
    explanation:
      'A process is an executing instance of a program, along with its current state (registers, memory mappings, open files, etc.).',
  },
  {
    id: 'cc-2',
    tag: 'OS',
    difficulty: 'Medium',
    question: 'What is the primary purpose of a context switch?',
    options: [
      'To increase CPU clock speed',
      'To change the file system format',
      'To switch the CPU from one process/thread to another',
      'To defragment memory',
    ],
    correctIndex: 2,
    explanation:
      'A context switch saves the state of the currently running process/thread and restores the state of the next one so the CPU can continue execution.',
  },
  {
    id: 'cc-3',
    tag: 'Networking',
    difficulty: 'Easy',
    question: 'TCP is generally preferred over UDP when an application needs:',
    options: [
      'Lower overhead and no ordering guarantees',
      'Reliable, ordered delivery of data',
      'Broadcast to many devices by default',
      'No connection establishment overhead',
    ],
    correctIndex: 1,
    explanation:
      'TCP provides reliable, ordered, and error-checked delivery via acknowledgements, retransmissions, and sequencing.',
  },
  {
    id: 'cc-4',
    tag: 'Networking',
    difficulty: 'Medium',
    question: 'Which layer of the OSI model is responsible for end-to-end communication and reliability?',
    options: ['Physical', 'Data Link', 'Transport', 'Session'],
    correctIndex: 2,
    explanation:
      'The Transport layer (Layer 4) provides end-to-end communication services such as reliability, flow control, and segmentation (e.g., TCP).',
  },
  {
    id: 'cc-5',
    tag: 'DBMS',
    difficulty: 'Easy',
    question: 'In ACID properties, the “I” stands for:',
    options: ['Indexing', 'Isolation', 'Integrity', 'Iteration'],
    correctIndex: 1,
    explanation:
      'Isolation ensures that concurrent transactions do not interfere with each other in a way that causes inconsistent results.',
  },
  {
    id: 'cc-6',
    tag: 'DBMS',
    difficulty: 'Medium',
    question: 'Which index structure is commonly used by databases to support efficient range queries?',
    options: ['Hash index', 'B-Tree / B+Tree', 'Bitmap only', 'Stack index'],
    correctIndex: 1,
    explanation:
      'B-Tree/B+Tree indexes keep keys sorted, making them well-suited for range scans and ordered traversal.',
  },
  {
    id: 'cc-7',
    tag: 'OOP',
    difficulty: 'Easy',
    question: 'Encapsulation primarily helps by:',
    options: [
      'Allowing multiple inheritance in all languages',
      'Hiding internal state and exposing a controlled interface',
      'Guaranteeing faster runtime performance',
      'Preventing garbage collection',
    ],
    correctIndex: 1,
    explanation:
      'Encapsulation hides implementation details and exposes behavior via methods/properties, reducing coupling and protecting invariants.',
  },
  {
    id: 'cc-8',
    tag: 'OOP',
    difficulty: 'Hard',
    question: 'Which statement about polymorphism is most accurate?',
    options: [
      'It means using multiple constructors only',
      'It allows the same interface to represent different underlying types/behaviors',
      'It only applies to compile-time generics',
      'It is identical to encapsulation',
    ],
    correctIndex: 1,
    explanation:
      'Polymorphism allows code to treat different types uniformly through a common interface, while runtime dispatch selects the correct implementation.',
  },
];
