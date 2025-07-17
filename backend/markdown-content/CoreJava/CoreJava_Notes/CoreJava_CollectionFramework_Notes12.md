# CORE JAVA NOTES - 12

## Collection Framework

### Java Collections Framework – Simplified

Before Java 2, classes like `Vector`, `Stack`, `Dictionary`, and `Properties` were used to store and manage groups of objects. While helpful, these classes lacked consistency—each worked differently and wasn’t part of a unified system.

To solve this, Java introduced the **Collections Framework**, with the following key goals:

- **High Performance:** Core data structures (like dynamic arrays, linked lists, trees, and hash tables) are implemented efficiently.
- **Uniform Access:** Different types of collections can be used in a similar way.
- **Extensibility:** Easy to extend or create your own collection types.

---

### What is the Collections Framework?

A **collections framework** is a standardized architecture for storing and manipulating groups of objects. It consists of:

#### 1. Interfaces

These define the core behavior of collection types (e.g., `List`, `Set`, `Queue`). They allow code to work with collections abstractly, without worrying about the specific implementation.

#### 2. Implementations (Classes)

These are ready-to-use data structures that implement the collection interfaces, such as:

- `ArrayList` and `LinkedList` (implement List)
- `HashSet` and `TreeSet` (implement Set)

#### 3. Algorithms

These are utility methods for operations like sorting, searching, or shuffling collections. Provided in the `Collections` class, they work across all compatible collection types.

---

### What About Maps?

Although **Maps** (like `HashMap` or `TreeMap`) don’t technically implement the `Collection` interface, they are still part of the framework. Maps store key-value pairs and are fully integrated, meaning they follow similar design and usage principles.

| **S.No** | **Interface**          | **Description**                                                                |
| :------- | :--------------------- | :----------------------------------------------------------------------------- |
| 1        | Collection             | Root interface for working with groups of objects (lists, sets, queues, etc.). |
| 2        | List                   | Extends Collection; stores ordered elements (duplicates allowed).              |
| 3        | Set                    | Extends Collection; stores unique elements (no duplicates).                    |
| 4        | SortedSet              | Extends Set; maintains elements in sorted (natural) order.                     |
| 5        | Map                    | Stores key-value pairs; each key must be unique.                               |
| 6        | Map.Entry              | Represents a key-value pair within a Map; used for iteration.                  |
| 7        | SortedMap              | Extends Map; maintains keys in ascending order.                                |
| 8        | Enumeration _(Legacy)_ | Used to iterate elements in older collections; replaced by Iterator.           |

---

## The Collection Classes

Java provides a set of standard collection classes that implement Collection interfaces. Some of the classes provide full implementations that can be used as-is and others are abstract classes, providing skeletal implementations that are used as starting points for creating concrete collections.

The standard collection classes are summarized in the following table:

| **S.No** | **Class**              | **Description**                                                       |
| -------- | ---------------------- | --------------------------------------------------------------------- |
| 1        | AbstractCollection     | Base class that partially implements Collection.                      |
| 2        | AbstractList           | Extends AbstractCollection; provides base for List implementations.   |
| 3        | AbstractSequentialList | For lists with sequential access (e.g., linked lists).                |
| 4        | LinkedList             | Doubly-linked list; allows fast insertions/deletions.                 |
| 5        | ArrayList              | Resizable array; fast random access.                                  |
| 6        | AbstractSet            | Base class for Set implementations.                                   |
| 7        | HashSet                | Set backed by a hash table (no duplicates, no order).                 |
| 8        | LinkedHashSet          | HashSet with insertion-order preserved.                               |
| 9        | TreeSet                | Sorted set implemented using a tree (usually Red-Black tree).         |
| 10       | AbstractMap            | Base class that partially implements Map.                             |
| 11       | HashMap                | Map backed by a hash table (keys are unique, no guaranteed order).    |
| 12       | TreeMap                | Sorted map; keys stored in ascending order using a tree.              |
| 13       | WeakHashMap            | HashMap with weak keys (eligible for GC if not referenced elsewhere). |
| 14       | LinkedHashMap          | HashMap that maintains insertion order.                               |
| 15       | IdentityHashMap        | Compares keys using reference equality (== instead of .equals()).     |

The AbstractCollection, AbstractSet, AbstractList, AbstractSequentialList andAbstractMap classes provide skeletal implementations of the core collection interfaces, to minimize the effort required to implement them.

The following legacy classes defined by java.util have been discussed in previous tutorial:

| **S.No** | **Class**  | **Description**                                                                         |
| :------- | :--------- | :-------------------------------------------------------------------------------------- |
| 1        | Vector     | A growable array (like ArrayList), but synchronized (thread-safe).                      |
| 2        | Stack      | Subclass of Vector; follows **LIFO** (Last-In, First-Out) principle.                    |
| 3        | Dictionary | Abstract class for key-value storage (superseded by Map).                               |
| 4        | Hashtable  | Concrete implementation of Dictionary; thread-safe version of HashMap.                  |
| 5        | Properties | Subclass of Hashtable; used to store string-based key-value pairs (e.g., config files). |
| 6        | BitSet     | Resizable array of bits (0s and 1s); useful for flags and bitwise operations.           |

**Note:** Most of these are considered **legacy** and have been replaced by more modern classes (ArrayList, HashMap, etc.) in the Java Collections Framework.

## **The Collection Algorithms:**

The collections framework defines several algorithms that can be applied to collections and maps. These algorithms are defined as static methods within the Collections class.

Several of the methods can throw a **ClassCastException**, which occurs when an attempt is made to compare incompatible types, or an**UnsupportedOperationException**, which occurs when an attempt is made to modify an unmodifiable collection.

| **SN** | **Algorithms with Description**                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | <p>[**The Collection Algorithms**](http://www.tutorialspoint.com/java/java_collection_algorithms.htm)</p><p>Here is a list of all the algorithm implementation.</p> |

llections define three static variables: EMPTY_SET, EMPTY_LIST, and EMPTY_MAP. All are immutable.

## How to use an Iterator ?

Often, you will want to cycle through the elements in a collection. For example, you might want to display each element.

The easiest way to do this is to employ an iterator, which is an object that implements either the Iterator or the ListIterator interface.

Iterator enables you to cycle through a collection, obtaining or removing elements. ListIterator extends Iterator to allow bidirectional traversal of a list and the modification of elements.

| **SN** | **Iterator Methods with Description**                                                                                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | <p>[**Using Java Iterator**](http://www.tutorialspoint.com/java/java_using_iterator.htm)</p><p>Here is a list of all the methods with examples provided by Iterator and ListIterator interfaces.</p> |

##

**How to use a Comparator ?**

Both TreeSet and TreeMap store elements in sorted order. However, it is the comparator that defines precisely what sorted order means.

This interface lets us sort a given collection any number of different ways. Also this interface can be used to sort any instances of any class (even classes we cannot modify).

| **SN** | **Iterator Methods with Description**                                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | <p>[**Using Java Comparator**](http://www.tutorialspoint.com/java/java_using_comparator.htm)</p><p>Here is a list of all the methods with examples provided by Comparator Interface.</p> |

Collection framework was not part of original Java release. Collections was added to J2SE 1.2. Prior to Java 2, Java provided adhoc classes such as Dictionary, Vector, Stack and Properties to store and manipulate groups of objects. Collection framework provides many important classes and interfaces to collect and organize group of alike objects.

### Important Interfaces of the Java Collection API

| **Interface** | **Description**                                                                          |
| ------------- | ---------------------------------------------------------------------------------------- |
| Collection    | Root interface for working with groups of objects; top of the collection hierarchy.      |
| List          | Extends Collection; represents an **ordered sequence** of elements (duplicates allowed). |
| Set           | Extends Collection; represents a group of **unique** elements (no duplicates).           |
| SortedSet     | Extends Set; maintains elements in **natural sorted order**.                             |
| Queue         | Extends Collection; elements are processed in **FIFO** (First-In, First-Out) order.      |
| Deque         | Extends Queue; supports **insertion/removal from both ends** (double-ended queue).       |

![collection heirarchy](/CoreJava_Images/Aspose.Words.1bc04a71-f5bf-46e2-99e8-06ace10a91c5.001.png)

### Why Collections Were Made Generic – Short Essay

Java Collections were made **generic** to bring **type safety**, **code clarity**, and **reusability** to the language.

Before generics, collections stored objects as type Object, which meant developers had to **manually cast** objects and handle possible **runtime errors** like ClassCastException. This made the code error-prone and harder to maintain.

With **Generics**, you can specify the **type of elements** a collection can hold (e.g., ArrayList<String>), enabling the compiler to:

- Check for **type mismatches at compile time**
- Eliminate unnecessary **type casting**
- Make the code more **readable** and **robust**

In short, generics made Java collections **safer, cleaner, and more powerful** by enforcing **type correctness** and improving **developer productivity**.

### Collections and Autoboxing – Basic Introduction

In Java, **Collections** (like ArrayList, HashSet, etc.) are used to store groups of objects. However, **Collections can only store objects**, not primitive types like int, double, or char.

That’s where **Autoboxing** comes in.

### ` `Most Common Exceptions in Java Collection Framework

| **Exception Name**            | **Description**                                                                                                |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------- |
| UnsupportedOperationException | Thrown when an operation is not supported (e.g., modifying an unmodifiable collection).                        |
| ClassCastException            | Thrown when an object cannot be cast to the required type (e.g., wrong type in sorting).                       |
| NullPointerException          | Thrown when null is used in a collection that does not allow it (e.g., in TreeSet).                            |
| IllegalArgumentException      | Thrown if an illegal or inappropriate argument is passed to a collection method.                               |
| IllegalStateException         | Thrown when a method is called at an inappropriate time (e.g., calling remove() before next() in an iterator). |

### The Collection Interface

The Collection<E> interface is the **root interface** of the Java Collections Framework. It defines the basic structure and behavior that all collection classes (like List, Set, and Queue) must follow.

Any class that represents a group of elements must **either implement this interface directly or indirectly** through its subinterfaces (List, Set, etc.). It is a **generic interface**, meaning it can hold any type of object specified by <E>.

The Collection interface provides **core methods** for adding, removing, checking presence, and getting information about the elements in the collection. These methods help developers manipulate collections in a uniform way, regardless of the specific implementation being used.

### Commonly Used Methods in Collection

|       **Method**        |                                **Description**                                 |
| :---------------------: | :----------------------------------------------------------------------------: |
|       add(E obj)        | Adds an element to the collection. May not allow duplicates (depends on type). |
|  addAll(Collection c)   |     Adds all elements from another collection c to the current collection.     |
|   remove(Object obj)    |         Removes the specified object from the collection, if present.          |
| removeAll(Collection c) |         Removes all elements that exist in the specified collection c.         |
|  contains(Object obj)   |         Checks whether the collection contains the specified element.          |
|        isEmpty()        |                    Returns true if the collection is empty.                    |
|         size()          |               Returns the number of elements in the collection.                |

**The List Interface**

1. It extends the **Collection** Interface, and defines storage as sequence of elements. Following is its general declaration,

   interface **List** < E >

1. Allows random access and insertion, based on index.
1. It allows duplicate elements.
1. Apart from methods of Collection Interface, it adds following methods of its own.

|         **Method**          |                              **Description**                              |
| :-------------------------: | :-----------------------------------------------------------------------: |
|       get(int index)        |                Returns the element at the specified index.                |
|    set(int index, E obj)    |    Replaces the element at the specified index with the given object.     |
|     indexOf(Object obj)     |  Returns the index of the **first occurrence** of the specified object.   |
|   lastIndexOf(Object obj)   |   Returns the index of the **last occurrence** of the specified object.   |
| subList(int start, int end) | Returns a view of the list between start (inclusive) and end (exclusive). |

### The Set Interface

The Set<E> interface extends the Collection interface and represents a **collection of unique elements** (no duplicates allowed).

- **General Declaration:**

  interface Set<E>

- It **does not define any new methods** beyond those in Collection.
- It is primarily used when you want to **prevent duplicates** in your collection.

### The Queue Interface

The Queue<E> interface extends the Collection interface and represents a **First-In-First-Out (FIFO)** data structure.

- **General Declaration:**

  interface Queue<E>

- It introduces methods that are specifically designed for **queue-based behavior**, including **safe element access** and **insertion** operations.

|  **Method**  |                               **Description**                                |
| :----------: | :--------------------------------------------------------------------------: |
| offer(E obj) |  Inserts the specified element into the queue. Returns true if successful.   |
|    poll()    | Retrieves and removes the head of the queue; returns null if queue is empty. |
|   remove()   |   Retrieves and removes the head; throws NoSuchElementException if empty.    |
|    peek()    |  Retrieves (but does not remove) the head; returns null if queue is empty.   |
|  element()   |     Same as peek(), but throws NoSuchElementException if queue is empty.     |

### Deque Interface

### The Deque<E> (Double-Ended Queue) interface **extends Queue<E>** and supports **insertion and removal from both ends**.

- **General Declaration:**

  interface Deque<E>

- A Deque can be used as:
  - A **queue** (FIFO behavior)
  - A **stack** (LIFO behavior)

### ArrayList Class – Overview

- ArrayList is a **resizable array implementation** of the List interface.
- It **extends AbstractList** and **implements List**, providing dynamic storage of objects.

#### ` `_Key Features:_

1. **Constructors:**
   1. ArrayList() – Creates an empty list with default capacity (10).
   1. ArrayList(Collection c) – Creates a list containing elements of the given collection.
   1. ArrayList(int capacity) – Creates a list with specified initial capacity.
1. **Dynamic Resizing:**
   1. Automatically grows when capacity is exceeded.
1. **Index-Based Access:**
   1. Maintains **insertion order** and allows **random access** using indexes.
1. **Allows Duplicates:**
   1. Supports storing **duplicate elements**.
1. **Not Thread-Safe:**
   1. It is **asynchronous**; external synchronization is required for multithreaded use.
1. **Slower Modifications:**
   1. Insertion or deletion is **slower** compared to LinkedList because it may require shifting elements.

**Example of ArrayList**

```java
import java.util.*;

class ArrayListEx1 {
    public static void main(String[] args) {
        ArrayList<String> states = new ArrayList<String>();
        states.add("Telangana");
        states.add("Kerala");
        states.add("Tamilnadu");
        states.add("Karnataka");
        System.out.println(states);
    }
}
```

### Getting an Array from an ArrayList

The `toArray()` method is used to convert an ArrayList into an array.

#### Why use toArray()?

- **Faster processing** in some scenarios (especially in loops).
- **Compatibility** with methods that accept arrays but not collections.
- **Integration with legacy code** that predates the Collections Framework.

**Example:**

```java
import java.util.ArrayList;

public class ToArrayExample {
    public static void main(String[] args) {
        ArrayList<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");
        names.add("Charlie");
        String[] nameArray = names.toArray(new String[0]);
        for (String name : nameArray) {
            System.out.println(name);
        }
    }
}
```

---

### Storing User-Defined Objects in ArrayList

In the above example we are storing only String objects in ArrayList. But you can store any type of object, including objects of classes that you create.

```java
import java.util.ArrayList;

class Student {
    int id;
    String name;
    Student(int id, String name) {
        this.id = id;
        this.name = name;
    }
    public String toString() {
        return "ID: " + id + ", Name: " + name;
    }
}

public class UserDefinedObjectExample {
    public static void main(String[] args) {
        ArrayList<Student> studentList = new ArrayList<>();
        studentList.add(new Student(1, "Alice"));
        studentList.add(new Student(2, "Bob"));
        studentList.add(new Student(3, "Charlie"));
        for (Student s : studentList) {
            System.out.println(s);
        }
    }
}
```

The `get()` method returns the element at the specified index, whereas the `set()` method changes the element.

```java
System.out.println("Returning element: " + al.get(1));
al.set(1, "Dates");
System.out.println(al);
```

---

### Sorting an ArrayList

The `java.util` package provides a utility class **Collections**, which has the static method `sort()`. Using the `Collections.sort()` method, we can easily sort the ArrayList.

#### Example: Sorting Strings

```java
import java.util.*;

public class SortExample {
    public static void main(String[] args) {
        ArrayList<String> names = new ArrayList<>();
        names.add("Zara");
        names.add("Alice");
        names.add("John");
        Collections.sort(names); // Sort in ascending order
        for (String name : names) {
            System.out.println(name);
        }
    }
}
```

---

**There are various ways to traverse the collection elements:**

1. By Iterator interface
2. By for-each loop
3. By ListIterator interface
4. By for loop
5. By forEach() method
6. By forEachRemaining() method

#### 1. By Iterator Interface

```java
Iterator<String> itr = list.iterator();
while (itr.hasNext()) {
    System.out.println(itr.next());
}
```

#### 2. By For-Each Loop

```java
for (String fruit : list) {
    System.out.println(fruit);
}
```

#### 3. By ListIterator Interface (Allows backward traversal too)

```java
ListIterator<String> listItr = list.listIterator();
while (listItr.hasNext()) {
    System.out.println(listItr.next());
}
```

#### 4. By For Loop (Using Index)

```java
for (int i = 0; i < list.size(); i++) {
    System.out.println(list.get(i));
}
```

#### 5. By forEach() Method (Java 8+)

```java
list.forEach(fruit -> System.out.println(fruit));
```

#### 6. By forEachRemaining() Method

```java
Iterator<String> it = list.iterator();
it.forEachRemaining(fruit -> System.out.println(fruit));
```

---

### Different Ways to Add Elements to an ArrayList

|      **Method**      |                    **Description**                     |
| :------------------: | :----------------------------------------------------: |
|   add(Object obj)    |           Adds a single element to the list.           |
|  add(Collection c)   |  _[Incorrect]_ – No such method exists. Use addAll().  |
| addAll(Collection c) | Adds all elements from another collection to the list. |

#### Examples:

```java
import java.util.*;

public class AddExample {
    public static void main(String[] args) {
        ArrayList<String> list1 = new ArrayList<>();
        // 1. add(Object obj)
        list1.add("Apple");
        list1.add("Banana");
        // 2. add(index, Object obj) - optional: insert at specific position
        list1.add(1, "Mango");
        // 3. addAll(Collection c)
        ArrayList<String> list2 = new ArrayList<>();
        list2.add("Cherry");
        list2.add("Dates");
        list1.addAll(list2); // Adds all elements from list2 to list1
        // Print all elements
        System.out.println(list1);
    }
}
```

---

### LinkedList Class – Overview

1. LinkedList **extends** AbstractSequentialList and **implements** List, Deque, and Queue interfaces.
2. It can function as a **List**, **Queue**, or **Stack** due to its flexible structure.
3. It **allows duplicate elements** and is **not synchronized** (not thread-safe).

#### Example: Using LinkedList

```java
import java.util.*;

public class Test {
    public static void main(String[] args) {
        LinkedList<String> ll = new LinkedList<String>();
        ll.add("a");
        ll.add("b");
        ll.add("c");
        ll.addLast("z");
        ll.addFirst("A");
        System.out.println(ll);
    }
}
```

---

### HashSet Class

1. HashSet **extends** AbstractSet and **implements** the Set interface.
2. It stores elements using a **hash table**, ensuring **fast access and lookup**.
3. **No order** is maintained — elements appear in **unpredictable order**.
4. It is **asynchronous** (not thread-safe).
5. **Duplicates are not allowed**.

#### Example: Using HashSet

```java
import java.util.HashSet;

public class HashSetExample {
    public static void main(String[] args) {
        HashSet<String> set = new HashSet<>();
        set.add("Apple");
        set.add("Banana");
        set.add("Mango");
        set.add("Apple"); // Duplicate, won't be added
        for (String fruit : set) {
            System.out.println(fruit);
        }
    }
}
```

---

### LinkedHashSet Class

1. LinkedHashSet **extends** HashSet and implements the **Set interface**.
2. It **maintains a linked list** of elements internally, preserving the **insertion order**.
3. It does **not allow duplicate elements**, just like HashSet.

#### Example: Using LinkedHashSet

```java
import java.util.LinkedHashSet;

public class LinkedHashSetExample {
    public static void main(String[] args) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        set.add("Banana");
        set.add("Apple");
        set.add("Mango");
        set.add("Banana"); // Duplicate, will be ignored
        for (String fruit : set) {
            System.out.println(fruit);
        }
    }
}
```

---

### TreeSet Class – Overview

1. TreeSet **extends** AbstractSet and **implements** NavigableSet.
2. **Stores elements in ascending sorted order** by default.
3. Internally uses a **Red-Black Tree** (self-balancing binary search tree).
4. **Fast access and retrieval** (logarithmic time for basic operations).
5. It’s a **homogeneous collection** – stores **only same-type objects**.
6. All elements must be **Comparable**; otherwise, a **ClassCastException** is thrown at runtime.
7. To store non-Comparable elements, pass a **Comparator** to the constructor.
8. **Constructors:**
   - TreeSet()
   - TreeSet(Collection c)
   - TreeSet(Comparator comp)
   - TreeSet(SortedSet s)

### Accessing a Collection in Java

To **access, modify, or remove** elements in a collection, we must **iterate through its elements**. Java provides the following three common ways to do this:

### 1. Using Iterator Interface

- Works with all collection types.
- Supports **forward-only traversal**.
- Allows **element removal** during iteration.

```java

import java.util.*;

public class IteratorExample {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("A", "B", "C");
        Iterator<String> itr = list.iterator();
        while (itr.hasNext()) {
            System.out.println(itr.next());
        }
    }
}
```

### 2. Using ListIterator Interface

- Works only with **List** types.
- Supports **bidirectional traversal**.
- Allows **modification and removal** during iteration.

```java
import java.util.*;

public class ListIteratorExample {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("X", "Y", "Z");
        ListIterator<String> litr = list.listIterator();
        while (litr.hasNext()) {
            System.out.println(litr.next());
        }
    }
}
```

### 4. Using For-Each Loop

- Simplest and cleanest.
- Works for **all collections**.
- **Cannot modify or remove** elements directly during iteration.

````java

```java
import java.util.*;

public class ForEachExample {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("One", "Two", "Three");
        for (String item : list) {
            System.out.println(item);
        }
    }
}
````

### Map Interface – Overview

A **Map** stores data as **key-value pairs**:

- **Keys must be unique**
- **Values can be duplicate**
- Both keys and values are **objects**

Although part of the **Collections Framework**, a Map is **not a true Collection** because it does **not extend the Collection interface**. However, we can still obtain a **collection-view** (e.g., using keySet(), values(), entrySet()).

### Important Map Interfaces

| **Interface** | **Description**                                                           |
| :------------ | :------------------------------------------------------------------------ |
| Map           | Maps **unique keys** to values.                                           |
| Map.Entry     | Represents a **key-value pair**; it’s an **inner interface** of Map.      |
| SortedMap     | A subtype of Map where keys are **sorted in ascending order**.            |
| NavigableMap  | Extends SortedMap to support **searches based on closest-match queries**. |

![map interface sub interfaces](/CoreJava_Images/Aspose.Words.1bc04a71-f5bf-46e2-99e8-06ace10a91c5.002.png)

### Commonly Used Methods in Map Interface

| **Method**                           | **Description**                                                        |
| :----------------------------------- | :--------------------------------------------------------------------- |
| boolean containsKey(Object key)      | Returns true if the map contains the specified key.                    |
| Object get(Object key)               | Returns the value associated with the given key, or null if not found. |
| Object put(Object key, Object value) | Adds or updates a key-value pair in the map.                           |
| void putAll(Map m)                   | Adds all entries from another map m into this map.                     |
| Set keySet()                         | Returns a Set containing all the keys in the map.                      |
| Set<Map.Entry> entrySet()            | Returns a Set of all key-value pairs (entries) in the map.             |
| **Method**                           | **Description**                                                        |

### HashMap Class – Overview

1. HashMap **extends** AbstractMap and **implements** the Map interface.
2. It stores data using a **hash table**, offering **constant-time performance** for put() and get() operations (on average).
3. It provides **four constructors**:
   1. HashMap()
   1. HashMap(Map<? extends K, ? extends V> m)
   1. HashMap(int initialCapacity)
   1. HashMap(int initialCapacity, float loadFactor)
4. It **does not maintain any order** of the inserted elements.

**Example: Using HashMap**

```java
import java.util.*;
public class HashMapExample {
    public static void main(String[] args) {
        HashMap<Integer, String> map = new HashMap<>();
        map.put(101, "Apple");
        map.put(102, "Banana");
        map.put(103, "Cherry");
        System.out.println("Value for key 102: " + map.get(102));
        for (Map.Entry<Integer, String> entry : map.entrySet()) {
            System.out.println(entry.getKey() + " => " + entry.getValue());
        }
    }
}
```

**TreeMap class**

1. TreeMap class extends **AbstractMap** and implements **NavigableMap** interface.
1. It creates Map, stored in a tree structure.
1. A **TreeMap** provides an efficient means of storing key/value pair in efficient order.
1. It provides key/value pairs in sorted order and allows rapid retrieval.

**Example:**

```java
import java.util.*;
class TreeMapDemo {
    public static void main(String args[]) {
        TreeMap<String, Integer> tm = new TreeMap<String, Integer>();
        tm.put("a", 100);
        tm.put("b", 200);
        tm.put("c", 300);
        tm.put("d", 400);
        Set<Map.Entry<String, Integer>> st = tm.entrySet();
        for (Map.Entry me : st) {
            System.out.print(me.getKey() + ":");
            System.out.println(me.getValue());
        }
    }
}
```

### LinkedHashMap Class – Overview

1. LinkedHashMap **extends** HashMap and implements the Map interface.
2. It maintains a **linked list** of entries, preserving the **insertion order**.
3. It provides the following **constructors**:
   1. LinkedHashMap()
   1. LinkedHashMap(Map<? extends K, ? extends V> m)
   1. LinkedHashMap(int capacity)
   1. LinkedHashMap(int capacity, float loadFactor)
   1. LinkedHashMap(int capacity, float loadFactor, boolean accessOrder)
      1. If accessOrder is true, the map maintains access order instead of insertion order.

### EnumMap Class – Overview

1. EnumMap **extends** AbstractMap and **implements** the Map interface.
2. It is specifically designed to use **enum constants as keys**.
3. It is **efficient and compact** compared to other map implementations when working with enums.
4. Keys must be from a **single enum type**, which is specified when the map is created.

**Example:**

```java
import java.util.*;
enum Day { MON, TUE, WED }
public class EnumMapExample {
    public static void main(String[] args) {
        EnumMap<Day, String> map = new EnumMap<>(Day.class);
        map.put(Day.MON, "Monday");
        map.put(Day.TUE, "Tuesday");
        map.put(Day.WED, "Wednesday");
        for (Map.Entry<Day, String> entry : map.entrySet()) {
            System.out.println(entry.getKey() + " => " + entry.getValue());
        }
    }
}
```

### Legacy Classes

Early version of java did not include the **Collection** framework. It only defined several classes and interface that provide method for storing objects. When **Collection** framework were added in J2SE 1.2, the original classes were reengineered to support the collection interface. These classes are also known as Legacy classes. All legacy claases and interface were redesign by JDK 5 to support Generics.

The following are the legacy classes defined by **java.util** package

1. Dictionary
1. HashTable
1. Properties
1. Stack
1. Vector

There is only one legacy interface called **Enumeration**

**NOTE:** All the legacy classes are synchronized

### Enumeration Interface

The Enumeration interface is used to **traverse (enumerate) elements** in a collection, mainly in **legacy classes** like Vector and Properties.

1. It has largely been **superseded by the Iterator interface**, which provides more functionality (like element removal).
2. Despite being outdated, some legacy classes **still use Enumeration** for backward compatibility.

```java
boolean hasMoreElements()
Object nextElement()
```

### Vector Class – Overview

1. Vector is similar to ArrayList and represents a **dynamic array** that can grow as needed.
1. The **key difference** is that Vector is **synchronized** (thread-safe), while ArrayList is **not**.
1. Vector belongs to **legacy classes** but has been **reengineered** to support the **Collection Framework** and **generics**.

### Constructors of Vector

| **Constructor**                   | **Description**                                         |
| :-------------------------------- | :------------------------------------------------------ |
| Vector()                          | Creates an empty vector with default capacity 10.       |
| Vector(int size)                  | Creates a vector with specified initial capacity.       |
| Vector(int size, int incr)        | Creates a vector with specified capacity and increment. |
| Vector(Collection<? extends E> c) | Creates a vector containing all elements of c.          |

### Legacy Methods of Vector

| **Method**           | **Description**                                  |
| :------------------- | :----------------------------------------------- |
| addElement(E e)      | Adds an element to the end of the vector.        |
| elementAt(int index) | Returns the element at the specified index.      |
| elements()           | Returns an Enumeration of the vector’s elements. |
| firstElement()       | Returns the first element in the vector.         |
| lastElement()        | Returns the last element in the vector.          |
| removeAllElements()  | Removes all elements from the vector.            |

#### _Example of Vector_

```java

public class Test {

public class Test {
    public static void main(String[] args) {
        Vector ve = new Vector();
        ve.add(10);
        ve.add(20);
        ve.add(30);
        ve.add(40);
        ve.add(50);
        ve.add(60);
        Enumeration en = ve.elements();
        while(en.hasMoreElements()) {
            System.out.println(en.nextElement());
        }
    }
}
```

### Hashtable Class – Overview

1. Hashtable stores **key-value pairs** using a **hash table**, just like HashMap.
1. **Neither keys nor values can be null**.
1. It is **synchronized**, making it **thread-safe**, unlike HashMap which is not.
1. Hashtable is part of the **legacy classes**, but it was retrofitted to support **generics**.

### Basic Example: Using Hashtable

```java
import java.util.*;
public class HashtableExample {
    public static void main(String[] args) {
        Hashtable<Integer, String> table = new Hashtable<>();
        table.put(1, "Java");
        table.put(2, "Python");
        table.put(3, "C++");
        for (Map.Entry<Integer, String> entry : table.entrySet()) {
            System.out.println(entry.getKey() + " => " + entry.getValue());
        }
        System.out.println("Value for key 2: " + table.get(2));
    }
}
```

### Difference Between HashMap and Hashtable

| **Feature**                | **Hashtable**                                                   | **HashMap**                                   |
| :------------------------- | :-------------------------------------------------------------- | :-------------------------------------------- |
| **Thread Safety**          | Synchronized (thread-safe)                                      | Not synchronized (not thread-safe by default) |
| **Performance**            | Slower due to synchronization                                   | Faster (no sync overhead)                     |
| **Null Keys/Values**       | Neither keys nor values can be null                             | Allows one null key and multiple null values  |
| **Order Guarantee**        | Order remains constant, but not predictable                     | No guarantee of order consistency             |
| **Legacy**                 | Legacy class (pre-Java 1.2)                                     | Part of Collections Framework                 |
| **Iterator Type**          | Uses Enumeration (legacy)                                       | Uses Iterator (modern)                        |
| **Use in Multi-threading** | Preferred in multi-threaded applications (with low performance) | Better to use ConcurrentHashMap instead       |

### Properties Class – Overview

1. Properties is a **subclass of Hashtable** designed to store **string-based key-value pairs**.
1. It is commonly used to **read/write configuration data**, such as settings from .properties files.
1. Both **keys and values must be String** types.
1. It provides the ability to **specify default properties**, which are used when a key is not found.

### Example: Using Properties

```java
import java.util.*;

public class PropertiesExample {
    public static void main(String[] args) {
        Properties defaultProps = new Properties();
        defaultProps.setProperty("language", "English");
        Properties props = new Properties(defaultProps);
        props.setProperty("username", "admin");
        System.out.println("Username: " + props.getProperty("username"));
        System.out.println("Language: " + props.getProperty("language")); // from default
        System.out.println("Password: " + props.getProperty("password", "not set")); // fallback default
    }
}
```

### Summary: Java Collections Framework

The **Java Collections Framework** provides a set of **predefined data structures** and **algorithms** to efficiently manage groups of objects.

- A **collection** is an object that holds references to other objects.
- The framework includes a set of **interfaces** (like List, Set, Map, Queue) that define standard operations.
- It also includes **concrete classes** (like ArrayList, HashSet, HashMap) that implement these interfaces.
- Useful **algorithms** (such as sorting and searching) are provided through the Collections utility class.
- All collection-related classes and interfaces are part of the **java.util** package

It promotes **code reusability**, **type safety**, and **performance**, making it easier to work with complex data structures in Java.

###

### QUESTIONS

### Beginner Level

1. **Grocery List Organizer**

   Write a program to manage a list of grocery items. You should be able to add, remove, and display all items.

1. **Library Book Checkout System**

   Simulate a system where a user borrows books. Prevent borrowing of the same book twice and show the list of borrowed books.

1. **Student Attendance Tracker**

   Store daily attendance of students in a classroom. Mark students present or absent and count total attendance.

1. **Movie Rating App**

   Create a program to collect and display user ratings (1 to 5 stars) for movies. Show the average rating per movie.

1. **To-Do List Application**

   Implement a task manager that allows users to add, remove, and mark tasks as completed using a simple menu.

### Intermediate Level

6. **Online Shopping Cart**

   Simulate a shopping cart system where users can add items, update quantities, view total price, and checkout.

7. **Bank Account Manager**

   Create a program to handle bank accounts for customers. Allow operations like deposit, withdrawal, and balance check.

8. **Event Ticket Booking System**

   Manage seat bookings for an event. Ensure that no two users can book the same seat and maintain the booking list.

### Advanced Level

9. **Cab Booking System**

   Simulate a real-time cab booking system. Match users to nearest available cab, calculate fare based on distance, and store booking history.

10. **Restaurant Order Management**

    Create a system that handles restaurant orders. Orders should be grouped by table number, and support multiple simultaneous orders, bill generation, and sorting by order time.
